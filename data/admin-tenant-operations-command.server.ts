import "server-only";
import { Pool } from "pg";
import { AuthorizationService } from "../application/authorization-service";
import { AuthorizedTenantOperationsAdministrationService } from "../application/authorized-tenant-operations-administration-service";
import { TenantOperationsAdministrationService } from "../application/tenant-operations-administration-service";
import type { TrustedIdentity } from "../domain/authorization";
import type { UpdateTenantOperationsCommand } from "../domain/tenant-operations-administration";
import { PostgresAuthorizationRepository } from "./postgres-authorization-repository";
import { PostgresTenantOperationsCommandRepository } from "./postgres-tenant-operations-command-repository";

let pool: Pool | null = null;
export async function updateDerivedTenantOperations(input: { identity: TrustedIdentity; command: UpdateTenantOperationsCommand }) {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) return null;
  pool ??= new Pool({ connectionString: databaseUrl, max: 3, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 5_000, allowExitOnIdle: true });
  return new AuthorizedTenantOperationsAdministrationService(
    new AuthorizationService(new PostgresAuthorizationRepository(pool)),
    new TenantOperationsAdministrationService(new PostgresTenantOperationsCommandRepository(pool)),
  ).update(input.identity, input.command);
}
