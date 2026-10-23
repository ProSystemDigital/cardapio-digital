import "server-only";

import { Pool } from "pg";
import { AuthorizedTenantProfileAdministrationService } from "../application/authorized-tenant-profile-administration-service";
import { AuthorizationService } from "../application/authorization-service";
import { TenantProfileAdministrationService } from "../application/tenant-profile-administration-service";
import type { TrustedIdentity } from "../domain/authorization";
import type { TenantId } from "../domain/catalog";
import type { TenantProfileMutationResult } from "../domain/tenant-profile-administration";
import { PostgresAuthorizationRepository } from "./postgres-authorization-repository";
import { PostgresTenantProfileCommandRepository } from "./postgres-tenant-profile-command-repository";

let tenantProfilePool: Pool | null = null;

function getTenantProfilePool(): Pool | null {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) return null;

  tenantProfilePool ??= new Pool({
    connectionString: databaseUrl,
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
    allowExitOnIdle: true,
  });
  return tenantProfilePool;
}

export async function updateDerivedTenantProfile(input: {
  identity: TrustedIdentity;
  tenantId: TenantId;
  expectedVersion: number;
  shortName: string;
  tagline: string;
}): Promise<TenantProfileMutationResult | null> {
  const pool = getTenantProfilePool();
  if (!pool) return null;

  const service = new AuthorizedTenantProfileAdministrationService(
    new AuthorizationService(new PostgresAuthorizationRepository(pool)),
    new TenantProfileAdministrationService(
      new PostgresTenantProfileCommandRepository(pool),
    ),
  );
  return service.updateProfile(input.identity, {
    tenantId: input.tenantId,
    expectedVersion: input.expectedVersion,
    shortName: input.shortName,
    tagline: input.tagline,
  });
}
