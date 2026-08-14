import type { PrincipalId, TrustedIdentity } from "./authorization";

export type VerifiedExternalSession = Readonly<{
  issuer: string;
  subject: string;
  expiresAtEpochSeconds: number;
}>;

export type ExternalIdentityReference = Readonly<{
  issuer: string;
  subject: string;
}>;

const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;

export function normalizeExternalIdentity(
  session: VerifiedExternalSession,
): ExternalIdentityReference | null {
  const issuer = session.issuer.trim().replace(/\/+$/, "");
  const subject = session.subject.trim();

  if (!issuer || issuer.length > 2048 || !subject || subject.length > 255) return null;
  if (CONTROL_CHARACTER_PATTERN.test(issuer) || CONTROL_CHARACTER_PATTERN.test(subject)) return null;

  try {
    const url = new URL(issuer);
    const isLocalDevelopment = url.protocol === "http:" &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1");
    if (url.protocol !== "https:" && !isLocalDevelopment) return null;
    if (url.username || url.password || url.search || url.hash) return null;
  } catch {
    return null;
  }

  return { issuer, subject };
}

export function toTrustedIdentity(principalId: PrincipalId): TrustedIdentity {
  return { principalId };
}
