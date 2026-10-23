import { Pool } from "pg";
import type { TenantId, TenantRole } from "../domain/catalog";
import type { BrazilianDeliveryAddress, GeographicPoint } from "../domain/delivery-coverage";
import { DeliveryOriginConflictError, DeliveryOriginNotFoundError } from "../domain/delivery-origin-administration";

export type PersistedDeliveryOrigin = Readonly<{
  address: BrazilianDeliveryAddress;
  version: number;
}>;

export class PostgresDeliveryOriginGeocodingRepository {
  constructor(private readonly pool: Pool) {}

  async find(tenantId: TenantId): Promise<PersistedDeliveryOrigin> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN READ ONLY");
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
      const result = await client.query<{ postal_code: string; street: string; number: string; city: string; state: string; version: string }>(
        "SELECT postal_code, street, number, city, state, version FROM tenant_delivery_origins WHERE tenant_id = $1",
        [tenantId],
      );
      await client.query("COMMIT");
      const row = result.rows[0];
      if (!row) throw new DeliveryOriginNotFoundError("Origem não encontrada.");
      return { address: { postalCode: row.postal_code, street: row.street, number: row.number, city: row.city, state: row.state, country: "BR" }, version: Number(row.version) };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally { client.release(); }
  }

  async persist(input: {
    tenantId: TenantId;
    expectedVersion: number;
    actorId: string;
    actorRole: TenantRole;
    status: "verified" | "failed";
    point?: GeographicPoint;
  }): Promise<number> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [input.tenantId]);
      const updated = await client.query<{ version: string }>(
        `UPDATE tenant_delivery_origins
         SET latitude = $3, longitude = $4, geocoding_status = $5, version = version + 1, updated_at = now()
         WHERE tenant_id = $1 AND version = $2 RETURNING version`,
        [input.tenantId, input.expectedVersion, input.point?.latitude ?? null, input.point?.longitude ?? null, input.status],
      );
      if (!updated.rows[0]) {
        const exists = await client.query("SELECT 1 FROM tenant_delivery_origins WHERE tenant_id = $1", [input.tenantId]);
        if (exists.rowCount) throw new DeliveryOriginConflictError("A origem mudou durante a validação.");
        throw new DeliveryOriginNotFoundError("Origem não encontrada.");
      }
      await client.query(
        `INSERT INTO tenant_delivery_origin_audit_events (tenant_id, actor_id, actor_role, action, changes)
         VALUES ($1, $2, $3, 'tenant.delivery_origin.geocoded', $4::jsonb)`,
        [input.tenantId, input.actorId, input.actorRole, JSON.stringify({ geocodingStatus: input.status, provider: "geoapify" })],
      );
      await client.query("COMMIT");
      return Number(updated.rows[0].version);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally { client.release(); }
  }
}
