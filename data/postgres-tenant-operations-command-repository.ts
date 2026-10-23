import { Pool } from "pg";
import type { TenantOperationsCommandRepository } from "./tenant-operations-command-repository";
import { TenantOperationsConflictError, TenantOperationsNotFoundError, type TenantOperationsActor, type TenantOperationsMutationResult, type UpdateTenantOperationsCommand } from "../domain/tenant-operations-administration";

const weekdayNumbers = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 } as const;

export class PostgresTenantOperationsCommandRepository implements TenantOperationsCommandRepository {
  constructor(private readonly pool: Pool) {}

  async updateOperations(actor: TenantOperationsActor, command: UpdateTenantOperationsCommand): Promise<TenantOperationsMutationResult> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [command.tenantId]);
      const sectionUpdate = command.section === "attendance"
        ? { sql: "whatsapp_number = $3", values: [command.whatsappNumber] }
        : command.section === "tables"
          ? { sql: "dining_table_labels = $3::text[]", values: [command.diningTables] }
        : command.section === "finance"
          ? { sql: "minimum_order_in_cents = $3", values: [command.minimumOrderInCents] }
          : {
              sql: "delivery_fee_in_cents = $3, maximum_delivery_distance_in_meters = $4",
              values: [command.deliveryFeeInCents, command.maximumDeliveryDistanceInMeters],
            };
      const updated = await client.query<{ tenant_id: string; version: string }>(
        `UPDATE tenant_operations SET ${sectionUpdate.sql}, version = version + 1, updated_at = now()
         WHERE tenant_id = $1 AND version = $2 RETURNING tenant_id, version`,
        [command.tenantId, command.expectedVersion, ...sectionUpdate.values],
      );
      const operations = updated.rows[0];
      if (!operations) {
        const existing = await client.query("SELECT 1 FROM tenant_operations WHERE tenant_id = $1", [command.tenantId]);
        if (existing.rowCount) throw new TenantOperationsConflictError("Configuração alterada concorrentemente.");
        throw new TenantOperationsNotFoundError("Configuração operacional não encontrada.");
      }

      if (command.section === "finance") {
        await client.query("DELETE FROM tenant_payment_methods WHERE tenant_id = $1", [command.tenantId]);
        for (const method of command.paymentMethods) {
          await client.query("INSERT INTO tenant_payment_methods (tenant_id, method) VALUES ($1, $2)", [command.tenantId, method]);
        }
      }
      if (command.section === "attendance") {
        await client.query("DELETE FROM business_hours WHERE tenant_id = $1", [command.tenantId]);
        for (const hours of command.businessHours) {
          await client.query(
            "INSERT INTO business_hours (tenant_id, weekday, opens_at, closes_at) VALUES ($1, $2, $3, $4)",
            [command.tenantId, weekdayNumbers[hours.weekday], hours.opensAt, hours.closesAt],
          );
        }
      }
      const changes = command.section === "attendance"
        ? { section: command.section, whatsappConfigured: true, businessHours: command.businessHours }
        : command.section === "tables"
          ? { section: command.section, diningTables: command.diningTables }
        : command.section === "finance"
          ? { section: command.section, minimumOrderInCents: command.minimumOrderInCents, paymentMethods: command.paymentMethods }
          : { section: command.section, deliveryFeeInCents: command.deliveryFeeInCents, maximumDeliveryDistanceInMeters: command.maximumDeliveryDistanceInMeters };
      await client.query(
        `INSERT INTO tenant_operations_audit_events (tenant_id, actor_id, actor_role, action, changes)
         VALUES ($1, $2, $3, 'tenant.operations.updated', $4::jsonb)`,
        [command.tenantId, actor.id, actor.role, JSON.stringify(changes)],
      );
      await client.query("COMMIT");
      return { tenantId: operations.tenant_id, version: Number(operations.version) };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
