import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import type { FulfillmentMode } from "../domain/catalog";
import { CatalogEntityNotFoundError } from "../domain/catalog-administration";
import type { CreateProductCommand, ProductCreationResult } from "../domain/product-creation";
import type { ProductCreationRepository } from "./product-creation-repository";
import type { CatalogActor } from "../domain/catalog-administration";

const fulfillmentModeLabels: Record<FulfillmentMode, string> = {
  dine_in: "Na mesa",
  pickup: "Retirada",
  delivery: "Entrega",
};

function createTechnicalSlug(name: string, productId: string): string {
  const readable = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "produto";
  return `${readable}-${productId.slice(0, 8)}`;
}

export class PostgresProductCreationRepository implements ProductCreationRepository {
  constructor(private readonly pool: Pool) {}

  async createProduct(
    actor: CatalogActor,
    command: CreateProductCommand,
  ): Promise<ProductCreationResult> {
    const client = await this.pool.connect();
    const productId = randomUUID();
    try {
      await client.query("BEGIN");
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [command.tenantId]);

      const category = await client.query<{ name: string }>(
        "SELECT name FROM categories WHERE tenant_id = $1 AND id = $2 AND archived_at IS NULL FOR KEY SHARE",
        [command.tenantId, command.categoryId],
      );
      if (!category.rows[0]) throw new CatalogEntityNotFoundError("Categoria não encontrada no tenant.");

      const allowedModes = await client.query<{ mode: FulfillmentMode }>(
        "SELECT mode FROM tenant_fulfillment_modes WHERE tenant_id = $1 AND mode = ANY($2::text[])",
        [command.tenantId, command.fulfillmentModes],
      );
      if (allowedModes.rowCount !== command.fulfillmentModes.length) {
        throw new CatalogEntityNotFoundError("Opção de atendimento não habilitada no tenant.");
      }

      const created = await client.query<{ tenant_id: string; id: string; version: string }>(
        `INSERT INTO products
          (tenant_id, id, category_id, slug, name, description, base_price_in_cents, is_available)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING tenant_id, id, version`,
        [command.tenantId, productId, command.categoryId, createTechnicalSlug(command.name, productId),
          command.name, command.description, command.priceInCents, command.isAvailable],
      );
      const product = created.rows[0];
      if (!product) throw new Error("Produto criado sem retorno persistente.");

      await client.query(
        `INSERT INTO product_fulfillment_modes (tenant_id, product_id, mode)
         SELECT $1, $2, unnest($3::text[])`,
        [command.tenantId, productId, command.fulfillmentModes],
      );
      await client.query(
        `INSERT INTO catalog_audit_events
          (tenant_id, actor_id, actor_role, action, entity_type, entity_id, changes)
         VALUES ($1, $2, $3, 'product.created', 'product', $4, $5::jsonb)`,
        [command.tenantId, actor.id, actor.role, productId, JSON.stringify({
          name: command.name,
          priceInCents: command.priceInCents,
          categoryName: category.rows[0].name,
          fulfillmentModes: command.fulfillmentModes.map((mode) => fulfillmentModeLabels[mode]).join(", "),
          isAvailable: command.isAvailable,
        })],
      );
      await client.query("COMMIT");
      return { tenantId: product.tenant_id, productId: product.id, version: 1, isAvailable: command.isAvailable };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
