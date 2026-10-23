import { Pool } from "pg";
import type { CategoryCommandRepository } from "./category-command-repository";
import {
  CategoryConflictError,
  CategoryNotFoundError,
  CategoryValidationError,
  type ArchiveCategoryCommand,
  type CategoryActor,
  type CategoryMutationResult,
  type UpdateCategoryCommand,
} from "../domain/category-administration";

export class PostgresCategoryCommandRepository implements CategoryCommandRepository {
  constructor(private readonly pool: Pool) {}

  async updateCategory(actor: CategoryActor, command: UpdateCategoryCommand): Promise<CategoryMutationResult> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [command.tenantId]);
      const parameters: Array<string | number> = [command.tenantId, command.categoryId, command.expectedVersion];
      const fields: string[] = [];
      if (command.name !== undefined) {
        parameters.push(command.name);
        fields.push(`name = $${parameters.length}::text`);
      }
      if (command.sortOrder !== undefined) {
        parameters.push(command.sortOrder);
        fields.push(`sort_order = $${parameters.length}::integer`);
      }
      fields.push("version = version + 1", "updated_at = now()");

      const updated = await client.query<{ tenant_id: string; id: string; version: string }>(
        `UPDATE categories SET ${fields.join(", ")}
          WHERE tenant_id = $1 AND id = $2 AND version = $3 AND archived_at IS NULL
          RETURNING tenant_id, id, version`,
        parameters,
      );
      const category = updated.rows[0];
      if (!category) {
        const existing = await client.query<{ version: string }>(
          "SELECT version FROM categories WHERE tenant_id = $1 AND id = $2 AND archived_at IS NULL",
          [command.tenantId, command.categoryId],
        );
        if (existing.rows[0]) throw new CategoryConflictError("Categoria foi alterada por outra operação.");
        throw new CategoryNotFoundError("Categoria não encontrada.");
      }

      const changes = {
        ...(command.name === undefined ? {} : { name: command.name }),
        ...(command.sortOrder === undefined ? {} : { sortOrder: command.sortOrder }),
      };
      await client.query(
        `INSERT INTO category_audit_events
          (tenant_id, category_id, actor_id, actor_role, action, changes)
         VALUES ($1, $2, $3, $4, 'category.updated', $5::jsonb)`,
        [command.tenantId, command.categoryId, actor.id, actor.role, JSON.stringify(changes)],
      );
      await client.query("COMMIT");
      return { tenantId: category.tenant_id, categoryId: category.id, version: Number(category.version) };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async archiveCategory(actor: CategoryActor, command: ArchiveCategoryCommand): Promise<CategoryMutationResult> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [command.tenantId]);
      const archived = await client.query<{ tenant_id: string; id: string; version: string }>(
        `UPDATE categories SET archived_at = now(), version = version + 1, updated_at = now()
         WHERE tenant_id = $1 AND id = $2 AND version = $3 AND archived_at IS NULL
         RETURNING tenant_id, id, version`,
        [command.tenantId, command.categoryId, command.expectedVersion],
      );
      const category = archived.rows[0];
      if (!category) {
        const existing = await client.query("SELECT 1 FROM categories WHERE tenant_id = $1 AND id = $2 AND archived_at IS NULL", [command.tenantId, command.categoryId]);
        if (existing.rowCount) throw new CategoryConflictError("Categoria foi alterada por outra operação.");
        throw new CategoryNotFoundError("Categoria não encontrada.");
      }
      const products = await client.query(
        "SELECT 1 FROM products WHERE tenant_id = $1 AND category_id = $2 AND archived_at IS NULL LIMIT 1",
        [command.tenantId, command.categoryId],
      );
      if (products.rowCount) throw new CategoryValidationError("Categoria possui produtos ativos.");
      await client.query(
        `INSERT INTO category_audit_events (tenant_id, category_id, actor_id, actor_role, action, changes)
         VALUES ($1, $2, $3, $4, 'category.archived', '{"archived":true}'::jsonb)`,
        [command.tenantId, command.categoryId, actor.id, actor.role],
      );
      await client.query("COMMIT");
      return { tenantId: category.tenant_id, categoryId: category.id, version: Number(category.version) };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
