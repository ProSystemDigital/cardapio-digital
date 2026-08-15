import "server-only";

import type { Pool } from "pg";
import { Pool as PostgresPool } from "pg";
import { AuthenticatedIdentityService } from "../application/authenticated-identity-service";
import { AuthenticationRequiredError } from "../application/authenticated-identity-service";
import { ClerkAuthenticationSessionGateway } from "./clerk-authentication-session-gateway";
import { PostgresExternalIdentityLinkRepository } from "./postgres-external-identity-link-repository";

export type CurrentIdentityResolution = { kind: "resolved" } | { kind: "denied" };

let identityPool: Pool | null = null;

export function createAuthenticatedIdentityService(pool: Pool): AuthenticatedIdentityService {
  return new AuthenticatedIdentityService(
    new ClerkAuthenticationSessionGateway(),
    new PostgresExternalIdentityLinkRepository(pool),
  );
}

function getIdentityPool(): Pool | null {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) return null;

  identityPool ??= new PostgresPool({
    connectionString: databaseUrl,
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
    allowExitOnIdle: true,
  });
  return identityPool;
}

export async function resolveCurrentIdentity(): Promise<CurrentIdentityResolution> {
  const pool = getIdentityPool();
  if (!pool) return { kind: "denied" };

  try {
    await createAuthenticatedIdentityService(pool).resolveTrustedIdentity();
    return { kind: "resolved" };
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) return { kind: "denied" };
    throw error;
  }
}
