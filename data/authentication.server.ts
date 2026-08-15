import "server-only";

import type { Pool } from "pg";
import { Pool as PostgresPool } from "pg";
import { AuthenticatedIdentityService } from "../application/authenticated-identity-service";
import { AuthenticationRequiredError } from "../application/authenticated-identity-service";
import { AuthorizationService } from "../application/authorization-service";
import type { PrincipalAccess, TrustedIdentity } from "../domain/authorization";
import { ClerkAuthenticationSessionGateway } from "./clerk-authentication-session-gateway";
import { PostgresExternalIdentityLinkRepository } from "./postgres-external-identity-link-repository";
import { PostgresAuthorizationRepository } from "./postgres-authorization-repository";

export type CurrentIdentityResolution =
  | { kind: "resolved"; identity: TrustedIdentity }
  | { kind: "denied" };

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
    const identity = await createAuthenticatedIdentityService(pool).resolveTrustedIdentity();
    return { kind: "resolved", identity };
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) return { kind: "denied" };
    throw error;
  }
}

export async function resolveCurrentTenantAccess(
  identity: TrustedIdentity,
): Promise<readonly PrincipalAccess[]> {
  const pool = getIdentityPool();
  if (!pool) return [];
  return new AuthorizationService(
    new PostgresAuthorizationRepository(pool),
  ).listTenantAccess(identity);
}
