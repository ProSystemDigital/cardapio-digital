import "server-only";

import { Pool } from "pg";
import type { CatalogRepository } from "./catalog-repository";
import { InMemoryCatalogRepository } from "./catalog-repository";
import { resolveCatalogRepositoryMode } from "./catalog-repository-mode";
import { demoCatalogs } from "./demo-catalogs";
import { PostgresCatalogRepository } from "./postgres-catalog-repository";

const mode = resolveCatalogRepositoryMode({
  repository: process.env.CATALOG_REPOSITORY,
  databaseUrl: process.env.DATABASE_URL,
});

function createCatalogRepository(): CatalogRepository {
  if (mode.kind === "memory") {
    return new InMemoryCatalogRepository(demoCatalogs);
  }

  const pool = new Pool({
    connectionString: mode.databaseUrl,
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
    allowExitOnIdle: true,
  });
  return new PostgresCatalogRepository(pool);
}

export const catalogRepository = createCatalogRepository();
