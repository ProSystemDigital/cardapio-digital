import "server-only";

import { Pool } from "pg";
import { AuthorizationService } from "../application/authorization-service";
import { AuthorizedTenantFulfillmentAdministrationService } from "../application/authorized-tenant-fulfillment-administration-service";
import { TenantFulfillmentAdministrationService } from "../application/tenant-fulfillment-administration-service";
import type { TrustedIdentity } from "../domain/authorization";
import type { ProductId, TenantId } from "../domain/catalog";
import type { TenantFulfillmentMutationResult } from "../domain/tenant-fulfillment-administration";
import { PostgresAuthorizationRepository } from "./postgres-authorization-repository";
import { PostgresTenantFulfillmentCommandRepository } from "./postgres-tenant-fulfillment-command-repository";

let tenantFulfillmentPool: Pool | null = null;

function getTenantFulfillmentPool(): Pool | null {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) return null;
  tenantFulfillmentPool ??= new Pool({
    connectionString: databaseUrl,
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
    allowExitOnIdle: true,
  });
  return tenantFulfillmentPool;
}

export async function enableDerivedDineIn(input: {
  identity: TrustedIdentity;
  tenantId: TenantId;
  initialProductIds: readonly ProductId[];
}): Promise<TenantFulfillmentMutationResult | null> {
  const pool = getTenantFulfillmentPool();
  if (!pool) return null;
  const service = new AuthorizedTenantFulfillmentAdministrationService(
    new AuthorizationService(new PostgresAuthorizationRepository(pool)),
    new TenantFulfillmentAdministrationService(
      new PostgresTenantFulfillmentCommandRepository(pool),
    ),
  );
  return service.enableMode(input.identity, {
    tenantId: input.tenantId,
    mode: "dine_in",
    initialProductIds: input.initialProductIds,
  });
}
