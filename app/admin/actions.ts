"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { AccessDeniedError } from "../../application/authorization-service";
import {
  CatalogConflictError,
  CatalogEntityNotFoundError,
  CatalogValidationError,
} from "../../domain/catalog-administration";
import { updateDerivedProductAvailability } from "../../data/admin-catalog-command.server";
import {
  resolveCurrentIdentity,
  resolveCurrentTenantAccess,
} from "../../data/authentication.server";

export type AvailabilityActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const PRODUCT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  const identity = await resolveCurrentIdentity();
  if (identity.kind === "denied") {
    return { status: "error", message: "A identidade interna não está mais ativa." };
  }
  const access = await resolveCurrentTenantAccess(identity.identity);
  const membership = access[0];
  if (access.length !== 1 || !membership?.tenantId) {
    return { status: "error", message: "O tenant autorizado não pôde ser derivado." };
  }

  try {
    const result = await updateDerivedProductAvailability({
      identity: identity.identity,
      tenantId: membership.tenantId,
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
