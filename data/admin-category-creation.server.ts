import "server-only";

import { Pool } from "pg";
import { AuthorizationService } from "../application/authorization-service";
import { AuthorizedCategoryCreationService } from "../application/authorized-category-creation-service";
import { CategoryCreationService } from "../application/category-creation-service";
import type { TrustedIdentity } from "../domain/authorization";
import type { TenantId } from "../domain/catalog";
import type { CategoryMutationResult } from "../domain/category-administration";
import { PostgresAuthorizationRepository } from "./postgres-authorization-repository";
import { PostgresCategoryCreationRepository } from "./postgres-category-creation-repository";

let categoryCreationPool: Pool | null = null;

function getCategoryCreationPool(): Pool | null {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) return null;
  categoryCreationPool ??= new Pool({
    connectionString: databaseUrl,
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
    allowExitOnIdle: true,
  });
  return categoryCreationPool;
}

export async function createDerivedCategory(input: {
  identity: TrustedIdentity;
  tenantId: TenantId;
  name: string;
  sortOrder: number;
}): Promise<CategoryMutationResult | null> {
  const pool = getCategoryCreationPool();
  if (!pool) return null;
  const service = new AuthorizedCategoryCreationService(
    new AuthorizationService(new PostgresAuthorizationRepository(pool)),
    new CategoryCreationService(new PostgresCategoryCreationRepository(pool)),
  );
  return service.createCategory(input.identity, {
    tenantId: input.tenantId,
    name: input.name,
    sortOrder: input.sortOrder,
  });
}
