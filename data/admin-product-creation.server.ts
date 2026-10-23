import "server-only";

import { Pool } from "pg";
import { AuthorizationService } from "../application/authorization-service";
import { AuthorizedProductCreationService } from "../application/authorized-product-creation-service";
import { ProductCreationService } from "../application/product-creation-service";
import type { TrustedIdentity } from "../domain/authorization";
import type { CategoryId, FulfillmentMode, TenantId } from "../domain/catalog";
import type { ProductCreationResult } from "../domain/product-creation";
import { PostgresAuthorizationRepository } from "./postgres-authorization-repository";
import { PostgresProductCreationRepository } from "./postgres-product-creation-repository";

let productCreationPool: Pool | null = null;

function getProductCreationPool(): Pool | null {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) return null;
  productCreationPool ??= new Pool({
    connectionString: databaseUrl,
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
    allowExitOnIdle: true,
  });
  return productCreationPool;
}

export async function createDerivedProduct(input: {
  identity: TrustedIdentity;
  tenantId: TenantId;
  categoryId: CategoryId;
  name: string;
  description: string;
  priceInCents: number;
  isAvailable: boolean;
  fulfillmentModes: readonly FulfillmentMode[];
}): Promise<ProductCreationResult | null> {
  const pool = getProductCreationPool();
  if (!pool) return null;
  const service = new AuthorizedProductCreationService(
    new AuthorizationService(new PostgresAuthorizationRepository(pool)),
    new ProductCreationService(new PostgresProductCreationRepository(pool)),
  );
  return service.createProduct(input.identity, input);
}
