import type { ProductId, TenantId, TenantRole } from "./catalog";

export type CatalogActor = {
  id: string;
  role: TenantRole;
  tenantIds: readonly TenantId[];
};

export type UpdateProductCommand = {
  tenantId: TenantId;
  productId: ProductId;
  expectedVersion: number;
  priceInCents?: number;
  isAvailable?: boolean;
  name?: string;
  description?: string;
};

export type CatalogAuditEntry = {
  tenantId: TenantId;
  actorId: string;
  actorRole: TenantRole;
  action: "product.updated";
  entityType: "product";
  entityId: ProductId;
  changes: Readonly<Record<string, number | boolean | string>>;
};

export type CatalogMutationResult = {
  productId: ProductId;
  version: number;
};

export class CatalogAuthorizationError extends Error {}
export class CatalogValidationError extends Error {}
export class CatalogConflictError extends Error {}
export class CatalogEntityNotFoundError extends Error {}

export const MAX_PRODUCT_PRICE_IN_CENTS = 99_999_999;
export const MAX_PRODUCT_NAME_LENGTH = 120;
export const MAX_PRODUCT_DESCRIPTION_LENGTH = 500;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function authorizeCatalogMutation(actor: CatalogActor, tenantId: TenantId): void {
  if (!UUID_PATTERN.test(actor.id)) {
    throw new CatalogAuthorizationError("Ator técnico válido é obrigatório.");
  }
  if (actor.role === "platform_admin") {
    throw new CatalogAuthorizationError(
      "Administrador da plataforma não possui edição implícita de catálogo.",
    );
  }
  if (!actor.tenantIds.includes(tenantId)) {
    throw new CatalogAuthorizationError("Ator não está autorizado para este tenant.");
  }
}

export function validateUpdateProductCommand(command: UpdateProductCommand): void {
  if (!command.tenantId.trim() || !command.productId.trim()) {
    throw new CatalogValidationError("Tenant e produto são obrigatórios.");
  }
  if (!Number.isSafeInteger(command.expectedVersion) || command.expectedVersion < 1) {
    throw new CatalogValidationError("Versão esperada inválida.");
  }
  if (
    command.priceInCents === undefined &&
    command.isAvailable === undefined &&
    command.name === undefined &&
    command.description === undefined
  ) {
    throw new CatalogValidationError("Informe ao menos uma alteração do produto.");
  }
  if (
    command.priceInCents !== undefined &&
    (!Number.isSafeInteger(command.priceInCents) ||
      command.priceInCents < 0 ||
      command.priceInCents > MAX_PRODUCT_PRICE_IN_CENTS)
  ) {
    throw new CatalogValidationError("Preço deve ser inteiro em centavos dentro do limite.");
  }
  if (
    command.name !== undefined &&
    (!command.name.trim() || command.name.length > MAX_PRODUCT_NAME_LENGTH)
  ) {
    throw new CatalogValidationError("Nome do produto inválido.");
  }
  if (
    command.description !== undefined &&
    command.description.length > MAX_PRODUCT_DESCRIPTION_LENGTH
  ) {
    throw new CatalogValidationError("Descrição do produto inválida.");
  }
}
