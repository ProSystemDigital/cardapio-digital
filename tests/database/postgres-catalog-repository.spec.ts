import { expect, test } from "@playwright/test";
import { Pool } from "pg";
import { PostgresCatalogRepository } from "../../data/postgres-catalog-repository";

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
