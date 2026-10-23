import "server-only";
import { Pool } from "pg";
import { AuthorizationService } from "../application/authorization-service";
import { AuthorizedDeliveryOriginAdministrationService } from "../application/authorized-delivery-origin-administration-service";
import { AuthorizedTenantPrivacyAdministrationService } from "../application/authorized-tenant-privacy-administration-service";
import type { TrustedIdentity } from "../domain/authorization";
import { DeliveryOriginAdministrationService, type SaveDeliveryOriginCommand } from "../domain/delivery-origin-administration";
import { TenantPrivacyAdministrationService, type SaveTenantPrivacyCommand } from "../domain/tenant-privacy-administration";
import { PostgresAuthorizationRepository } from "./postgres-authorization-repository";
import { PostgresDeliveryOriginCommandRepository } from "./postgres-delivery-origin-command-repository";
import { PostgresTenantPrivacyCommandRepository } from "./postgres-tenant-privacy-command-repository";

let pool: Pool | null = null;
function databasePool(): Pool | null {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) return null;
  pool ??= new Pool({ connectionString: databaseUrl, max: 3, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 5_000, allowExitOnIdle: true });
  return pool;
}

export async function saveDerivedTenantPrivacy(input: { identity: TrustedIdentity; command: SaveTenantPrivacyCommand }) {
  const database = databasePool();
  if (!database) return null;
  return new AuthorizedTenantPrivacyAdministrationService(
    new AuthorizationService(new PostgresAuthorizationRepository(database)),
    new TenantPrivacyAdministrationService(new PostgresTenantPrivacyCommandRepository(database)),
  ).save(input.identity, input.command);
}

export async function saveDerivedDeliveryOrigin(input: { identity: TrustedIdentity; command: SaveDeliveryOriginCommand }) {
  const database = databasePool();
  if (!database) return null;
  return new AuthorizedDeliveryOriginAdministrationService(
    new AuthorizationService(new PostgresAuthorizationRepository(database)),
    new DeliveryOriginAdministrationService(new PostgresDeliveryOriginCommandRepository(database)),
  ).save(input.identity, input.command);
}
