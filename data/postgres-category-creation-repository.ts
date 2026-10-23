import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import type { CategoryCreationRepository } from "./category-creation-repository";
import type {
  CategoryActor,
  CategoryMutationResult,
  CreateCategoryCommand,
} from "../domain/category-administration";

export class PostgresCategoryCreationRepository implements CategoryCreationRepository {
  constructor(private readonly pool: Pool) {}

  async createCategory(
    actor: CategoryActor,
    command: CreateCategoryCommand,
  ): Promise<CategoryMutationResult> {
    const client = await this.pool.connect();
    const categoryId = randomUUID();
    const technicalSlug = `category-${categoryId}`;
    try {
      await client.query("BEGIN");
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [command.tenantId]);
      const created = await client.query<{ tenant_id: string; id: string; version: string }>(
        `INSERT INTO categories (tenant_id, id, slug, name, sort_order)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING tenant_id, id, version`,
        [command.tenantId, categoryId, technicalSlug, command.name, command.sortOrder],
      );
      const category = created.rows[0];
      if (!category) throw new Error("Categoria criada sem retorno persistente.");

      await client.query(
        `INSERT INTO category_audit_events
          (tenant_id, category_id, actor_id, actor_role, action, changes)
         VALUES ($1, $2, $3, $4, 'category.created', $5::jsonb)`,
        [
          command.tenantId,
          categoryId,
          actor.id,
          actor.role,
          JSON.stringify({ name: command.name, sortOrder: command.sortOrder }),
        ],
      );
      await client.query("COMMIT");
      return {
        tenantId: category.tenant_id,
        categoryId: category.id,
        version: Number(category.version),
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
