import type { TenantId, TenantRole } from "./catalog";
import { normalizePrivacyIdentity, validatePrivacyIdentity, MIN_ORDER_ADDRESS_RETENTION_DAYS, MAX_ORDER_ADDRESS_RETENTION_DAYS } from "./privacy-governance";

export type TenantPrivacyActor = Readonly<{ id: string; role: TenantRole; tenantIds: readonly TenantId[] }>;
export type SaveTenantPrivacyCommand = Readonly<{
  tenantId: TenantId;
  expectedVersion: number | null;
  controllerLegalName: string;
  privacyEmail: string;
  orderAddressRetentionDays: number;
}>;
export type TenantPrivacyMutationResult = Readonly<{ tenantId: TenantId; version: number }>;

export interface TenantPrivacyCommandPort {
  save(actor: TenantPrivacyActor, command: SaveTenantPrivacyCommand): Promise<TenantPrivacyMutationResult>;
}

export class TenantPrivacyValidationError extends Error {}
export class TenantPrivacyAuthorizationError extends Error {}
export class TenantPrivacyConflictError extends Error {}
export class TenantPrivacyNotFoundError extends Error {}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class TenantPrivacyAdministrationService {
  constructor(private readonly port: TenantPrivacyCommandPort) {}

  async save(actor: TenantPrivacyActor, input: SaveTenantPrivacyCommand): Promise<TenantPrivacyMutationResult> {
    if (actor.role !== "owner" || !actor.tenantIds.includes(input.tenantId)) {
      throw new TenantPrivacyAuthorizationError("Somente o proprietário do tenant pode definir governança de privacidade.");
    }
    if (!UUID_PATTERN.test(actor.id) || !UUID_PATTERN.test(input.tenantId) ||
        (input.expectedVersion !== null && (!Number.isSafeInteger(input.expectedVersion) || input.expectedVersion < 1))) {
      throw new TenantPrivacyValidationError("Contexto de privacidade inválido.");
    }
    const identity = normalizePrivacyIdentity({ legalName: input.controllerLegalName, privacyEmail: input.privacyEmail });
    try { validatePrivacyIdentity(identity); } catch { throw new TenantPrivacyValidationError("Identidade do controlador inválida."); }
    if (!Number.isSafeInteger(input.orderAddressRetentionDays) ||
        input.orderAddressRetentionDays < MIN_ORDER_ADDRESS_RETENTION_DAYS ||
        input.orderAddressRetentionDays > MAX_ORDER_ADDRESS_RETENTION_DAYS) {
      throw new TenantPrivacyValidationError("Retenção inválida.");
    }
    return this.port.save(actor, { ...input, controllerLegalName: identity.legalName, privacyEmail: identity.privacyEmail });
  }
}
