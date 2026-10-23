import { Pool } from "pg";
import type { TenantProfileCommandRepository } from "./tenant-profile-command-repository";
import {
  TenantProfileConflictError,
  TenantProfileNotFoundError,
  type TenantProfileActor,
  type TenantProfileMutationResult,
  type UpdateTenantProfileCommand,
} from "../domain/tenant-profile-administration";

export class PostgresTenantProfileCommandRepository
  implements TenantProfileCommandRepository
{
  constructor(private readonly pool: Pool) {}

  async updateProfile(
    actor: TenantProfileActor,
    command: UpdateTenantProfileCommand,
  ): Promise<TenantProfileMutationResult> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [command.tenantId]);

      const parameters: Array<string | number> = [command.tenantId, command.expectedVersion];
      const fields: string[] = [];
      if (command.shortName !== undefined) {
        parameters.push(command.shortName);
        fields.push(`short_name = $${parameters.length}::text`);
      }
      if (command.tagline !== undefined) {
        parameters.push(command.tagline);
        fields.push(`tagline = $${parameters.length}::text`);
      }
      fields.push("version = version + 1", "updated_at = now()");

      const updated = await client.query<{ id: string; version: string }>(
        `UPDATE tenants
            SET ${fields.join(", ")}
          WHERE id = $1
            AND version = $2
            AND archived_at IS NULL
          RETURNING id, version`,
        parameters,
      );
      const tenant = updated.rows[0];
      if (!tenant) {
        const existing = await client.query<{ version: string }>(
          "SELECT version FROM tenants WHERE id = $1 AND archived_at IS NULL",
          [command.tenantId],
        );
        if (existing.rows[0]) {
          throw new TenantProfileConflictError("Perfil foi alterado por outra operação.");
        }
        throw new TenantProfileNotFoundError("Tenant não encontrado.");
      }

      const changes = {
        ...(command.shortName === undefined ? {} : { shortName: command.shortName }),
        ...(command.tagline === undefined ? {} : { tagline: command.tagline }),
      };
      await client.query(
        `INSERT INTO tenant_profile_audit_events
          (tenant_id, actor_id, actor_role, action, changes)
         VALUES ($1, $2, $3, 'tenant.profile.updated', $4::jsonb)`,
        [command.tenantId, actor.id, actor.role, JSON.stringify(changes)],
      );

      await client.query("COMMIT");
      return { tenantId: tenant.id, version: Number(tenant.version) };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
