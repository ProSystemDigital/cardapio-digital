import { expect, test } from "@playwright/test";
import { Pool } from "pg";
import { PostgresCatalogRepository } from "../../data/postgres-catalog-repository";
import { PostgresCatalogCommandRepository } from "../../data/postgres-catalog-command-repository";
import { CatalogAdministrationService } from "../../application/catalog-administration-service";
import { CatalogConflictError } from "../../domain/catalog-administration";

const databaseUrl = process.env.DATABASE_TEST_URL;
if (!databaseUrl) throw new Error("DATABASE_TEST_URL é obrigatória no teste PostgreSQL.");

test("reconstrói catálogo persistido pelo contrato atual", async () => {
  const pool = new Pool({ connectionString: databaseUrl, max: 1 });
  try {
    const repository = new PostgresCatalogRepository(pool);
    await expect(repository.listTenantSlugs()).resolves.toContain("catalogo-postgres");
    await expect(repository.findByTenantSlug("inexistente")).resolves.toBeNull();

    const catalog = await repository.findByTenantSlug("catalogo-postgres");
    expect(catalog?.tenant).toMatchObject({
      id: "30000000-0000-0000-0000-000000000003",
      fulfillmentModes: ["delivery", "pickup"],
      operations: { minimumOrderInCents: 2000, deliveryFeeInCents: 500 },
    });
    expect(catalog?.tenant.operations.businessHours).toEqual([
      { weekday: "monday", opensAt: "09:00", closesAt: "18:00" },
    ]);
    expect(catalog?.products[0]).toMatchObject({
      name: "Prato local",
      priceInCents: 2500,
      emoji: "🍽️",
      tag: "Teste",
      fulfillmentModes: ["delivery", "pickup"],
      variations: [{ name: "Grande", priceDeltaInCents: 500 }],
      addonGroups: [{ name: "Extras", addons: [{ name: "Extra local", priceInCents: 300 }] }],
    });
  } finally {
    await pool.end();
  }
});

test("atualiza produto e auditoria atomicamente com concorrência otimista", async () => {
  const pool = new Pool({ connectionString: databaseUrl, max: 2 });
  const actor = {
    id: "36000000-0000-4000-8000-000000000003",
    role: "manager" as const,
    tenantIds: ["30000000-0000-0000-0000-000000000003"],
  };
  const command = {
    tenantId: actor.tenantIds[0],
    productId: "32000000-0000-0000-0000-000000000003",
    expectedVersion: 1,
    priceInCents: 2800,
    isAvailable: false,
  };
  try {
    const service = new CatalogAdministrationService(
      new PostgresCatalogCommandRepository(pool),
    );
    await expect(service.updateProduct(actor, command)).resolves.toEqual({
      productId: command.productId,
      version: 2,
    });
    await expect(service.updateProduct(actor, command)).rejects.toBeInstanceOf(
      CatalogConflictError,
    );

    const client = await pool.connect();
    try {
      await client.query("BEGIN READ ONLY");
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [command.tenantId]);
      const product = await client.query<{ base_price_in_cents: string; is_available: boolean; version: string }>(
        "SELECT base_price_in_cents, is_available, version FROM products WHERE tenant_id = $1 AND id = $2",
        [command.tenantId, command.productId],
      );
      const audit = await client.query<{ actor_role: string; changes: Record<string, unknown> }>(
        "SELECT actor_role, changes FROM catalog_audit_events WHERE tenant_id = $1 AND entity_id = $2",
        [command.tenantId, command.productId],
      );
      await client.query("COMMIT");

      expect(product.rows[0]).toEqual({
        base_price_in_cents: "2800",
        is_available: false,
        version: "2",
      });
      expect(audit.rows).toEqual([{ actor_role: "manager", changes: {
        isAvailable: false,
        priceInCents: 2800,
      } }]);
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
});
