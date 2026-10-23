import { Pool } from "pg";
import { DeliveryOriginConflictError, DeliveryOriginNotFoundError, type DeliveryOriginActor, type DeliveryOriginCommandPort, type DeliveryOriginMutationResult, type SaveDeliveryOriginCommand } from "../domain/delivery-origin-administration";

export class PostgresDeliveryOriginCommandRepository implements DeliveryOriginCommandPort {
  constructor(private readonly pool: Pool) {}

  async save(actor: DeliveryOriginActor, command: SaveDeliveryOriginCommand): Promise<DeliveryOriginMutationResult> {
    const client = await this.pool.connect();
    const values = [command.tenantId, command.label, command.postalCode, command.street, command.number,
      command.complement ?? null, command.neighborhood, command.city, command.state];
    try {
      await client.query("BEGIN");
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [command.tenantId]);
      let row: { tenant_id: string; version: string } | undefined;
      if (command.expectedVersion === null) {
        try {
          const inserted = await client.query<{ tenant_id: string; version: string }>(
            `INSERT INTO tenant_delivery_origins
              (tenant_id, label, postal_code, street, number, complement, neighborhood, city, state)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING tenant_id, version`, values,
          );
          row = inserted.rows[0];
        } catch (error) {
          if ((error as { code?: string }).code === "23505") throw new DeliveryOriginConflictError("Origem já existe.");
          throw error;
        }
      } else {
        const updated = await client.query<{ tenant_id: string; version: string }>(
          `UPDATE tenant_delivery_origins SET label=$3, postal_code=$4, street=$5, number=$6,
             complement=$7, neighborhood=$8, city=$9, state=$10, latitude=NULL, longitude=NULL,
             geocoding_status='pending', version=version+1, updated_at=now()
           WHERE tenant_id=$1 AND version=$2 RETURNING tenant_id, version`,
          [command.tenantId, command.expectedVersion, ...values.slice(1)],
        );
        row = updated.rows[0];
        if (!row) {
          const existing = await client.query("SELECT 1 FROM tenant_delivery_origins WHERE tenant_id=$1", [command.tenantId]);
          if (existing.rowCount) throw new DeliveryOriginConflictError("Origem mudou.");
          throw new DeliveryOriginNotFoundError("Origem não encontrada.");
        }
      }
      await client.query(
        `INSERT INTO tenant_delivery_origin_audit_events (tenant_id, actor_id, actor_role, action, changes)
         VALUES ($1,$2,$3,'tenant.delivery_origin.saved',$4::jsonb)`,
        [command.tenantId, actor.id, actor.role, JSON.stringify({ addressConfigured: true, geocodingStatus: "pending" })],
      );
      await client.query("COMMIT");
      if (!row) throw new DeliveryOriginNotFoundError("Origem não persistida.");
      return { tenantId: row.tenant_id, version: Number(row.version), geocodingStatus: "pending" };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally { client.release(); }
  }
}
