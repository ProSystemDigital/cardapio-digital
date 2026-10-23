import "server-only";

import { Pool } from "pg";
import { AuthorizedCatalogAdministrationService } from "../application/authorized-catalog-administration-service";
import { AuthorizationService } from "../application/authorization-service";
import { CatalogAdministrationService } from "../application/catalog-administration-service";
import type { TrustedIdentity } from "../domain/authorization";
import type { FulfillmentMode, TenantId } from "../domain/catalog";
import type { CatalogMutationResult } from "../domain/catalog-administration";
import { PostgresAuthorizationRepository } from "./postgres-authorization-repository";
import { PostgresCatalogCommandRepository } from "./postgres-catalog-command-repository";

let commandPool: Pool | null = null;

function getCommandPool(): Pool | null {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) return null;

  commandPool ??= new Pool({
    connectionString: databaseUrl,
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
    allowExitOnIdle: true,
  });
  return commandPool;
}

export async function updateDerivedProductAvailabilityOptions(input: {
  identity: TrustedIdentity;
  tenantId: TenantId;
  productId: string;
  expectedVersion: number;
  isAvailable: boolean;
  fulfillmentModes?: readonly FulfillmentMode[];
}): Promise<CatalogMutationResult | null> {
  const pool = getCommandPool();
  if (!pool) return null;

  const authorization = new AuthorizationService(
    new PostgresAuthorizationRepository(pool),
  );
  const service = new AuthorizedCatalogAdministrationService(
    authorization,
    new CatalogAdministrationService(new PostgresCatalogCommandRepository(pool)),
  );
  return service.updateProduct(input.identity, {
    tenantId: input.tenantId,
    productId: input.productId,
    expectedVersion: input.expectedVersion,
    isAvailable: input.isAvailable,
    ...(input.fulfillmentModes === undefined ? {} : { fulfillmentModes: input.fulfillmentModes }),
  });
}

export async function updateDerivedProduct(input: {
  identity: TrustedIdentity;
  tenantId: TenantId;
  productId: string;
  expectedVersion: number;
  name: string;
  description: string;
  priceInCents: number;
  categoryId: string;
  isAvailable: boolean;
  fulfillmentModes?: readonly FulfillmentMode[];
}): Promise<CatalogMutationResult | null> {
  const pool = getCommandPool();
  if (!pool) return null;
  const service = new AuthorizedCatalogAdministrationService(
    new AuthorizationService(new PostgresAuthorizationRepository(pool)),
    new CatalogAdministrationService(new PostgresCatalogCommandRepository(pool)),
  );
  return service.updateProduct(input.identity, input);
}

export async function archiveDerivedProduct(input: {
  identity: TrustedIdentity;
  tenantId: TenantId;
  productId: string;
  expectedVersion: number;
}): Promise<CatalogMutationResult | null> {
  const pool = getCommandPool();
  if (!pool) return null;
  const service = new AuthorizedCatalogAdministrationService(
    new AuthorizationService(new PostgresAuthorizationRepository(pool)),
    new CatalogAdministrationService(new PostgresCatalogCommandRepository(pool)),
  );
  return service.archiveProduct(input.identity, input);
}


export async function updateDerivedProductPrice(input: {
  identity: TrustedIdentity;
  tenantId: TenantId;
  productId: string;
  expectedVersion: number;
  priceInCents: number;
}): Promise<CatalogMutationResult | null> {
  const pool = getCommandPool();
  if (!pool) return null;

  const service = new AuthorizedCatalogAdministrationService(
    new AuthorizationService(new PostgresAuthorizationRepository(pool)),
    new CatalogAdministrationService(new PostgresCatalogCommandRepository(pool)),
  );
  return service.updateProduct(input.identity, {
    tenantId: input.tenantId,
    productId: input.productId,
    expectedVersion: input.expectedVersion,
    priceInCents: input.priceInCents,
  });
}

export async function updateDerivedProductContent(input: {
  identity: TrustedIdentity;
  tenantId: TenantId;
  productId: string;
  expectedVersion: number;
  name: string;
  description: string;
}): Promise<CatalogMutationResult | null> {
  const pool = getCommandPool();
  if (!pool) return null;

  const service = new AuthorizedCatalogAdministrationService(
    new AuthorizationService(new PostgresAuthorizationRepository(pool)),
    new CatalogAdministrationService(new PostgresCatalogCommandRepository(pool)),
  );
  return service.updateProduct(input.identity, {
    tenantId: input.tenantId,
    productId: input.productId,
    expectedVersion: input.expectedVersion,
    name: input.name,
    description: input.description,
  });
}

export async function updateDerivedProductCategory(input: {
  identity: TrustedIdentity;
  tenantId: TenantId;
  productId: string;
  expectedVersion: number;
  categoryId: string;
}): Promise<CatalogMutationResult | null> {
  const pool = getCommandPool();
  if (!pool) return null;

  const service = new AuthorizedCatalogAdministrationService(
    new AuthorizationService(new PostgresAuthorizationRepository(pool)),
    new CatalogAdministrationService(new PostgresCatalogCommandRepository(pool)),
  );
  return service.updateProduct(input.identity, {
    tenantId: input.tenantId,
    productId: input.productId,
    expectedVersion: input.expectedVersion,
    categoryId: input.categoryId,
  });
}
