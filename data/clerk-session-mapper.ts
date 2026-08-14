import type { VerifiedExternalSession } from "../domain/authentication";

export type ClerkVerifiedAuth = Readonly<{
  userId: string | null;
  sessionClaims: Record<string, unknown> | null;
}>;

export function mapClerkAuthToExternalSession(
  result: ClerkVerifiedAuth,
): VerifiedExternalSession | null {
  if (!result.userId || !result.sessionClaims) return null;
  if (typeof result.sessionClaims.iss !== "string" ||
      typeof result.sessionClaims.exp !== "number") return null;

  return {
    issuer: result.sessionClaims.iss,
    subject: result.userId,
    expiresAtEpochSeconds: result.sessionClaims.exp,
  };
}
