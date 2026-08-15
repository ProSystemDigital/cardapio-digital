import "server-only";

import { Pool } from "pg";
import { AuthorizationService } from "../application/authorization-service";
import type { TrustedIdentity } from "../domain/authorization";
import type { CatalogAuditEvent } from "./catalog-audit-repository";
import { PostgresAuthorizationRepository } from "./postgres-authorization-repository";
import { PostgresCatalogAuditRepository } from "./postgres-catalog-audit-repository";

const AUDIT_EVENT_LIMIT = 20;
let auditPool: Pool | null = null;

function getAuditPool(): Pool | null {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) return null;
  auditPool ??= new Pool({
    connectionString: databaseUrl,
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
    allowExitOnIdle: true,
  });
  return auditPool;
}

export async function loadAuthorizedCatalogAudit(
  identity: TrustedIdentity,
  tenantId: string,
): Promise<readonly CatalogAuditEvent[] | null> {
  const pool = getAuditPool();
  if (!pool) return null;
  await new AuthorizationService(
    new PostgresAuthorizationRepository(pool),
  ).authorizeTenant(identity, tenantId, "tenant.audit.read");
  return new PostgresCatalogAuditRepository(pool).listRecentByTenantId(
    tenantId,
    AUDIT_EVENT_LIMIT,
  );
}
