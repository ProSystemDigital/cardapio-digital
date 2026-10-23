import "server-only";
import { Pool } from "pg";
import { AuthorizationService } from "../application/authorization-service";
import type { TrustedIdentity } from "../domain/authorization";
import type { TenantId } from "../domain/catalog";
import { DeliveryOriginConflictError } from "../domain/delivery-origin-administration";
import { GeoapifyDeliveryGeocoder } from "./geoapify-delivery-location-adapters";
import { PostgresAuthorizationRepository } from "./postgres-authorization-repository";
import { PostgresDeliveryOriginGeocodingRepository } from "./postgres-delivery-origin-geocoding-repository";

let pool: Pool | null = null;
const ORIGIN_GEOCODING_TIMEOUT_IN_MS = 15_000;

export async function validateDerivedDeliveryOrigin(input: { identity: TrustedIdentity; tenantId: TenantId; expectedVersion: number }) {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) return { kind: "unavailable" as const };
  pool ??= new Pool({ connectionString: databaseUrl, max: 3, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 5_000, allowExitOnIdle: true });
  const authorization = new AuthorizationService(new PostgresAuthorizationRepository(pool));
  const access = await authorization.authorizeTenant(input.identity, input.tenantId, "tenant.delivery_origin.update");
  const repository = new PostgresDeliveryOriginGeocodingRepository(pool);
  const origin = await repository.find(input.tenantId);
  if (origin.version !== input.expectedVersion) throw new DeliveryOriginConflictError("A origem mudou antes da validação.");
  const apiKey = process.env.GEOAPIFY_API_KEY?.trim();
  if (!apiKey) return { kind: "unavailable" as const };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ORIGIN_GEOCODING_TIMEOUT_IN_MS);
  let result;
  try {
    result = await new GeoapifyDeliveryGeocoder(apiKey).geocode(origin.address, controller.signal);
  } finally {
    clearTimeout(timeout);
  }
  if (result.kind === "unavailable") return result;
  if (result.kind === "found") {
    await repository.persist({ tenantId: input.tenantId, expectedVersion: origin.version, actorId: access.principalId, actorRole: access.role, status: "verified", point: result.point });
    return { kind: "verified" as const };
  }
  await repository.persist({ tenantId: input.tenantId, expectedVersion: origin.version, actorId: access.principalId, actorRole: access.role, status: "failed" });
  return result;
}
