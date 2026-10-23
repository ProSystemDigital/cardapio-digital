import "server-only";

import { Pool } from "pg";
import { AuthorizationService } from "../application/authorization-service";
import type { TrustedIdentity } from "../domain/authorization";
import type { TenantProfileAuditEvent } from "./tenant-profile-audit-repository";
import { PostgresAuthorizationRepository } from "./postgres-authorization-repository";
import { PostgresTenantProfileAuditRepository } from "./postgres-tenant-profile-audit-repository";

const PROFILE_AUDIT_LIMIT = 20;
let profileAuditPool: Pool | null = null;

function getProfileAuditPool(): Pool | null {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) return null;
  profileAuditPool ??= new Pool({
    connectionString: databaseUrl,
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
    allowExitOnIdle: true,
  });
  return profileAuditPool;
}

export async function loadAuthorizedTenantProfileAudit(
  identity: TrustedIdentity,
  tenantId: string,
): Promise<readonly TenantProfileAuditEvent[] | null> {
  const pool = getProfileAuditPool();
  if (!pool) return null;
  await new AuthorizationService(
    new PostgresAuthorizationRepository(pool),
  ).authorizeTenant(identity, tenantId, "tenant.audit.read");
  return new PostgresTenantProfileAuditRepository(pool).listRecentByTenantId(
    tenantId,
    PROFILE_AUDIT_LIMIT,
  );
}
