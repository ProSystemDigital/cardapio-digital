import { Pool } from "pg";
import { TenantPrivacyConflictError, TenantPrivacyNotFoundError, type SaveTenantPrivacyCommand, type TenantPrivacyActor, type TenantPrivacyCommandPort, type TenantPrivacyMutationResult } from "../domain/tenant-privacy-administration";

export class PostgresTenantPrivacyCommandRepository implements TenantPrivacyCommandPort {
  constructor(private readonly pool: Pool) {}

  async save(actor: TenantPrivacyActor, command: SaveTenantPrivacyCommand): Promise<TenantPrivacyMutationResult> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [command.tenantId]);
      let row: { tenant_id: string; version: string } | undefined;
      if (command.expectedVersion === null) {
        try {
          const inserted = await client.query<{ tenant_id: string; version: string }>(
            `INSERT INTO tenant_privacy_settings
              (tenant_id, controller_legal_name, privacy_email, order_address_retention_days)
             VALUES ($1, $2, $3, $4) RETURNING tenant_id, version`,
            [command.tenantId, command.controllerLegalName, command.privacyEmail, command.orderAddressRetentionDays],
          );
          row = inserted.rows[0];
        } catch (error) {
          if ((error as { code?: string }).code === "23505") throw new TenantPrivacyConflictError("Configuração de privacidade já existe.");
          throw error;
        }
      } else {
        const updated = await client.query<{ tenant_id: string; version: string }>(
          `UPDATE tenant_privacy_settings SET controller_legal_name = $3, privacy_email = $4,
             order_address_retention_days = $5, version = version + 1, updated_at = now()
           WHERE tenant_id = $1 AND version = $2 RETURNING tenant_id, version`,
          [command.tenantId, command.expectedVersion, command.controllerLegalName, command.privacyEmail, command.orderAddressRetentionDays],
        );
        row = updated.rows[0];
        if (!row) {
          const existing = await client.query("SELECT 1 FROM tenant_privacy_settings WHERE tenant_id = $1", [command.tenantId]);
          if (existing.rowCount) throw new TenantPrivacyConflictError("Configuração de privacidade mudou.");
          throw new TenantPrivacyNotFoundError("Configuração de privacidade não encontrada.");
        }
      }
      await client.query(
        `INSERT INTO tenant_privacy_audit_events (tenant_id, actor_id, actor_role, action, changes)
         VALUES ($1, $2, $3, 'tenant.privacy.updated', $4::jsonb)`,
        [command.tenantId, actor.id, actor.role, JSON.stringify({
          controllerConfigured: true, privacyChannelConfigured: true,
          orderAddressRetentionDays: command.orderAddressRetentionDays,
        })],
      );
      await client.query("COMMIT");
      if (!row) throw new TenantPrivacyNotFoundError("Configuração não persistida.");
      return { tenantId: row.tenant_id, version: Number(row.version) };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally { client.release(); }
  }
}
