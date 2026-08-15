import { Pool } from "pg";
import type { AuthorizationRepository } from "./authorization-repository";
import type { PrincipalAccess, PrincipalId } from "../domain/authorization";
import type { TenantId } from "../domain/catalog";

export class PostgresAuthorizationRepository implements AuthorizationRepository {
  constructor(private readonly pool: Pool) {}

  async listTenantAccess(principalId: PrincipalId): Promise<readonly PrincipalAccess[]> {
    const result = await this.pool.query<{ tenant_id: TenantId; role: "owner" | "manager" }>(
      "SELECT tenant_id, role FROM public.list_principal_tenant_access($1)",
      [principalId],
    );
    return result.rows.map((row) => ({ principalId, tenantId: row.tenant_id, role: row.role }));
  }

  async resolveTenantAccess(
    principalId: PrincipalId,
    tenantId: TenantId,
  ): Promise<PrincipalAccess | null> {
    const access = await this.listTenantAccess(principalId);
    return access.find((entry) => entry.tenantId === tenantId) ?? null;
  }

  async resolvePlatformAccess(principalId: PrincipalId): Promise<PrincipalAccess | null> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN READ ONLY");
      await client.query("SELECT set_config('app.principal_id', $1, true)", [principalId]);
      const result = await client.query<{ role: "platform_admin" }>(
        `SELECT assignment.role
           FROM platform_role_assignments assignment
           JOIN principals principal ON principal.id = assignment.principal_id
          WHERE assignment.principal_id = $1
            AND assignment.status = 'active'
            AND principal.status = 'active'`,
        [principalId],
      );
      await client.query("COMMIT");
      return result.rows[0] ? { principalId, role: "platform_admin" } : null;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
