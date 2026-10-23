import { Pool } from "pg";
import type {
  TenantProfileAuditEvent,
  TenantProfileAuditRepository,
} from "./tenant-profile-audit-repository";

type AuditRow = {
  id: string;
  tenant_id: string;
  actor_role: "owner" | "manager";
  changes: Record<string, unknown>;
  occurred_at: Date;
};

export class PostgresTenantProfileAuditRepository
  implements TenantProfileAuditRepository
{
  constructor(private readonly pool: Pool) {}

  async listRecentByTenantId(
    tenantId: string,
    limit: number,
  ): Promise<readonly TenantProfileAuditEvent[]> {
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 20) {
      throw new Error("Limite de auditoria do perfil inválido.");
    }
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN READ ONLY");
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
      const result = await client.query<AuditRow>(
        `SELECT id, tenant_id, actor_role, changes, occurred_at
           FROM tenant_profile_audit_events
          WHERE tenant_id = $1
            AND action = 'tenant.profile.updated'
          ORDER BY occurred_at DESC, id DESC
          LIMIT $2`,
        [tenantId, limit],
      );
      await client.query("COMMIT");
      return result.rows.map((row) => ({
        id: row.id,
        tenantId: row.tenant_id,
        actorRole: row.actor_role,
        ...(typeof row.changes.shortName === "string"
          ? { shortName: row.changes.shortName }
          : {}),
        ...(typeof row.changes.tagline === "string" ? { tagline: row.changes.tagline } : {}),
        ...(typeof row.changes.mode === "string" ? { fulfillmentMode: row.changes.mode } : {}),
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
