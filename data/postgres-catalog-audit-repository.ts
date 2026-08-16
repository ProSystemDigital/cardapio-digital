import { Pool } from "pg";
import type {
  CatalogAuditEvent,
  CatalogAuditRepository,
} from "./catalog-audit-repository";

type AuditRow = {
  id: string;
  product_name: string;
  actor_role: string;
  changes: Record<string, unknown>;
  occurred_at: Date;
};

export class PostgresCatalogAuditRepository implements CatalogAuditRepository {
  constructor(private readonly pool: Pool) {}

  async listRecentByTenantId(
    tenantId: string,
    limit: number,
  ): Promise<readonly CatalogAuditEvent[]> {
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
      throw new Error("Limite de auditoria inválido.");
    }

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN READ ONLY");
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
      const result = await client.query<AuditRow>(
        `SELECT event.id, product.name AS product_name, event.actor_role,
                event.changes, event.occurred_at
           FROM catalog_audit_events event
           JOIN products product
             ON product.tenant_id = event.tenant_id
            AND product.id = event.entity_id
          WHERE event.tenant_id = $1
          ORDER BY event.occurred_at DESC, event.id DESC
          LIMIT $2`,
        [tenantId, limit],
      );
      await client.query("COMMIT");
      return result.rows.map(toCatalogAuditEvent);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

function toCatalogAuditEvent(row: AuditRow): CatalogAuditEvent {
  if (row.actor_role !== "owner" && row.actor_role !== "manager") {
    throw new Error("Papel de auditoria não reconhecido.");
  }
  const priceInCents = row.changes.priceInCents;
  const isAvailable = row.changes.isAvailable;
  const name = row.changes.name;
  const description = row.changes.description;
  const categoryName = row.changes.categoryName;
  const fulfillmentModes = row.changes.fulfillmentModes;
  return {
    id: row.id,
    productName: row.product_name,
    actorRole: row.actor_role,
    ...(typeof priceInCents === "number" && Number.isSafeInteger(priceInCents)
      ? { priceInCents }
      : {}),
    ...(typeof isAvailable === "boolean" ? { isAvailable } : {}),
    ...(typeof name === "string" ? { name } : {}),
    ...(typeof description === "string" ? { description } : {}),
    ...(typeof categoryName === "string" ? { categoryName } : {}),
    ...(typeof fulfillmentModes === "string" ? { fulfillmentModes } : {}),
    occurredAt: new Date(row.occurred_at),
  };
}
