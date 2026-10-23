import type { TenantId, TenantRole } from "./catalog";

export type TenantProfileActor = {
  id: string;
  role: TenantRole;
  tenantIds: readonly TenantId[];
};

export type UpdateTenantProfileCommand = {
  tenantId: TenantId;
  expectedVersion: number;
  shortName?: string;
  tagline?: string;
};

export type TenantProfileMutationResult = {
  tenantId: TenantId;
  version: number;
};

export class TenantProfileAuthorizationError extends Error {}
export class TenantProfileValidationError extends Error {}
export class TenantProfileConflictError extends Error {}
export class TenantProfileNotFoundError extends Error {}

export const MAX_TENANT_SHORT_NAME_LENGTH = 30;
export const MAX_TENANT_TAGLINE_LENGTH = 30;

const ACTOR_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TENANT_UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

export function authorizeTenantProfileMutation(
  actor: TenantProfileActor,
  tenantId: TenantId,
): void {
  if (!ACTOR_UUID_PATTERN.test(actor.id)) {
    throw new TenantProfileAuthorizationError("Ator técnico válido é obrigatório.");
  }
  if (actor.role === "platform_admin") {
    throw new TenantProfileAuthorizationError(
      "Administrador da plataforma não possui edição implícita do perfil.",
    );
  }
  if (!actor.tenantIds.includes(tenantId)) {
    throw new TenantProfileAuthorizationError("Ator não está autorizado para este tenant.");
  }
}

export function validateUpdateTenantProfileCommand(command: UpdateTenantProfileCommand): void {
  if (!TENANT_UUID_PATTERN.test(command.tenantId)) {
    throw new TenantProfileValidationError("Tenant inválido.");
  }
  if (!Number.isSafeInteger(command.expectedVersion) || command.expectedVersion < 1) {
    throw new TenantProfileValidationError("Versão esperada inválida.");
  }
  if (command.shortName === undefined && command.tagline === undefined) {
    throw new TenantProfileValidationError("Informe ao menos uma alteração do perfil.");
  }
  if (
    command.shortName !== undefined &&
    (!command.shortName.trim() || command.shortName.length > MAX_TENANT_SHORT_NAME_LENGTH)
  ) {
    throw new TenantProfileValidationError("Nome da empresa inválido.");
  }
  if (
    command.tagline !== undefined &&
    (!command.tagline.trim() || command.tagline.length > MAX_TENANT_TAGLINE_LENGTH)
  ) {
    throw new TenantProfileValidationError("Slogan inválido.");
  }
}
