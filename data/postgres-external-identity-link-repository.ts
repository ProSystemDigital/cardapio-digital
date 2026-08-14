import { Pool } from "pg";
import type { ExternalIdentityLinkRepository } from "./authentication-repositories";
import type { ExternalIdentityReference } from "../domain/authentication";
import type { PrincipalId } from "../domain/authorization";

export class PostgresExternalIdentityLinkRepository implements ExternalIdentityLinkRepository {
  constructor(private readonly pool: Pool) {}

  async resolvePrincipalId(identity: ExternalIdentityReference): Promise<PrincipalId | null> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN READ ONLY");
      const result = await client.query<{ principal_id: PrincipalId | null }>(
        "SELECT public.resolve_external_principal_id($1, $2) AS principal_id",
        [identity.issuer, identity.subject],
      );
      await client.query("COMMIT");
      return result.rows[0]?.principal_id ?? null;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
