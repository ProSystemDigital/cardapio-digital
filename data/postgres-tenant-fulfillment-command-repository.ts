import { Pool } from "pg";
import type { TenantFulfillmentCommandRepository } from "./tenant-fulfillment-command-repository";
import type {
  EnableTenantFulfillmentModeCommand,
  TenantFulfillmentActor,
  TenantFulfillmentMutationResult,
} from "../domain/tenant-fulfillment-administration";
import {
  TenantFulfillmentConflictError,
  TenantFulfillmentValidationError,
} from "../domain/tenant-fulfillment-administration";

export class PostgresTenantFulfillmentCommandRepository
  implements TenantFulfillmentCommandRepository {
  constructor(private readonly pool: Pool) {}

  async enableMode(
    actor: TenantFulfillmentActor,
    command: EnableTenantFulfillmentModeCommand,
  ): Promise<TenantFulfillmentMutationResult> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [command.tenantId]);

      const products = await client.query<{ id: string }>(
        `SELECT id
           FROM products
          WHERE tenant_id = $1
            AND id = ANY($2::uuid[])
            AND archived_at IS NULL
          FOR UPDATE`,
        [command.tenantId, command.initialProductIds],
      );
      if (products.rowCount !== command.initialProductIds.length) {
        throw new TenantFulfillmentValidationError(
          "Um ou mais produtos não pertencem ao tenant ativo.",
        );
      }

      const enabled = await client.query(
        `INSERT INTO tenant_fulfillment_modes (tenant_id, mode)
         VALUES ($1, $2)
         ON CONFLICT (tenant_id, mode) DO NOTHING`,
        [command.tenantId, command.mode],
      );
      if (enabled.rowCount !== 1) {
        throw new TenantFulfillmentConflictError("Modalidade já está habilitada no tenant.");
      }
      await client.query(
        `INSERT INTO product_fulfillment_modes (tenant_id, product_id, mode)
         SELECT $1, unnest($2::uuid[]), $3
         ON CONFLICT (tenant_id, product_id, mode) DO NOTHING`,
        [command.tenantId, command.initialProductIds, command.mode],
      );
      await client.query(
        `UPDATE products
            SET version = version + 1, updated_at = now()
          WHERE tenant_id = $1 AND id = ANY($2::uuid[])`,
        [command.tenantId, command.initialProductIds],
      );
      await client.query(
        `INSERT INTO catalog_audit_events
          (tenant_id, actor_id, actor_role, action, entity_type, entity_id, changes)
         SELECT $1, $2, $3, 'product.updated', 'product', product_id,
                jsonb_build_object('fulfillmentModesAdded', 'Na mesa')
           FROM unnest($4::uuid[]) AS product_id`,
        [command.tenantId, actor.id, actor.role, command.initialProductIds],
      );
      await client.query(
        `INSERT INTO tenant_profile_audit_events
          (tenant_id, actor_id, actor_role, action, changes)
         VALUES ($1, $2, $3, 'tenant.fulfillment_mode.enabled', $4::jsonb)`,
        [
          command.tenantId,
          actor.id,
          actor.role,
          JSON.stringify({ mode: "Na mesa", initialProductCount: command.initialProductIds.length }),
        ],
      );
      await client.query("COMMIT");
      return {
        tenantId: command.tenantId,
        mode: command.mode,
        initialProductIds: [...command.initialProductIds],
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
