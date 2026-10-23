import "server-only";
import { normalizePrivacyIdentity, validatePrivacyIdentity, type PrivacyIdentity } from "../domain/privacy-governance";

export function resolvePlatformPrivacyIdentity(): PrivacyIdentity | null {
  const legalName = process.env.PLATFORM_LEGAL_NAME?.trim();
  const privacyEmail = process.env.PLATFORM_PRIVACY_EMAIL?.trim();
  if (!legalName || !privacyEmail) return null;
  try {
    const identity = normalizePrivacyIdentity({ legalName, privacyEmail });
    validatePrivacyIdentity(identity);
    return identity;
  } catch {
    return null;
  }
}
