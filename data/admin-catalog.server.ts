import "server-only";

import { Pool } from "pg";
import {
  PostgresCatalogRepository,
  type VersionedTenantCatalog,
} from "./postgres-catalog-repository";

let adminCatalogPool: Pool | null = null;

function getAdminCatalogPool(): Pool | null {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) return null;

  adminCatalogPool ??= new Pool({
    connectionString: databaseUrl,
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
    allowExitOnIdle: true,
  });
  return adminCatalogPool;
}

export async function loadDerivedTenantCatalog(
  tenantId: string,
): Promise<VersionedTenantCatalog | null> {
  const pool = getAdminCatalogPool();
  if (!pool) return null;
  return new PostgresCatalogRepository(pool).findByTenantId(tenantId);
}
