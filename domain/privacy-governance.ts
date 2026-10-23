export const MIN_CONTROLLER_NAME_LENGTH = 2;
export const MAX_CONTROLLER_NAME_LENGTH = 120;
export const MAX_PRIVACY_EMAIL_LENGTH = 254;
export const MIN_ORDER_ADDRESS_RETENTION_DAYS = 1;
export const MAX_ORDER_ADDRESS_RETENTION_DAYS = 3650;

export type PrivacyIdentity = Readonly<{ legalName: string; privacyEmail: string }>;
export type TenantPrivacySettings = PrivacyIdentity & Readonly<{
  orderAddressRetentionDays: number;
  version: number;
}>;

export type DeliveryPrivacyReadiness = Readonly<{
  ready: boolean;
  missing: readonly ("platform_identity" | "tenant_privacy" | "verified_origin" | "provider_credentials" | "legal_approval")[];
}>;

export class PrivacyGovernanceValidationError extends Error {}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizePrivacyIdentity(identity: PrivacyIdentity): PrivacyIdentity {
  return { legalName: clean(identity.legalName), privacyEmail: identity.privacyEmail.trim().toLowerCase() };
}

export function validatePrivacyIdentity(identity: PrivacyIdentity): void {
  if (identity.legalName.length < MIN_CONTROLLER_NAME_LENGTH || identity.legalName.length > MAX_CONTROLLER_NAME_LENGTH) {
    throw new PrivacyGovernanceValidationError("Nome empresarial inválido.");
  }
  if (identity.privacyEmail.length > MAX_PRIVACY_EMAIL_LENGTH || !EMAIL_PATTERN.test(identity.privacyEmail)) {
    throw new PrivacyGovernanceValidationError("Canal de privacidade inválido.");
  }
}

export function validateTenantPrivacySettings(settings: TenantPrivacySettings): void {
  validatePrivacyIdentity(settings);
  if (!Number.isSafeInteger(settings.version) || settings.version < 1 ||
      !Number.isSafeInteger(settings.orderAddressRetentionDays) ||
      settings.orderAddressRetentionDays < MIN_ORDER_ADDRESS_RETENTION_DAYS ||
      settings.orderAddressRetentionDays > MAX_ORDER_ADDRESS_RETENTION_DAYS) {
    throw new PrivacyGovernanceValidationError("Política de retenção inválida.");
  }
}

export function assessDeliveryPrivacyReadiness(input: Readonly<{
  platformIdentity: PrivacyIdentity | null;
  tenantPrivacy: TenantPrivacySettings | null;
  originVerified: boolean;
  providerCredentialsConfigured: boolean;
  legalApprovalRecorded: boolean;
}>): DeliveryPrivacyReadiness {
  const missing: DeliveryPrivacyReadiness["missing"][number][] = [];
  if (!input.platformIdentity) missing.push("platform_identity");
  if (!input.tenantPrivacy) missing.push("tenant_privacy");
  if (!input.originVerified) missing.push("verified_origin");
  if (!input.providerCredentialsConfigured) missing.push("provider_credentials");
  if (!input.legalApprovalRecorded) missing.push("legal_approval");
  return { ready: missing.length === 0, missing };
}
