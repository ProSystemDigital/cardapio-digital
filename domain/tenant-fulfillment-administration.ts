import type { FulfillmentMode, ProductId, TenantId, TenantRole } from "./catalog";

export type TenantFulfillmentActor = {
  id: string;
  role: TenantRole;
  tenantIds: readonly TenantId[];
};

export type EnableTenantFulfillmentModeCommand = {
  tenantId: TenantId;
  mode: FulfillmentMode;
  initialProductIds: readonly ProductId[];
};

export type TenantFulfillmentMutationResult = {
  tenantId: TenantId;
  mode: FulfillmentMode;
  initialProductIds: readonly ProductId[];
};

export class TenantFulfillmentAuthorizationError extends Error {}
export class TenantFulfillmentValidationError extends Error {}
export class TenantFulfillmentConflictError extends Error {}

const ACTOR_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TENANT_UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const PRODUCT_UUID_PATTERN = TENANT_UUID_PATTERN;
export const MAX_INITIAL_DINE_IN_PRODUCTS = 200;

export function authorizeTenantFulfillmentMutation(
  actor: TenantFulfillmentActor,
  tenantId: TenantId,
): void {
  if (!ACTOR_UUID_PATTERN.test(actor.id)) {
    throw new TenantFulfillmentAuthorizationError("Ator técnico válido é obrigatório.");
  }
  if (actor.role === "platform_admin") {
    throw new TenantFulfillmentAuthorizationError(
      "Administrador da plataforma não possui gestão implícita das modalidades do tenant.",
    );
  }
  if (!actor.tenantIds.includes(tenantId)) {
    throw new TenantFulfillmentAuthorizationError("Ator não está autorizado para este tenant.");
  }
}

export function validateEnableTenantFulfillmentModeCommand(
  command: EnableTenantFulfillmentModeCommand,
): void {
  if (!TENANT_UUID_PATTERN.test(command.tenantId)) {
    throw new TenantFulfillmentValidationError("Tenant inválido.");
  }
  if (command.mode !== "dine_in") {
    throw new TenantFulfillmentValidationError(
      "Somente a ativação controlada de Na mesa pertence a esta fase.",
    );
  }
  if (
    command.initialProductIds.length < 1 ||
    command.initialProductIds.length > MAX_INITIAL_DINE_IN_PRODUCTS ||
    new Set(command.initialProductIds).size !== command.initialProductIds.length ||
    command.initialProductIds.some((productId) => !PRODUCT_UUID_PATTERN.test(productId))
  ) {
    throw new TenantFulfillmentValidationError(
      "Selecione entre 1 e 200 produtos compatíveis, sem duplicatas.",
    );
  }
}
