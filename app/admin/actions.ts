"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { AccessDeniedError } from "../../application/authorization-service";
import type { TrustedIdentity } from "../../domain/authorization";
import type { BusinessHours, FulfillmentMode, TenantId } from "../../domain/catalog";
import {
  MAX_PRODUCT_PRICE_IN_CENTS,
  MAX_PRODUCT_DESCRIPTION_LENGTH,
  MAX_PRODUCT_NAME_LENGTH,
  CatalogConflictError,
  CatalogEntityNotFoundError,
  CatalogValidationError,
} from "../../domain/catalog-administration";
import {
  archiveDerivedProduct,
  updateDerivedProduct,
  updateDerivedProductAvailabilityOptions,
  updateDerivedProductCategory,
  updateDerivedProductContent,
  updateDerivedProductPrice,
} from "../../data/admin-catalog-command.server";
import {
  MAX_TENANT_SHORT_NAME_LENGTH,
  MAX_TENANT_TAGLINE_LENGTH,
  TenantProfileConflictError,
  TenantProfileNotFoundError,
  TenantProfileValidationError,
} from "../../domain/tenant-profile-administration";
import { updateDerivedTenantProfile } from "../../data/admin-tenant-profile-command.server";
import { MAX_CATEGORY_NAME_LENGTH, MAX_CATEGORY_SORT_ORDER, CategoryConflictError, CategoryNotFoundError, CategoryValidationError } from "../../domain/category-administration";
import { archiveDerivedCategory, updateDerivedCategory } from "../../data/admin-category-command.server";
import { createDerivedCategory } from "../../data/admin-category-creation.server";
import { enableDerivedDineIn } from "../../data/admin-tenant-fulfillment-command.server";
import { uploadDerivedCatalogImage } from "../../data/admin-catalog-image-command.server";
import {
  MAX_INITIAL_DINE_IN_PRODUCTS,
  TenantFulfillmentConflictError,
  TenantFulfillmentValidationError,
} from "../../domain/tenant-fulfillment-administration";
import {
  CatalogImageAuthorizationError,
  CatalogImageCompensationError,
  CatalogImageConflictError,
  CatalogImageNotFoundError,
  CatalogImageValidationError,
  MAX_IMAGE_ALT_TEXT_LENGTH,
  MAX_SOURCE_IMAGE_BYTES,
} from "../../domain/catalog-image-administration";
import { CatalogImageRateLimitError } from "../../application/catalog-image-upload-rate-limiter";
import { updateDerivedTenantOperations } from "../../data/admin-tenant-operations-command.server";
import {
  PAYMENT_METHODS,
  WEEKDAYS,
  MAX_DINING_TABLES,
  MAX_DINING_TABLE_LABEL_LENGTH,
  MAX_DINING_ENVIRONMENT_LENGTH,
  TenantOperationsConflictError,
  TenantOperationsNotFoundError,
  TenantOperationsValidationError,
  TenantOperationsAuthorizationError,
  type PaymentMethod,
  type UpdateTenantOperationsCommand,
} from "../../domain/tenant-operations-administration";
import {
  recordCatalogImageCleanupPending,
  recordCatalogImageOperationalFailure,
} from "../../application/catalog-image-observability";
import {
  resolveCurrentIdentity,
  resolveCurrentTenantAccess,
} from "../../data/authentication.server";
import { isBrazilianMobileWhatsapp, normalizeBrazilianWhatsapp } from "../../domain/brazilian-whatsapp";
import { loadDerivedTenantCatalog } from "../../data/admin-catalog.server";
import { evaluateTrustedTenantDeliveryCoverage } from "../../data/delivery-coverage.server";
import { LOCAL_COVERAGE_FAR_ADDRESS, LOCAL_COVERAGE_NEAR_ADDRESS } from "../../data/local-delivery-coverage-fixtures";
import { saveDerivedDeliveryOrigin, saveDerivedTenantPrivacy } from "../../data/admin-delivery-governance-command.server";
import { validateDerivedDeliveryOrigin } from "../../data/admin-delivery-origin-validation.server";
import { DeliveryOriginAuthorizationError, DeliveryOriginConflictError, DeliveryOriginNotFoundError, DeliveryOriginValidationError } from "../../domain/delivery-origin-administration";
import { TenantPrivacyAuthorizationError, TenantPrivacyConflictError, TenantPrivacyNotFoundError, TenantPrivacyValidationError } from "../../domain/tenant-privacy-administration";
import { createDerivedProduct } from "../../data/admin-product-creation.server";
import { ProductCreationValidationError } from "../../domain/product-creation";

export type AvailabilityActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export type PriceActionState = AvailabilityActionState;
export type ContentActionState = AvailabilityActionState;
export type CategoryActionState = AvailabilityActionState;
export type ProductAvailabilityOptionsActionState = AvailabilityActionState;
export type TenantProfileActionState = AvailabilityActionState;
export type CategoryManagementActionState = AvailabilityActionState;
export type CategoryCreationActionState = AvailabilityActionState;
export type DineInActivationActionState = AvailabilityActionState;
export type CatalogImageActionState = AvailabilityActionState;
export type TenantOperationsActionState = AvailabilityActionState;
export type DeliveryGovernanceActionState = AvailabilityActionState;
export type ProductCreationActionState = AvailabilityActionState;
export type ProductManagementActionState = AvailabilityActionState;
export type DeliveryCoveragePreviewActionState = AvailabilityActionState & {
  result?: { distanceInKilometers: string; durationInMinutes: number; covered: boolean };
};

const PRODUCT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PRICE_PATTERN = /^\d{1,6}(?:[.,]\d{1,2})?$/;
const FULFILLMENT_MODES: readonly FulfillmentMode[] = ["dine_in", "pickup", "delivery"];
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function hasPostgresErrorCode(error: unknown, code: string): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}

function revalidateAdminSurfaces(): void {
  revalidatePath("/admin");
  revalidatePath("/admin/configuracoes");
  revalidatePath("/cardapio/[tenantSlug]", "page");
}

function parsePriceInCents(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || !PRICE_PATTERN.test(value)) return null;
  const [reais, fraction = ""] = value.replace(",", ".").split(".");
  const cents = Number(reais) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents <= MAX_PRODUCT_PRICE_IN_CENTS ? cents : null;
}

function parseOptionalVersion(value: FormDataEntryValue | null): number | null | undefined {
  if (value === "") return null;
  if (typeof value !== "string") return undefined;
  const version = Number(value);
  return Number.isSafeInteger(version) && version >= 1 ? version : undefined;
}

function formText(formData: FormData, name: string): string | null {
  const value = formData.get(name);
  return typeof value === "string" ? value : null;
}

function normalizeWhatsapp(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") return "";
  return normalizeBrazilianWhatsapp(value);
}

function parseDistanceInMeters(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || !/^\d{1,3}(?:[.,]\d)?$/.test(value)) return null;
  const meters = Number(value.replace(",", ".")) * 1000;
  return Number.isSafeInteger(meters) ? meters : null;
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

  revalidateAdminSurfaces();
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

  revalidateAdminSurfaces();
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

  revalidateAdminSurfaces();
  return { status: "success", message: "Categoria atualizada" };
}

export async function updateProductAvailabilityOptions(
  _previousState: ProductAvailabilityOptionsActionState,
  formData: FormData,
): Promise<ProductAvailabilityOptionsActionState> {
  await auth.protect();

  const productId = formData.get("productId");
  const versionValue = formData.get("expectedVersion");
  const unavailableValue = formData.get("unavailable");
  const isAvailable = unavailableValue !== "yes";
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
    (unavailableValue !== null && unavailableValue !== "yes") ||
    (isAvailable && fulfillmentModes.length === 0) ||
    fulfillmentModes.length !== rawModes.length ||
    new Set(fulfillmentModes).size !== fulfillmentModes.length
  ) {
    return { status: "error", message: "Selecione ao menos uma opção de atendimento válida." };
  }

  const context = await resolveMutationContext();
  if ("status" in context) return context;

  try {
    const result = await updateDerivedProductAvailabilityOptions({
      identity: context.identity,
      tenantId: context.tenantId,
      productId,
      expectedVersion,
      isAvailable,
      ...(isAvailable ? { fulfillmentModes } : {}),
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
      return { status: "error", message: "As opções foram recusadas com segurança." };
    }
    throw error;
  }

  revalidateAdminSurfaces();
  return { status: "success", message: "Opções atualizadas e auditadas." };
}

export async function createProductManagement(
  _previousState: ProductCreationActionState,
  formData: FormData,
): Promise<ProductCreationActionState> {
  await auth.protect();

  const categoryId = formData.get("categoryId");
  const rawName = formData.get("name");
  const rawDescription = formData.get("description");
  const name = typeof rawName === "string" ? rawName.trim() : "";
  const description = typeof rawDescription === "string" ? rawDescription.trim() : "";
  const priceInCents = parsePriceInCents(formData.get("price"));
  const sourceValue = formData.get("image");
  const source = typeof sourceValue === "string" || !sourceValue || sourceValue.size === 0
    ? null
    : sourceValue;
  const rawModes = formData.getAll("fulfillmentModes");
  const fulfillmentModes = rawModes.filter(
    (mode): mode is FulfillmentMode => typeof mode === "string" && FULFILLMENT_MODES.includes(mode as FulfillmentMode),
  );
  const unavailable = formData.get("unavailable") === "yes";
  if (
    typeof categoryId !== "string" || !PRODUCT_ID_PATTERN.test(categoryId) ||
    !name || name.length > MAX_PRODUCT_NAME_LENGTH ||
    description.length > MAX_PRODUCT_DESCRIPTION_LENGTH ||
    priceInCents === null || (!unavailable && fulfillmentModes.length === 0) ||
    fulfillmentModes.length !== rawModes.length ||
    new Set(fulfillmentModes).size !== fulfillmentModes.length
  ) {
    return { status: "error", message: "Revise os dados e selecione ao menos uma opção de atendimento." };
  }
  if (source && (source.size > MAX_SOURCE_IMAGE_BYTES || !ACCEPTED_IMAGE_TYPES.has(source.type))) {
    return { status: "error", message: "Selecione uma imagem JPEG, PNG ou WebP de até 5 MB." };
  }

  const context = await resolveMutationContext();
  if ("status" in context) return context;
  let productId: string;
  try {
    const result = await createDerivedProduct({
      identity: context.identity,
      tenantId: context.tenantId,
      categoryId,
      name,
      description,
      priceInCents,
      isAvailable: !unavailable,
      fulfillmentModes,
    });
    if (!result) return { status: "error", message: "A persistência administrativa está indisponível." };
    productId = result.productId;
  } catch (error) {
    if (
      error instanceof AccessDeniedError ||
      error instanceof CatalogEntityNotFoundError ||
      error instanceof ProductCreationValidationError
    ) {
      return { status: "error", message: "O cadastro do produto foi recusado com segurança." };
    }
    throw error;
  }
  if (source) {
    try {
      const imageResult = await uploadDerivedCatalogImage({
        identity: context.identity,
        command: {
          tenantId: context.tenantId,
          target: { kind: "product", productId },
          expectedVersion: null,
          altText: name,
          source: {
            bytes: new Uint8Array(await source.arrayBuffer()),
            declaredMediaType: source.type,
          },
        },
      });
      if (!imageResult) {
        revalidateAdminSurfaces();
        return { status: "success", message: "Produto criado com a disponibilidade selecionada. A imagem não foi salva e pode ser adicionada ao editar o produto." };
      }
      if (imageResult.previousObjectCleanupPending) recordCatalogImageCleanupPending("product");
    } catch (error) {
      recordCatalogImageOperationalFailure(error, "product");
      revalidateAdminSurfaces();
      return { status: "success", message: "Produto criado com a disponibilidade selecionada. A imagem não foi salva e pode ser adicionada ao editar o produto." };
    }
  }
  revalidateAdminSurfaces();
  return {
    status: "success",
    message: source
      ? "Produto, imagem e disponibilidade salvos."
      : "Produto e disponibilidade salvos.",
  };
}

export async function updateProductManagement(
  _previousState: ProductManagementActionState,
  formData: FormData,
): Promise<ProductManagementActionState> {
  await auth.protect();
  const productId = formData.get("productId");
  const versionValue = formData.get("expectedVersion");
  const expectedVersion = typeof versionValue === "string" ? Number(versionValue) : NaN;
  const intent = formData.get("intent");
  if (typeof productId !== "string" || !PRODUCT_ID_PATTERN.test(productId) ||
      !Number.isSafeInteger(expectedVersion) || expectedVersion < 1) {
    return { status: "error", message: "O produto informado é inválido." };
  }
  const context = await resolveMutationContext();
  if ("status" in context) return context;

  if (intent === "archive") {
    if (formData.get("confirmArchive") !== "yes") {
      return { status: "error", message: "Confirme a exclusão do produto." };
    }
    try {
      const result = await archiveDerivedProduct({
        identity: context.identity, tenantId: context.tenantId, productId, expectedVersion,
      });
      if (!result) return { status: "error", message: "A persistência administrativa está indisponível." };
      revalidateAdminSurfaces();
      return { status: "success", message: "Produto excluído do catálogo e preservado na auditoria." };
    } catch (error) {
      if (error instanceof CatalogConflictError) return { status: "error", message: "O produto mudou. Recarregue antes de excluir." };
      if (error instanceof AccessDeniedError || error instanceof CatalogEntityNotFoundError || error instanceof CatalogValidationError) {
        return { status: "error", message: "A exclusão do produto foi recusada com segurança." };
      }
      throw error;
    }
  }

  const categoryId = formData.get("categoryId");
  const rawName = formData.get("name");
  const rawDescription = formData.get("description");
  const name = typeof rawName === "string" ? rawName.trim() : "";
  const description = typeof rawDescription === "string" ? rawDescription.trim() : "";
  const priceInCents = parsePriceInCents(formData.get("price"));
  const unavailable = formData.get("unavailable") === "yes";
  const rawModes = formData.getAll("fulfillmentModes");
  const fulfillmentModes = rawModes.filter(
    (mode): mode is FulfillmentMode => typeof mode === "string" && FULFILLMENT_MODES.includes(mode as FulfillmentMode),
  );
  const sourceValue = formData.get("image");
  const source = typeof sourceValue === "string" || !sourceValue || sourceValue.size === 0 ? null : sourceValue;
  const imageVersion = parseOptionalVersion(formData.get("imageVersion"));
  if (typeof categoryId !== "string" || !PRODUCT_ID_PATTERN.test(categoryId) || !name ||
      name.length > MAX_PRODUCT_NAME_LENGTH || description.length > MAX_PRODUCT_DESCRIPTION_LENGTH ||
      priceInCents === null || (!unavailable && fulfillmentModes.length === 0) ||
      fulfillmentModes.length !== rawModes.length || new Set(fulfillmentModes).size !== fulfillmentModes.length ||
      imageVersion === undefined || (source && (source.size > MAX_SOURCE_IMAGE_BYTES || !ACCEPTED_IMAGE_TYPES.has(source.type)))) {
    return { status: "error", message: "Revise os dados do produto e a imagem selecionada." };
  }
  try {
    const updated = await updateDerivedProduct({
      identity: context.identity, tenantId: context.tenantId, productId, expectedVersion,
      name, description, priceInCents, categoryId, isAvailable: !unavailable,
      ...(unavailable ? {} : { fulfillmentModes }),
    });
    if (!updated) return { status: "error", message: "A persistência administrativa está indisponível." };
  } catch (error) {
    if (error instanceof CatalogConflictError) {
      return { status: "error", message: "O produto mudou. Recarregue antes de salvar novamente." };
    }
    if (error instanceof AccessDeniedError || error instanceof CatalogEntityNotFoundError || error instanceof CatalogValidationError) {
      return { status: "error", message: "A atualização do produto foi recusada com segurança." };
    }
    throw error;
  }
  if (source) {
    try {
      const imageResult = await uploadDerivedCatalogImage({ identity: context.identity, command: {
        tenantId: context.tenantId, target: { kind: "product", productId }, expectedVersion: imageVersion,
        altText: name, source: { bytes: new Uint8Array(await source.arrayBuffer()), declaredMediaType: source.type },
      }});
      if (!imageResult) return { status: "success", message: "Produto atualizado. A nova imagem não foi salva." };
    } catch (error) {
      recordCatalogImageOperationalFailure(error, "product");
      revalidateAdminSurfaces();
      return { status: "success", message: "Produto atualizado. A nova imagem não foi salva e pode ser enviada novamente." };
    }
  }
  revalidateAdminSurfaces();
  return { status: "success", message: "Produto atualizado e auditado." };
}

export async function updateTenantProfile(
  _previousState: TenantProfileActionState,
  formData: FormData,
): Promise<TenantProfileActionState> {
  await auth.protect();

  const versionValue = formData.get("expectedVersion");
  const expectedVersion = typeof versionValue === "string" ? Number(versionValue) : NaN;
  const rawShortName = formData.get("shortName");
  const rawTagline = formData.get("tagline");
  const shortName = typeof rawShortName === "string" ? rawShortName.trim() : "";
  const tagline = typeof rawTagline === "string" ? rawTagline.trim() : "";
  if (
    !Number.isSafeInteger(expectedVersion) ||
    expectedVersion < 1 ||
    !shortName ||
    shortName.length > MAX_TENANT_SHORT_NAME_LENGTH ||
    !tagline ||
    tagline.length > MAX_TENANT_TAGLINE_LENGTH
  ) {
    return { status: "error", message: "Informe nome da empresa e slogan dentro dos limites." };
  }

  const context = await resolveMutationContext();
  if ("status" in context) return context;

  try {
    const result = await updateDerivedTenantProfile({
      identity: context.identity,
      tenantId: context.tenantId,
      expectedVersion,
      shortName,
      tagline,
    });
    if (!result) {
      return { status: "error", message: "A persistência administrativa está indisponível." };
    }
  } catch (error) {
    if (error instanceof TenantProfileConflictError) {
      return { status: "error", message: "O perfil mudou. Recarregue e confirme novamente." };
    }
    if (
      error instanceof AccessDeniedError ||
      error instanceof TenantProfileNotFoundError ||
      error instanceof TenantProfileValidationError
    ) {
      return { status: "error", message: "A alteração do perfil foi recusada com segurança." };
    }
    throw error;
  }

  revalidateAdminSurfaces();
  return { status: "success", message: "" };
}

export async function updateCategoryManagement(
  _previousState: CategoryManagementActionState,
  formData: FormData,
): Promise<CategoryManagementActionState> {
  await auth.protect();
  const intent = formData.get("intent");
  const categoryId = formData.get("categoryId");
  const versionValue = formData.get("expectedVersion");
  const expectedVersion = typeof versionValue === "string" ? Number(versionValue) : NaN;
  if (typeof categoryId !== "string" || !PRODUCT_ID_PATTERN.test(categoryId) ||
      !Number.isSafeInteger(expectedVersion) || expectedVersion < 1) {
    return { status: "error", message: "A categoria informada é inválida." };
  }
  if (intent === "archive") {
    if (formData.get("confirmArchive") !== "yes") return { status: "error", message: "Confirme a exclusão da categoria." };
    const context = await resolveMutationContext();
    if ("status" in context) return context;
    try {
      const result = await archiveDerivedCategory({ identity: context.identity, tenantId: context.tenantId, categoryId, expectedVersion });
      if (!result) return { status: "error", message: "A persistência administrativa está indisponível." };
    } catch (error) {
      if (hasPostgresErrorCode(error, "42501")) {
        return { status: "error", message: "O arquivamento de categorias ainda não foi habilitado no banco local." };
      }
      if (error instanceof CategoryConflictError) return { status: "error", message: "A categoria mudou. Recarregue antes de excluir." };
      if (error instanceof AccessDeniedError || error instanceof CategoryNotFoundError || error instanceof CategoryValidationError) {
        return { status: "error", message: error instanceof CategoryValidationError ? "Remova ou transfira os produtos antes de excluir a categoria." : "A exclusão da categoria foi recusada com segurança." };
      }
      throw error;
    }
    revalidateAdminSurfaces();
    return { status: "success", message: "Categoria excluída com sucesso." };
  }
  if (formData.get("confirmed") !== "yes") {
    return { status: "error", message: "Confirme conscientemente a alteração da categoria." };
  }
  const rawName = formData.get("name");
  const orderValue = formData.get("sortOrder");
  const name = typeof rawName === "string" ? rawName.trim() : "";
  const sortOrder = typeof orderValue === "string" ? Number(orderValue) : NaN;
  if (
    typeof categoryId !== "string" || !PRODUCT_ID_PATTERN.test(categoryId) ||
    !Number.isSafeInteger(expectedVersion) || expectedVersion < 1 ||
    !name || name.length > MAX_CATEGORY_NAME_LENGTH ||
    !Number.isSafeInteger(sortOrder) || sortOrder < 0 || sortOrder > MAX_CATEGORY_SORT_ORDER
  ) {
    return { status: "error", message: "Informe nome e ordem dentro dos limites permitidos." };
  }
  const context = await resolveMutationContext();
  if ("status" in context) return context;
  try {
    const result = await updateDerivedCategory({
      identity: context.identity,
      tenantId: context.tenantId,
      categoryId,
      expectedVersion,
      name,
      sortOrder,
    });
    if (!result) return { status: "error", message: "A persistência administrativa está indisponível." };
  } catch (error) {
    if (error instanceof CategoryConflictError) {
      return { status: "error", message: "A categoria mudou. Recarregue e confirme novamente." };
    }
    if (error instanceof AccessDeniedError || error instanceof CategoryNotFoundError || error instanceof CategoryValidationError) {
      return { status: "error", message: "A alteração da categoria foi recusada com segurança." };
    }
    throw error;
  }
  revalidateAdminSurfaces();
  return { status: "success", message: "Categoria atualizada e auditada." };
}

export async function createCategoryManagement(
  _previousState: CategoryCreationActionState,
  formData: FormData,
): Promise<CategoryCreationActionState> {
  await auth.protect();
  if (formData.get("confirmed") !== "yes") {
    return { status: "error", message: "Confirme conscientemente a criação da categoria." };
  }
  const rawName = formData.get("name");
  const orderValue = formData.get("sortOrder");
  const name = typeof rawName === "string" ? rawName.trim() : "";
  const sortOrder = typeof orderValue === "string" ? Number(orderValue) : NaN;
  if (
    !name || name.length > MAX_CATEGORY_NAME_LENGTH ||
    !Number.isSafeInteger(sortOrder) || sortOrder < 0 || sortOrder > MAX_CATEGORY_SORT_ORDER
  ) {
    return { status: "error", message: "Informe nome e ordem dentro dos limites permitidos." };
  }
  const context = await resolveMutationContext();
  if ("status" in context) return context;
  try {
    const result = await createDerivedCategory({
      identity: context.identity,
      tenantId: context.tenantId,
      name,
      sortOrder,
    });
    if (!result) {
      return { status: "error", message: "A persistência administrativa está indisponível." };
    }
  } catch (error) {
    if (error instanceof AccessDeniedError || error instanceof CategoryValidationError) {
      return { status: "error", message: "A criação da categoria foi recusada com segurança." };
    }
    throw error;
  }
  revalidateAdminSurfaces();
  return { status: "success", message: "Categoria criada e auditada." };
}

export async function activateDineIn(
  _previousState: DineInActivationActionState,
  formData: FormData,
): Promise<DineInActivationActionState> {
  await auth.protect();
  if (formData.get("confirmed") !== "yes") {
    return { status: "error", message: "Confirme conscientemente a ativação." };
  }
  const rawProductIds = formData.getAll("productIds");
  const productIds = rawProductIds.filter((value): value is string => typeof value === "string");
  if (
    productIds.length !== rawProductIds.length ||
    productIds.length < 1 ||
    productIds.length > MAX_INITIAL_DINE_IN_PRODUCTS ||
    new Set(productIds).size !== productIds.length ||
    productIds.some((productId) => !PRODUCT_ID_PATTERN.test(productId))
  ) {
    return { status: "error", message: "Selecione ao menos um produto válido, sem duplicatas." };
  }
  const context = await resolveMutationContext();
  if ("status" in context) return context;
  try {
    const result = await enableDerivedDineIn({
      identity: context.identity,
      tenantId: context.tenantId,
      initialProductIds: productIds,
    });
    if (!result) {
      return { status: "error", message: "A persistência administrativa está indisponível." };
    }
  } catch (error) {
    if (error instanceof TenantFulfillmentConflictError) {
      return { status: "error", message: "Na mesa já foi ativado. Recarregue o painel." };
    }
    if (error instanceof AccessDeniedError || error instanceof TenantFulfillmentValidationError) {
      return { status: "error", message: "A ativação foi recusada com segurança." };
    }
    throw error;
  }
  revalidateAdminSurfaces();
  return { status: "success", message: "Na mesa ativado e auditado." };
}

export async function uploadCatalogImage(
  _previousState: CatalogImageActionState,
  formData: FormData,
): Promise<CatalogImageActionState> {
  await auth.protect();
  const targetKind = formData.get("targetKind");
  const productIdValue = formData.get("productId");
  const versionValue = formData.get("expectedVersion");
  const altTextValue = formData.get("altText");
  const source = formData.get("image");
  const expectedVersion = versionValue === ""
    ? null
    : typeof versionValue === "string" ? Number(versionValue) : NaN;
  const altText = typeof altTextValue === "string" ? altTextValue.trim() : undefined;
  const isProduct = targetKind === "product";
  if (
    (targetKind !== "tenant_logo" && !isProduct) ||
    (isProduct && (typeof productIdValue !== "string" || !PRODUCT_ID_PATTERN.test(productIdValue))) ||
    (expectedVersion !== null && (!Number.isSafeInteger(expectedVersion) || expectedVersion < 1)) ||
    typeof source === "string" || !source || source.size < 1 || source.size > MAX_SOURCE_IMAGE_BYTES ||
    !ACCEPTED_IMAGE_TYPES.has(source.type) ||
    (isProduct && (!altText || altText.length > MAX_IMAGE_ALT_TEXT_LENGTH))
  ) {
    return { status: "error", message: "Selecione uma imagem JPEG, PNG ou WebP de até 5 MB e revise os campos." };
  }

  const context = await resolveMutationContext();
  if ("status" in context) return context;
  try {
    const result = await uploadDerivedCatalogImage({
      identity: context.identity,
      command: {
        tenantId: context.tenantId,
        target: isProduct
          ? { kind: "product", productId: productIdValue as string }
          : { kind: "tenant_logo" },
        expectedVersion,
        ...(isProduct ? { altText } : {}),
        source: {
          bytes: new Uint8Array(await source.arrayBuffer()),
          declaredMediaType: source.type,
        },
      },
    });
    if (!result) {
      return { status: "error", message: "O serviço seguro de imagens está indisponível." };
    }
    if (result.previousObjectCleanupPending) {
      recordCatalogImageCleanupPending(isProduct ? "product" : "tenant_logo");
    }
    revalidateAdminSurfaces();
    return {
      status: "success",
      message: result.previousObjectCleanupPending
        ? "Imagem salva. A limpeza da versão anterior ficou pendente para reconciliação."
        : "Imagem processada, armazenada e auditada.",
    };
  } catch (error) {
    if (error instanceof CatalogImageConflictError) {
      return { status: "error", message: "A imagem mudou. Recarregue e confirme novamente." };
    }
    if (error instanceof CatalogImageRateLimitError) {
      return { status: "error", message: "Limite temporário de imagens atingido. Aguarde antes de tentar novamente." };
    }
    if (error instanceof CatalogImageCompensationError) {
      recordCatalogImageOperationalFailure(error, isProduct ? "product" : "tenant_logo");
      return { status: "error", message: "O envio falhou e exige limpeza operacional. Nenhum novo metadado foi publicado." };
    }
    if (
      error instanceof AccessDeniedError ||
      error instanceof CatalogImageAuthorizationError ||
      error instanceof CatalogImageNotFoundError ||
      error instanceof CatalogImageValidationError
    ) {
      return { status: "error", message: "A imagem foi recusada com segurança." };
    }
    recordCatalogImageOperationalFailure(error, isProduct ? "product" : "tenant_logo");
    return { status: "error", message: "O armazenamento da imagem falhou temporariamente. Tente novamente." };
  }
}

type OperationsSectionChanges = UpdateTenantOperationsCommand extends infer Command
  ? Command extends UpdateTenantOperationsCommand
    ? Omit<Command, "tenantId" | "expectedVersion">
    : never
  : never;

async function persistOperationsSection(
  context: { identity: TrustedIdentity; tenantId: TenantId },
  expectedVersion: number,
  changes: OperationsSectionChanges,
): Promise<TenantOperationsActionState> {
  try {
    const command = {
      tenantId: context.tenantId,
      expectedVersion,
      ...changes,
    } as UpdateTenantOperationsCommand;
    const result = await updateDerivedTenantOperations({ identity: context.identity, command });
    if (!result) return { status: "error", message: "A persistência operacional está indisponível." };
  } catch (error) {
    if (error instanceof TenantOperationsConflictError) {
      return { status: "error", message: "As configurações mudaram. Recarregue e tente novamente." };
    }
    if (error instanceof AccessDeniedError || error instanceof TenantOperationsAuthorizationError ||
        error instanceof TenantOperationsNotFoundError || error instanceof TenantOperationsValidationError) {
      return { status: "error", message: "A configuração foi recusada com segurança." };
    }
    throw error;
  }
  revalidateAdminSurfaces();
  return { status: "success", message: "Configurações salvas." };
}

function parseExpectedOperationsVersion(formData: FormData): number | null {
  const version = Number(formData.get("expectedVersion"));
  return Number.isSafeInteger(version) && version >= 1 ? version : null;
}

function parseBusinessHours(formData: FormData): BusinessHours[] {
  return WEEKDAYS.flatMap((weekday) => {
    if (formData.get(`closed-${weekday}`) === "yes") return [];
    const opensAt = formData.get(`opens-${weekday}`);
    const closesAt = formData.get(`closes-${weekday}`);
    return typeof opensAt === "string" && typeof closesAt === "string" ? [{ weekday, opensAt, closesAt }] : [];
  });
}

function parseDiningTables(formData: FormData): string[] | null {
  const value = formData.get("diningTables");
  if (typeof value !== "string") return null;
  const rows = value.split(/\r?\n/).map((row) => row.trim()).filter(Boolean);
  if (rows.length > MAX_DINING_TABLES) return null;
  const labels = rows.map((row) => {
    const separator = row.indexOf("|");
    if (separator < 1) return null;
    const environment = row.slice(0, separator).trim();
    const table = row.slice(separator + 1).trim();
    if (!environment || !table || environment.includes("·") || table.includes("·") || table.includes("|") ||
        environment.length > MAX_DINING_ENVIRONMENT_LENGTH || table.length > MAX_DINING_TABLE_LABEL_LENGTH) return null;
    return `${environment} · ${table}`;
  });
  if (labels.some((label) => label === null)) return null;
  const validLabels = labels as string[];
  return new Set(validLabels.map((label) => label.toLocaleLowerCase("pt-BR"))).size === validLabels.length ? validLabels : null;
}

export async function updateTenantAttendance(
  _previousState: TenantOperationsActionState,
  formData: FormData,
): Promise<TenantOperationsActionState> {
  await auth.protect();
  const expectedVersion = parseExpectedOperationsVersion(formData);
  const whatsappNumber = normalizeWhatsapp(formData.get("whatsappNumber"));
  if (expectedVersion === null || !isBrazilianMobileWhatsapp(whatsappNumber)) {
    return { status: "error", message: "Revise o WhatsApp e os horários." };
  }
  const context = await resolveMutationContext();
  if ("status" in context) return context;
  return persistOperationsSection(context, expectedVersion, { section: "attendance", whatsappNumber, businessHours: parseBusinessHours(formData) });
}

export async function updateTenantTables(
  _previousState: TenantOperationsActionState,
  formData: FormData,
): Promise<TenantOperationsActionState> {
  await auth.protect();
  const expectedVersion = parseExpectedOperationsVersion(formData);
  const diningTables = parseDiningTables(formData);
  if (expectedVersion === null || diningTables === null) {
    return { status: "error", message: "Revise os ambientes e as identificações das mesas." };
  }
  const context = await resolveMutationContext();
  if ("status" in context) return context;
  return persistOperationsSection(context, expectedVersion, { section: "tables", diningTables });
}

export async function updateTenantFinance(
  _previousState: TenantOperationsActionState,
  formData: FormData,
): Promise<TenantOperationsActionState> {
  await auth.protect();
  const expectedVersion = parseExpectedOperationsVersion(formData);
  const minimumOrderInCents = parsePriceInCents(formData.get("minimumOrder"));
  const rawPaymentMethods = formData.getAll("paymentMethods");
  const paymentMethods = rawPaymentMethods.filter((value): value is PaymentMethod =>
    typeof value === "string" && PAYMENT_METHODS.includes(value as PaymentMethod));
  if (expectedVersion === null || minimumOrderInCents === null || paymentMethods.length !== rawPaymentMethods.length) {
    return { status: "error", message: "Revise o pedido mínimo e as formas de pagamento." };
  }
  const context = await resolveMutationContext();
  if ("status" in context) return context;
  return persistOperationsSection(context, expectedVersion, { section: "finance", minimumOrderInCents, paymentMethods });
}

export async function updateTenantLogistics(
  _previousState: TenantOperationsActionState,
  formData: FormData,
): Promise<TenantOperationsActionState> {
  await auth.protect();
  const expectedVersion = parseExpectedOperationsVersion(formData);
  const deliveryFeeInCents = parsePriceInCents(formData.get("deliveryFee"));
  const maximumDeliveryDistanceInMeters = parseDistanceInMeters(formData.get("maximumDeliveryDistance"));
  if (expectedVersion === null || deliveryFeeInCents === null || maximumDeliveryDistanceInMeters === null) {
    return { status: "error", message: "Revise a taxa e a distância para entrega." };
  }
  const context = await resolveMutationContext();
  if ("status" in context) return context;
  return persistOperationsSection(context, expectedVersion, { section: "logistics", deliveryFeeInCents, maximumDeliveryDistanceInMeters });
}

export async function saveTenantPrivacy(
  _previousState: DeliveryGovernanceActionState,
  formData: FormData,
): Promise<DeliveryGovernanceActionState> {
  await auth.protect();
  const expectedVersion = parseOptionalVersion(formData.get("expectedVersion"));
  const controllerLegalName = formText(formData, "controllerLegalName");
  const privacyEmail = formText(formData, "privacyEmail");
  const orderAddressRetentionDays = Number(formData.get("retentionDays"));
  if (expectedVersion === undefined || controllerLegalName === null || privacyEmail === null ||
      !Number.isSafeInteger(orderAddressRetentionDays)) {
    return { status: "error", message: "Revise os dados de privacidade informados." };
  }
  const context = await resolveMutationContext();
  if ("status" in context) return context;
  try {
    const result = await saveDerivedTenantPrivacy({ identity: context.identity, command: {
      tenantId: context.tenantId, expectedVersion, controllerLegalName, privacyEmail, orderAddressRetentionDays,
    } });
    if (!result) return { status: "error", message: "A persistência de privacidade está indisponível." };
  } catch (error) {
    if (error instanceof TenantPrivacyConflictError) return { status: "error", message: "Os dados mudaram. Recarregue e tente novamente." };
    if (error instanceof AccessDeniedError || error instanceof TenantPrivacyAuthorizationError ||
        error instanceof TenantPrivacyNotFoundError || error instanceof TenantPrivacyValidationError) {
      return { status: "error", message: "A configuração de privacidade foi recusada com segurança." };
    }
    throw error;
  }
  revalidateAdminSurfaces();
  return { status: "success", message: "Configuração de privacidade salva." };
}

export async function saveDeliveryOrigin(
  _previousState: DeliveryGovernanceActionState,
  formData: FormData,
): Promise<DeliveryGovernanceActionState> {
  await auth.protect();
  const expectedVersion = parseOptionalVersion(formData.get("expectedVersion"));
  const fields = {
    label: formText(formData, "label"), postalCode: formText(formData, "postalCode"),
    street: formText(formData, "street"), number: formText(formData, "number"),
    complement: formText(formData, "complement"), neighborhood: formText(formData, "neighborhood"),
    city: formText(formData, "city"), state: formText(formData, "state"),
  };
  if (expectedVersion === undefined || Object.values(fields).some((value) => value === null)) {
    return { status: "error", message: "Revise o endereço de origem informado." };
  }
  const context = await resolveMutationContext();
  if ("status" in context) return context;
  try {
    const result = await saveDerivedDeliveryOrigin({ identity: context.identity, command: {
      tenantId: context.tenantId, expectedVersion,
      label: fields.label!, postalCode: fields.postalCode!, street: fields.street!, number: fields.number!,
      ...(fields.complement!.trim() ? { complement: fields.complement! } : {}),
      neighborhood: fields.neighborhood!, city: fields.city!, state: fields.state!,
    } });
    if (!result) return { status: "error", message: "A persistência da origem está indisponível." };
  } catch (error) {
    if (error instanceof DeliveryOriginConflictError) return { status: "error", message: "A origem mudou. Recarregue e tente novamente." };
    if (error instanceof AccessDeniedError || error instanceof DeliveryOriginAuthorizationError ||
        error instanceof DeliveryOriginNotFoundError || error instanceof DeliveryOriginValidationError) {
      return { status: "error", message: "A origem da entrega foi recusada com segurança." };
    }
    throw error;
  }
  revalidateAdminSurfaces();
  return { status: "success", message: "Origem da entrega salva. Valide-a abaixo quando desejar calcular a cobertura." };
}

export async function validateDeliveryOrigin(
  _previousState: DeliveryGovernanceActionState,
  formData: FormData,
): Promise<DeliveryGovernanceActionState> {
  await auth.protect();
  const expectedVersion = parseOptionalVersion(formData.get("expectedVersion"));
  if (expectedVersion === null || expectedVersion === undefined) {
    return { status: "error", message: "Salve a origem antes de validar." };
  }
  const context = await resolveMutationContext();
  if ("status" in context) return context;
  try {
    const result = await validateDerivedDeliveryOrigin({ identity: context.identity, tenantId: context.tenantId, expectedVersion });
    if (result.kind === "verified") {
      revalidateAdminSurfaces();
      return { status: "success", message: "Origem validada geograficamente." };
    }
    if (result.kind === "not_found") {
      revalidateAdminSurfaces();
      return { status: "error", message: "A Geoapify não encontrou a origem informada." };
    }
    if (result.kind === "ambiguous") {
      revalidateAdminSurfaces();
      return { status: "error", message: "A origem retornou mais de um resultado. Revise o endereço." };
    }
    return { status: "error", message: "A validação geográfica está temporariamente indisponível." };
  } catch (error) {
    if (error instanceof DeliveryOriginConflictError) return { status: "error", message: "A origem mudou. Recarregue e tente novamente." };
    if (error instanceof AccessDeniedError || error instanceof DeliveryOriginNotFoundError) {
      return { status: "error", message: "A validação da origem foi recusada com segurança." };
    }
    throw error;
  }
}

export async function testLocalDeliveryCoverage(
  _previousState: DeliveryCoveragePreviewActionState,
  formData: FormData,
): Promise<DeliveryCoveragePreviewActionState> {
  await auth.protect();
  if (process.env.NODE_ENV === "production") {
    return { status: "error", message: "O laboratório local não está disponível em produção." };
  }
  const scenario = formData.get("scenario");
  const destination = scenario === "near" ? LOCAL_COVERAGE_NEAR_ADDRESS
    : scenario === "far" ? LOCAL_COVERAGE_FAR_ADDRESS
      : null;
  if (!destination) return { status: "error", message: "Selecione um destino fictício válido." };
  const context = await resolveMutationContext();
  if ("status" in context) return context;
  const catalog = await loadDerivedTenantCatalog(context.tenantId);
  if (!catalog) return { status: "error", message: "A configuração autorizada não pôde ser carregada." };
  const result = await evaluateTrustedTenantDeliveryCoverage({ tenant: catalog.tenant, destination });
  if (result.kind === "covered" || result.kind === "outside_coverage") {
    const covered = result.kind === "covered";
    return {
      status: "success",
      message: covered ? "O destino fictício está dentro da área configurada." : "O destino fictício está fora da área configurada.",
      result: {
        covered,
        distanceInKilometers: (result.distanceInMeters / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 }),
        durationInMinutes: Math.ceil(result.durationInSeconds / 60),
      },
    };
  }
  const messages = {
    address_ambiguous: "O endereço fictício ficou ambíguo.",
    address_not_found: "O endereço fictício não foi localizado.",
    route_not_found: "Não foi possível calcular uma rota fictícia.",
    temporarily_unavailable: "O teste local está temporariamente indisponível.",
  } as const;
  return { status: "error", message: messages[result.kind] };
}
