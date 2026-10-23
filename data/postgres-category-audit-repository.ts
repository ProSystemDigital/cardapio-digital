import { Pool } from "pg";
import type { CategoryAuditEvent, CategoryAuditRepository } from "./category-audit-repository";

type AuditRow = {
  id: string;
  tenant_id: string;
  category_id: string;
  category_name: string;
  actor_role: "owner" | "manager";
  changes: Record<string, unknown>;
  occurred_at: Date;
};

export class PostgresCategoryAuditRepository implements CategoryAuditRepository {
  constructor(private readonly pool: Pool) {}

  async listRecentByTenantId(tenantId: string, limit: number): Promise<readonly CategoryAuditEvent[]> {
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 20) {
      throw new Error("Limite de auditoria de categorias inválido.");
    }
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN READ ONLY");
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
      const result = await client.query<AuditRow>(
        `SELECT event.id, event.tenant_id, event.category_id,
                category.name AS category_name, event.actor_role,
                event.changes, event.occurred_at
           FROM category_audit_events event
           JOIN categories category
             ON category.tenant_id = event.tenant_id
            AND category.id = event.category_id
          WHERE event.tenant_id = $1
          ORDER BY event.occurred_at DESC, event.id DESC
          LIMIT $2`,
        [tenantId, limit],
      );
      await client.query("COMMIT");
      return result.rows.map((row) => ({
        id: row.id,
        tenantId: row.tenant_id,
        categoryId: row.category_id,
        categoryName: row.category_name,
        actorRole: row.actor_role,
        ...(typeof row.changes.name === "string" ? { newName: row.changes.name } : {}),
        ...(typeof row.changes.sortOrder === "number" && Number.isSafeInteger(row.changes.sortOrder)
          ? { sortOrder: row.changes.sortOrder }
          : {}),
        occurredAt: row.occurred_at,
      }));
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
