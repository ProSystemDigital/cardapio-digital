import { expect, test } from "@playwright/test";
import { assessDeliveryPrivacyReadiness, normalizePrivacyIdentity, PrivacyGovernanceValidationError, validateTenantPrivacySettings } from "../../domain/privacy-governance";

test("normaliza identidade profissional e valida retenção explícita", () => {
  const identity = normalizePrivacyIdentity({ legalName: "  Plataforma   Exemplo ", privacyEmail: " PRIVACIDADE@EXEMPLO.COM " });
  expect(identity).toEqual({ legalName: "Plataforma Exemplo", privacyEmail: "privacidade@exemplo.com" });
  expect(() => validateTenantPrivacySettings({ ...identity, orderAddressRetentionDays: 90, version: 1 })).not.toThrow();
  expect(() => validateTenantPrivacySettings({ ...identity, orderAddressRetentionDays: 0, version: 1 })).toThrow(PrivacyGovernanceValidationError);
});

test("cobertura real exige todos os gates e informa cada ausência", () => {
  expect(assessDeliveryPrivacyReadiness({
    platformIdentity: null, tenantPrivacy: null, originVerified: false,
    providerCredentialsConfigured: false, legalApprovalRecorded: false,
  })).toEqual({ ready: false, missing: ["platform_identity", "tenant_privacy", "verified_origin", "provider_credentials", "legal_approval"] });
  expect(assessDeliveryPrivacyReadiness({
    platformIdentity: { legalName: "Plataforma Exemplo", privacyEmail: "privacidade@exemplo.com" },
    tenantPrivacy: { legalName: "Loja Exemplo", privacyEmail: "loja@exemplo.com", orderAddressRetentionDays: 90, version: 1 },
    originVerified: true, providerCredentialsConfigured: true, legalApprovalRecorded: true,
  })).toEqual({ ready: true, missing: [] });
});
