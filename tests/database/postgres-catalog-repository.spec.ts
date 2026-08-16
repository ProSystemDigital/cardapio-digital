import { expect, test } from "@playwright/test";
import { Pool } from "pg";
import { PostgresCatalogRepository } from "../../data/postgres-catalog-repository";
import { PostgresCatalogCommandRepository } from "../../data/postgres-catalog-command-repository";
import { CatalogAdministrationService } from "../../application/catalog-administration-service";
import { CatalogConflictError } from "../../domain/catalog-administration";
import { PostgresAuthorizationRepository } from "../../data/postgres-authorization-repository";
import { AuthorizationService, AccessDeniedError } from "../../application/authorization-service";
import { PostgresExternalIdentityLinkRepository } from "../../data/postgres-external-identity-link-repository";
import { PostgresCatalogAuditRepository } from "../../data/postgres-catalog-audit-repository";

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
    expect(catalog?.products[0]).not.toHaveProperty("version");
    await expect(repository.findByTenantId(
      "30000000-0000-0000-0000-000000000003",
    )).resolves.toMatchObject({
      tenant: { slug: "catalogo-postgres" },
      products: [{ name: "Prato local", version: 1 }],
    });
  } finally {
    await pool.end();
  }
});

test("deriva memberships ativas e separa papel de plataforma", async () => {
  const pool = new Pool({ connectionString: databaseUrl, max: 1 });
  try {
    const service = new AuthorizationService(new PostgresAuthorizationRepository(pool));
    await expect(service.listTenantAccess(
      { principalId: "41000000-0000-4000-8000-000000000001" },
    )).resolves.toEqual([{
      principalId: "41000000-0000-4000-8000-000000000001",
      tenantId: "30000000-0000-0000-0000-000000000003",
      role: "owner",
    }]);
    await expect(service.authorizeTenant(
      { principalId: "41000000-0000-4000-8000-000000000001" },
      "30000000-0000-0000-0000-000000000003",
      "tenant.memberships.manage",
    )).resolves.toMatchObject({ role: "owner" });

    await expect(service.authorizeTenant(
      { principalId: "43000000-0000-4000-8000-000000000003" },
      "30000000-0000-0000-0000-000000000003",
      "catalog.product.update",
    )).rejects.toBeInstanceOf(AccessDeniedError);

    await expect(service.authorizePlatform(
      { principalId: "42000000-0000-4000-8000-000000000002" },
      "platform.tenants.read",
    )).resolves.toMatchObject({ role: "platform_admin" });
    await expect(service.authorizeTenant(
      { principalId: "42000000-0000-4000-8000-000000000002" },
      "30000000-0000-0000-0000-000000000003",
      "catalog.product.update",
    )).rejects.toBeInstanceOf(AccessDeniedError);
  } finally {
    await pool.end();
  }
});

test("resolve somente vínculo Clerk ativo ligado a principal ativo", async () => {
  const pool = new Pool({ connectionString: databaseUrl, max: 1 });
  try {
    const repository = new PostgresExternalIdentityLinkRepository(pool);
    await expect(repository.resolvePrincipalId({
      issuer: "https://clerk.example.test",
      subject: "user_owner_001",
    })).resolves.toBe("41000000-0000-4000-8000-000000000001");
    await expect(repository.resolvePrincipalId({
      issuer: "https://clerk.example.test",
      subject: "user_disabled_003",
    })).resolves.toBeNull();
    await expect(repository.resolvePrincipalId({
      issuer: "https://clerk.example.test",
      subject: "user_revoked_004",
    })).resolves.toBeNull();
    await expect(repository.resolvePrincipalId({
      issuer: "https://outro-emissor.example.test",
      subject: "user_owner_001",
    })).resolves.toBeNull();
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
    const fixtureClient = await pool.connect();
    try {
      await fixtureClient.query("BEGIN");
      await fixtureClient.query("SELECT set_config('app.tenant_id', $1, true)", [actor.tenantIds[0]]);
      await fixtureClient.query(
        `INSERT INTO categories (tenant_id, id, slug, name, sort_order)
         VALUES ($1, '31000000-0000-0000-0000-000000000004', 'validacao', 'Categoria de validação', 2)`,
        [actor.tenantIds[0]],
      );
      await fixtureClient.query("COMMIT");
    } catch (error) {
      await fixtureClient.query("ROLLBACK");
      throw error;
    } finally {
      fixtureClient.release();
    }
    const service = new CatalogAdministrationService(
      new PostgresCatalogCommandRepository(pool),
    );
    await expect(service.updateProduct(actor, command)).resolves.toEqual({
      productId: command.productId,
      version: 2,
    });
    await expect(service.updateProduct(actor, {
      tenantId: command.tenantId,
      productId: command.productId,
      expectedVersion: 2,
      isAvailable: true,
    })).resolves.toEqual({
      productId: command.productId,
      version: 3,
    });
    await expect(service.updateProduct(actor, {
      tenantId: command.tenantId,
      productId: command.productId,
      expectedVersion: 3,
      priceInCents: 2900,
    })).resolves.toEqual({
      productId: command.productId,
      version: 4,
    });
    await expect(service.updateProduct(actor, {
      tenantId: command.tenantId,
      productId: command.productId,
      expectedVersion: 4,
      name: "Prato atualizado",
      description: "Descrição atualizada.",
    })).resolves.toEqual({
      productId: command.productId,
      version: 5,
    });
    await expect(service.updateProduct(actor, {
      tenantId: command.tenantId,
      productId: command.productId,
      expectedVersion: 5,
      categoryId: "31000000-0000-0000-0000-000000000004",
    })).resolves.toEqual({
      productId: command.productId,
      version: 6,
    });
    await expect(service.updateProduct(actor, {
      tenantId: command.tenantId,
      productId: command.productId,
      expectedVersion: 6,
      fulfillmentModes: ["pickup"],
    })).resolves.toEqual({
      productId: command.productId,
      version: 7,
    });
    await expect(service.updateProduct(actor, command)).rejects.toBeInstanceOf(
      CatalogConflictError,
    );

    const client = await pool.connect();
    try {
      await client.query("BEGIN READ ONLY");
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [command.tenantId]);
      const product = await client.query<{ name: string; description: string; base_price_in_cents: string; is_available: boolean; version: string }>(
        "SELECT name, description, base_price_in_cents, is_available, version FROM products WHERE tenant_id = $1 AND id = $2",
        [command.tenantId, command.productId],
      );
      const audit = await client.query<{ actor_role: string; changes: Record<string, unknown> }>(
        "SELECT actor_role, changes FROM catalog_audit_events WHERE tenant_id = $1 AND entity_id = $2 ORDER BY occurred_at, id",
        [command.tenantId, command.productId],
      );
      const productModes = await client.query<{ mode: string }>(
        "SELECT mode FROM product_fulfillment_modes WHERE tenant_id = $1 AND product_id = $2 ORDER BY mode",
        [command.tenantId, command.productId],
      );
      await client.query("COMMIT");

      expect(product.rows[0]).toEqual({
        name: "Prato atualizado",
        description: "Descrição atualizada.",
        base_price_in_cents: "2900",
        is_available: true,
        version: "7",
      });
      expect(audit.rows).toEqual([
        { actor_role: "manager", changes: {
          isAvailable: false,
          priceInCents: 2800,
        } },
        { actor_role: "manager", changes: { isAvailable: true } },
        { actor_role: "manager", changes: { priceInCents: 2900 } },
        { actor_role: "manager", changes: { name: "Prato atualizado", description: "Descrição atualizada." } },
        { actor_role: "manager", changes: { categoryName: "Categoria de validação" } },
        { actor_role: "manager", changes: { fulfillmentModes: "Retirada" } },
      ]);
      expect(productModes.rows).toEqual([{ mode: "pickup" }]);
      const recentAudit = await new PostgresCatalogAuditRepository(pool)
        .listRecentByTenantId(command.tenantId, 20);
      expect(recentAudit).toHaveLength(6);
      expect(recentAudit[0]).toMatchObject({
        productName: "Prato atualizado",
        actorRole: "manager",
        fulfillmentModes: "Retirada",
      });
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
});
