import type { CategoryId, TenantId, TenantRole } from "./catalog";

export type CategoryActor = {
  id: string;
  role: TenantRole;
  tenantIds: readonly TenantId[];
};

export type UpdateCategoryCommand = {
  tenantId: TenantId;
  categoryId: CategoryId;
  expectedVersion: number;
  name?: string;
  sortOrder?: number;
};

export type CreateCategoryCommand = {
  tenantId: TenantId;
  name: string;
  sortOrder: number;
};

export type ArchiveCategoryCommand = {
  tenantId: TenantId;
  categoryId: CategoryId;
  expectedVersion: number;
};

export type CategoryMutationResult = {
  tenantId: TenantId;
  categoryId: CategoryId;
  version: number;
};

export class CategoryAuthorizationError extends Error {}
export class CategoryValidationError extends Error {}
export class CategoryConflictError extends Error {}
export class CategoryNotFoundError extends Error {}

export const MAX_CATEGORY_NAME_LENGTH = 80;
export const MAX_CATEGORY_SORT_ORDER = 10_000;

const ACTOR_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ENTITY_UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

export function authorizeCategoryMutation(actor: CategoryActor, tenantId: TenantId): void {
  if (!ACTOR_UUID_PATTERN.test(actor.id)) {
    throw new CategoryAuthorizationError("Ator técnico válido é obrigatório.");
  }
  if (actor.role === "platform_admin") {
    throw new CategoryAuthorizationError(
      "Administrador da plataforma não possui edição implícita de categorias.",
    );
  }
  if (!actor.tenantIds.includes(tenantId)) {
    throw new CategoryAuthorizationError("Ator não está autorizado para este tenant.");
  }
}

export function validateUpdateCategoryCommand(command: UpdateCategoryCommand): void {
  if (!ENTITY_UUID_PATTERN.test(command.tenantId)) {
    throw new CategoryValidationError("Tenant inválido.");
  }
  if (!ENTITY_UUID_PATTERN.test(command.categoryId)) {
    throw new CategoryValidationError("Categoria inválida.");
  }
  if (!Number.isSafeInteger(command.expectedVersion) || command.expectedVersion < 1) {
    throw new CategoryValidationError("Versão esperada inválida.");
  }
  if (command.name === undefined && command.sortOrder === undefined) {
    throw new CategoryValidationError("Informe ao menos uma alteração da categoria.");
  }
  if (
    command.name !== undefined &&
    (!command.name.trim() || command.name.length > MAX_CATEGORY_NAME_LENGTH)
  ) {
    throw new CategoryValidationError("Nome da categoria inválido.");
  }
  if (
    command.sortOrder !== undefined &&
    (!Number.isSafeInteger(command.sortOrder) ||
      command.sortOrder < 0 ||
      command.sortOrder > MAX_CATEGORY_SORT_ORDER)
  ) {
    throw new CategoryValidationError("Ordem da categoria inválida.");
  }
}

export function validateCreateCategoryCommand(command: CreateCategoryCommand): void {
  if (!ENTITY_UUID_PATTERN.test(command.tenantId)) {
    throw new CategoryValidationError("Tenant inválido.");
  }
  if (!command.name.trim() || command.name.length > MAX_CATEGORY_NAME_LENGTH) {
    throw new CategoryValidationError("Nome da categoria inválido.");
  }
  if (
    !Number.isSafeInteger(command.sortOrder) ||
    command.sortOrder < 0 ||
    command.sortOrder > MAX_CATEGORY_SORT_ORDER
  ) {
    throw new CategoryValidationError("Ordem da categoria inválida.");
  }
}

export function validateArchiveCategoryCommand(command: ArchiveCategoryCommand): void {
  if (!ENTITY_UUID_PATTERN.test(command.tenantId) || !ENTITY_UUID_PATTERN.test(command.categoryId)) {
    throw new CategoryValidationError("Categoria inválida.");
  }
  if (!Number.isSafeInteger(command.expectedVersion) || command.expectedVersion < 1) {
    throw new CategoryValidationError("Versão esperada inválida.");
  }
}
