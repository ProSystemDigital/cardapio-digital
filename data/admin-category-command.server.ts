import "server-only";

import { Pool } from "pg";
import { AuthorizationService } from "../application/authorization-service";
import { AuthorizedCategoryAdministrationService } from "../application/authorized-category-administration-service";
import { CategoryAdministrationService } from "../application/category-administration-service";
import type { TrustedIdentity } from "../domain/authorization";
import type { CategoryId, TenantId } from "../domain/catalog";
import type { CategoryMutationResult } from "../domain/category-administration";
import { PostgresAuthorizationRepository } from "./postgres-authorization-repository";
import { PostgresCategoryCommandRepository } from "./postgres-category-command-repository";

let categoryCommandPool: Pool | null = null;

function getCategoryCommandPool(): Pool | null {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) return null;
  categoryCommandPool ??= new Pool({
    connectionString: databaseUrl,
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
    allowExitOnIdle: true,
  });
  return categoryCommandPool;
}

export async function updateDerivedCategory(input: {
  identity: TrustedIdentity;
  tenantId: TenantId;
  categoryId: CategoryId;
  expectedVersion: number;
  name?: string;
  sortOrder?: number;
}): Promise<CategoryMutationResult | null> {
  const pool = getCategoryCommandPool();
  if (!pool) return null;
  const service = new AuthorizedCategoryAdministrationService(
    new AuthorizationService(new PostgresAuthorizationRepository(pool)),
    new CategoryAdministrationService(new PostgresCategoryCommandRepository(pool)),
  );
  return service.updateCategory(input.identity, {
    tenantId: input.tenantId,
    categoryId: input.categoryId,
    expectedVersion: input.expectedVersion,
    ...(input.name === undefined ? {} : { name: input.name }),
    ...(input.sortOrder === undefined ? {} : { sortOrder: input.sortOrder }),
  });
}

export async function archiveDerivedCategory(input: {
  identity: TrustedIdentity;
  tenantId: TenantId;
  categoryId: CategoryId;
  expectedVersion: number;
}): Promise<CategoryMutationResult | null> {
  const pool = getCategoryCommandPool();
  if (!pool) return null;
  const service = new AuthorizedCategoryAdministrationService(
    new AuthorizationService(new PostgresAuthorizationRepository(pool)),
    new CategoryAdministrationService(new PostgresCategoryCommandRepository(pool)),
  );
  return service.archiveCategory(input.identity, {
    tenantId: input.tenantId,
    categoryId: input.categoryId,
    expectedVersion: input.expectedVersion,
  });
}
