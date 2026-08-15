import { Pool } from "pg";
import type { CatalogCommandRepository } from "./catalog-command-repository";
import {
  CatalogConflictError,
  CatalogEntityNotFoundError,
  type CatalogActor,
  type CatalogMutationResult,
  type UpdateProductCommand,
} from "../domain/catalog-administration";

export class PostgresCatalogCommandRepository implements CatalogCommandRepository {
  constructor(private readonly pool: Pool) {}

  async updateProduct(
    actor: CatalogActor,
    command: UpdateProductCommand,
  ): Promise<CatalogMutationResult> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [command.tenantId]);

      const parameters: Array<string | number | boolean> = [
        command.tenantId,
        command.productId,
        command.expectedVersion,
      ];
      const updateFields: string[] = [];
      if (command.priceInCents !== undefined) {
        parameters.push(command.priceInCents);
        updateFields.push(`base_price_in_cents = $${parameters.length}::bigint`);
      }
      if (command.isAvailable !== undefined) {
        parameters.push(command.isAvailable);
        updateFields.push(`is_available = $${parameters.length}::boolean`);
      }
      if (command.name !== undefined) {
        parameters.push(command.name);
        updateFields.push(`name = $${parameters.length}::text`);
      }
      if (command.description !== undefined) {
        parameters.push(command.description);
        updateFields.push(`description = $${parameters.length}::text`);
      }
      updateFields.push("version = version + 1", "updated_at = now()");
      const updated = await client.query<{ id: string; version: string }>(
        `UPDATE products
          SET ${updateFields.join(", ")}
          WHERE tenant_id = $1
            AND id = $2
            AND version = $3
            AND archived_at IS NULL
          RETURNING id, version`,
        parameters,
      );

      const product = updated.rows[0];
      if (!product) {
        const existing = await client.query<{ version: string }>(
          "SELECT version FROM products WHERE tenant_id = $1 AND id = $2 AND archived_at IS NULL",
          [command.tenantId, command.productId],
        );
        if (existing.rows[0]) {
          throw new CatalogConflictError("Produto foi alterado por outra operação.");
        }
        throw new CatalogEntityNotFoundError("Produto não encontrado no tenant.");
      }

      const changes = {
        ...(command.priceInCents === undefined ? {} : { priceInCents: command.priceInCents }),
        ...(command.isAvailable === undefined ? {} : { isAvailable: command.isAvailable }),
        ...(command.name === undefined ? {} : { name: command.name }),
        ...(command.description === undefined ? {} : { description: command.description }),
      };
      await client.query(
        `INSERT INTO catalog_audit_events
          (tenant_id, actor_id, actor_role, action, entity_type, entity_id, changes)
         VALUES ($1, $2, $3, 'product.updated', 'product', $4, $5::jsonb)`,
        [command.tenantId, actor.id, actor.role, command.productId, JSON.stringify(changes)],
      );

      await client.query("COMMIT");
      return { productId: product.id, version: Number(product.version) };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
