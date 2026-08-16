"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { AccessDeniedError } from "../../application/authorization-service";
import type { TrustedIdentity } from "../../domain/authorization";
import type { FulfillmentMode, TenantId } from "../../domain/catalog";
import {
  MAX_PRODUCT_PRICE_IN_CENTS,
  MAX_PRODUCT_DESCRIPTION_LENGTH,
  MAX_PRODUCT_NAME_LENGTH,
  CatalogConflictError,
  CatalogEntityNotFoundError,
  CatalogValidationError,
} from "../../domain/catalog-administration";
import {
  updateDerivedProductAvailability,
  updateDerivedProductCategory,
  updateDerivedProductContent,
  updateDerivedProductPrice,
  updateDerivedProductFulfillmentModes,
} from "../../data/admin-catalog-command.server";
import {
  resolveCurrentIdentity,
  resolveCurrentTenantAccess,
} from "../../data/authentication.server";

export type AvailabilityActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export type PriceActionState = AvailabilityActionState;
export type ContentActionState = AvailabilityActionState;
export type CategoryActionState = AvailabilityActionState;
export type FulfillmentModesActionState = AvailabilityActionState;

const PRODUCT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PRICE_PATTERN = /^\d{1,6}(?:[.,]\d{1,2})?$/;
const FULFILLMENT_MODES: readonly FulfillmentMode[] = ["dine_in", "pickup", "delivery"];

function parsePriceInCents(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || !PRICE_PATTERN.test(value)) return null;
  const [reais, fraction = ""] = value.replace(",", ".").split(".");
  const cents = Number(reais) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents <= MAX_PRODUCT_PRICE_IN_CENTS ? cents : null;
}

async function resolveMutationContext(): Promise<
  | { identity: TrustedIdentity; tenantId: TenantId }
  | AvailabilityActionState
> {
  const identity = await resolveCurrentIdentity();
  if (identity.kind === "denied") {
    return { status: "error", message: "A identidade interna não está mais ativa." };
  }
  const access = await resolveCurrentTenantAccess(identity.identity);
  const membership = access[0];
  if (access.length !== 1 || !membership?.tenantId) {
    return { status: "error", message: "O tenant autorizado não pôde ser derivado." };
  }
  return { identity: identity.identity, tenantId: membership.tenantId };
}

export async function updateProductAvailability(
  _previousState: AvailabilityActionState,
  formData: FormData,
): Promise<AvailabilityActionState> {
  await auth.protect();

  if (formData.get("confirmed") !== "yes") {
    return { status: "error", message: "Confirme conscientemente a alteração." };
  }

  const productId = formData.get("productId");
  const versionValue = formData.get("expectedVersion");
  const availabilityValue = formData.get("isAvailable");
  const expectedVersion = typeof versionValue === "string" ? Number(versionValue) : NaN;
  if (
    typeof productId !== "string" ||
    !PRODUCT_ID_PATTERN.test(productId) ||
    !Number.isSafeInteger(expectedVersion) ||
    expectedVersion < 1 ||
    (availabilityValue !== "true" && availabilityValue !== "false")
  ) {
    return { status: "error", message: "A solicitação de alteração é inválida." };
  }

  const context = await resolveMutationContext();
  if ("status" in context) return context;

  try {
    const result = await updateDerivedProductAvailability({
      identity: context.identity,
      tenantId: context.tenantId,
      productId,
      expectedVersion,
      isAvailable: availabilityValue === "true",
    });
    if (!result) {
      return { status: "error", message: "A persistência administrativa está indisponível." };
    }
  } catch (error) {
    if (error instanceof CatalogConflictError) {
      return { status: "error", message: "O produto mudou. Recarregue e confirme novamente." };
    }
    if (
      error instanceof AccessDeniedError ||
      error instanceof CatalogEntityNotFoundError ||
      error instanceof CatalogValidationError
    ) {
      return { status: "error", message: "A alteração foi recusada com segurança." };
    }
    throw error;
  }

  revalidatePath("/admin");
  return { status: "success", message: "Disponibilidade atualizada e auditada." };
}

export async function updateProductPrice(
  _previousState: PriceActionState,
  formData: FormData,
): Promise<PriceActionState> {
  await auth.protect();

  if (formData.get("confirmed") !== "yes") {
    return { status: "error", message: "Confirme conscientemente a alteração de preço." };
  }

  const productId = formData.get("productId");
  const versionValue = formData.get("expectedVersion");
  const expectedVersion = typeof versionValue === "string" ? Number(versionValue) : NaN;
  const priceInCents = parsePriceInCents(formData.get("price"));
  if (
    typeof productId !== "string" ||
    !PRODUCT_ID_PATTERN.test(productId) ||
    !Number.isSafeInteger(expectedVersion) ||
    expectedVersion < 1 ||
    priceInCents === null
  ) {
    return { status: "error", message: "Informe um preço válido entre R$ 0,00 e R$ 999.999,99." };
  }

  const context = await resolveMutationContext();
  if ("status" in context) return context;

  try {
    const result = await updateDerivedProductPrice({
      identity: context.identity,
      tenantId: context.tenantId,
      productId,
      expectedVersion,
      priceInCents,
    });
    if (!result) {
      return { status: "error", message: "A persistência administrativa está indisponível." };
    }
  } catch (error) {
    if (error instanceof CatalogConflictError) {
      return { status: "error", message: "O produto mudou. Recarregue e confirme novamente." };
    }
    if (
      error instanceof AccessDeniedError ||
      error instanceof CatalogEntityNotFoundError ||
      error instanceof CatalogValidationError
    ) {
      return { status: "error", message: "A alteração foi recusada com segurança." };
    }
    throw error;
  }

  revalidatePath("/admin");
  return { status: "success", message: "Preço atualizado e auditado." };
}

export async function updateProductContent(
  _previousState: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  await auth.protect();

  if (formData.get("confirmed") !== "yes") {
    return { status: "error", message: "Confirme conscientemente a alteração de conteúdo." };
  }

  const productId = formData.get("productId");
  const versionValue = formData.get("expectedVersion");
  const rawName = formData.get("name");
  const rawDescription = formData.get("description");
  const expectedVersion = typeof versionValue === "string" ? Number(versionValue) : NaN;
  const name = typeof rawName === "string" ? rawName.trim() : "";
  const description = typeof rawDescription === "string" ? rawDescription.trim() : "";
  if (
    typeof productId !== "string" ||
    !PRODUCT_ID_PATTERN.test(productId) ||
    !Number.isSafeInteger(expectedVersion) ||
    expectedVersion < 1 ||
    !name ||
    name.length > MAX_PRODUCT_NAME_LENGTH ||
    description.length > MAX_PRODUCT_DESCRIPTION_LENGTH
  ) {
    return { status: "error", message: "Informe nome e descrição dentro dos limites permitidos." };
  }

  const context = await resolveMutationContext();
  if ("status" in context) return context;

  try {
    const result = await updateDerivedProductContent({
      identity: context.identity,
      tenantId: context.tenantId,
      productId,
      expectedVersion,
      name,
      description,
    });
    if (!result) {
      return { status: "error", message: "A persistência administrativa está indisponível." };
    }
  } catch (error) {
    if (error instanceof CatalogConflictError) {
      return { status: "error", message: "O produto mudou. Recarregue e confirme novamente." };
    }
    if (
      error instanceof AccessDeniedError ||
      error instanceof CatalogEntityNotFoundError ||
      error instanceof CatalogValidationError
    ) {
      return { status: "error", message: "A alteração foi recusada com segurança." };
    }
    throw error;
  }

  revalidatePath("/admin");
  return { status: "success", message: "Conteúdo atualizado e auditado." };
}

export async function updateProductCategory(
  _previousState: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  await auth.protect();

  if (formData.get("confirmed") !== "yes") {
    return { status: "error", message: "Confirme conscientemente a nova categoria." };
  }

  const productId = formData.get("productId");
  const categoryId = formData.get("categoryId");
  const versionValue = formData.get("expectedVersion");
  const expectedVersion = typeof versionValue === "string" ? Number(versionValue) : NaN;
  if (
    typeof productId !== "string" ||
    !PRODUCT_ID_PATTERN.test(productId) ||
    typeof categoryId !== "string" ||
    !PRODUCT_ID_PATTERN.test(categoryId) ||
    !Number.isSafeInteger(expectedVersion) ||
    expectedVersion < 1
  ) {
    return { status: "error", message: "A classificação solicitada é inválida." };
  }

  const context = await resolveMutationContext();
  if ("status" in context) return context;

  try {
    const result = await updateDerivedProductCategory({
      identity: context.identity,
      tenantId: context.tenantId,
      productId,
      expectedVersion,
      categoryId,
    });
    if (!result) {
      return { status: "error", message: "A persistência administrativa está indisponível." };
    }
  } catch (error) {
    if (error instanceof CatalogConflictError) {
      return { status: "error", message: "O produto mudou. Recarregue e confirme novamente." };
    }
    if (
      error instanceof AccessDeniedError ||
      error instanceof CatalogEntityNotFoundError ||
      error instanceof CatalogValidationError
    ) {
      return { status: "error", message: "A classificação foi recusada com segurança." };
    }
    throw error;
  }

  revalidatePath("/admin");
  return { status: "success", message: "Categoria atualizada e auditada." };
}

export async function updateProductFulfillmentModes(
  _previousState: FulfillmentModesActionState,
  formData: FormData,
): Promise<FulfillmentModesActionState> {
  await auth.protect();

  if (formData.get("confirmed") !== "yes") {
    return { status: "error", message: "Confirme conscientemente as modalidades." };
  }

  const productId = formData.get("productId");
  const versionValue = formData.get("expectedVersion");
  const expectedVersion = typeof versionValue === "string" ? Number(versionValue) : NaN;
  const rawModes = formData.getAll("fulfillmentModes");
  const fulfillmentModes = rawModes.filter(
    (mode): mode is FulfillmentMode => typeof mode === "string" && FULFILLMENT_MODES.includes(mode as FulfillmentMode),
  );
  if (
    typeof productId !== "string" ||
    !PRODUCT_ID_PATTERN.test(productId) ||
    !Number.isSafeInteger(expectedVersion) ||
    expectedVersion < 1 ||
    fulfillmentModes.length === 0 ||
    fulfillmentModes.length !== rawModes.length ||
    new Set(fulfillmentModes).size !== fulfillmentModes.length
  ) {
    return { status: "error", message: "Selecione ao menos uma modalidade válida." };
  }

  const context = await resolveMutationContext();
  if ("status" in context) return context;

  try {
    const result = await updateDerivedProductFulfillmentModes({
      identity: context.identity,
      tenantId: context.tenantId,
      productId,
      expectedVersion,
      fulfillmentModes,
    });
    if (!result) {
      return { status: "error", message: "A persistência administrativa está indisponível." };
    }
  } catch (error) {
    if (error instanceof CatalogConflictError) {
      return { status: "error", message: "O produto mudou. Recarregue e confirme novamente." };
    }
    if (
      error instanceof AccessDeniedError ||
      error instanceof CatalogEntityNotFoundError ||
      error instanceof CatalogValidationError
    ) {
      return { status: "error", message: "As modalidades foram recusadas com segurança." };
    }
    throw error;
  }

  revalidatePath("/admin");
  return { status: "success", message: "Modalidades atualizadas e auditadas." };
}
