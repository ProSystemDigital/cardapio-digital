import "server-only";

import { Pool } from "pg";
import { AuthorizationService } from "../application/authorization-service";
import type { TrustedIdentity } from "../domain/authorization";
import type { CategoryAuditEvent } from "./category-audit-repository";
import { PostgresAuthorizationRepository } from "./postgres-authorization-repository";
import { PostgresCategoryAuditRepository } from "./postgres-category-audit-repository";

const CATEGORY_AUDIT_LIMIT = 20;
let categoryAuditPool: Pool | null = null;

function getCategoryAuditPool(): Pool | null {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) return null;
  categoryAuditPool ??= new Pool({
    connectionString: databaseUrl,
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
    allowExitOnIdle: true,
  });
  return categoryAuditPool;
}

export async function loadAuthorizedCategoryAudit(
  identity: TrustedIdentity,
  tenantId: string,
): Promise<readonly CategoryAuditEvent[] | null> {
  const pool = getCategoryAuditPool();
  if (!pool) return null;
  await new AuthorizationService(
    new PostgresAuthorizationRepository(pool),
  ).authorizeTenant(identity, tenantId, "tenant.audit.read");
  return new PostgresCategoryAuditRepository(pool).listRecentByTenantId(
    tenantId,
    CATEGORY_AUDIT_LIMIT,
  );
}
