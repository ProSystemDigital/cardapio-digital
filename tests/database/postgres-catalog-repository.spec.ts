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
import { PostgresTenantProfileCommandRepository } from "../../data/postgres-tenant-profile-command-repository";
import { TenantProfileAdministrationService } from "../../application/tenant-profile-administration-service";
import { TenantProfileConflictError } from "../../domain/tenant-profile-administration";
import { PostgresTenantProfileAuditRepository } from "../../data/postgres-tenant-profile-audit-repository";
import { PostgresCategoryCommandRepository } from "../../data/postgres-category-command-repository";
import { CategoryAdministrationService } from "../../application/category-administration-service";
import { CategoryConflictError } from "../../domain/category-administration";
import { PostgresCategoryAuditRepository } from "../../data/postgres-category-audit-repository";
import { PostgresCategoryCreationRepository } from "../../data/postgres-category-creation-repository";
import { CategoryCreationService } from "../../application/category-creation-service";
import { PostgresTenantFulfillmentCommandRepository } from "../../data/postgres-tenant-fulfillment-command-repository";
import { TenantFulfillmentAdministrationService } from "../../application/tenant-fulfillment-administration-service";
import { TenantFulfillmentValidationError } from "../../domain/tenant-fulfillment-administration";
import { PostgresTenantOperationsCommandRepository } from "../../data/postgres-tenant-operations-command-repository";
import { TenantOperationsAdministrationService } from "../../application/tenant-operations-administration-service";
import { ProductCreationService } from "../../application/product-creation-service";
import { PostgresProductCreationRepository } from "../../data/postgres-product-creation-repository";
import { CatalogEntityNotFoundError } from "../../domain/catalog-administration";

const databaseUrl = process.env.DATABASE_TEST_URL;
if (!databaseUrl) throw new Error("DATABASE_TEST_URL é obrigatória no teste PostgreSQL.");

test("cria produto indisponível com categoria, opções e auditoria atômicas", async () => {
  const pool = new Pool({ connectionString: databaseUrl, max: 2 });
  const tenantId = "50000000-0000-0000-0000-000000000005";
  const actor = { id: "41000000-0000-4000-8000-000000000001", role: "owner" as const, tenantIds: [tenantId] };
  const service = new ProductCreationService(new PostgresProductCreationRepository(pool));
  try {
    await expect(service.createProduct(actor, {
      tenantId,
      categoryId: "51000000-0000-0000-0000-000000000005",
      name: "Produto novo auditado",
      description: "Criado pelo teste de integração.",
      priceInCents: 3450,
      isAvailable: true,
      fulfillmentModes: ["delivery", "pickup"],
    })).resolves.toMatchObject({ tenantId, version: 1, isAvailable: true });

    await expect(service.createProduct(actor, {
      tenantId,
      categoryId: "31000000-0000-0000-0000-000000000099",
      name: "Produto não persistido",
      description: "",
      priceInCents: 1000,
      isAvailable: false,
      fulfillmentModes: ["pickup"],
    })).rejects.toBeInstanceOf(CatalogEntityNotFoundError);

    const client = await pool.connect();
    try {
      await client.query("BEGIN READ ONLY");
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
      const product = await client.query<{ id: string; slug: string; is_available: boolean; version: string }>(
        "SELECT id, slug, is_available, version FROM products WHERE tenant_id = $1 AND name = 'Produto novo auditado'",
        [tenantId],
      );
      const productId = product.rows[0]?.id;
      const modes = await client.query<{ mode: string }>(
        "SELECT mode FROM product_fulfillment_modes WHERE tenant_id = $1 AND product_id = $2 ORDER BY mode",
        [tenantId, productId],
      );
      const audit = await client.query<{ action: string; changes: Record<string, unknown> }>(
        "SELECT action, changes FROM catalog_audit_events WHERE tenant_id = $1 AND entity_id = $2 AND action = 'product.created'",
        [tenantId, productId],
      );
      await client.query("COMMIT");
      expect(product.rows[0]).toMatchObject({ is_available: true, version: "1" });
      expect(product.rows[0].slug).toMatch(/^produto-novo-auditado-[0-9a-f]{8}$/);
      expect(modes.rows).toEqual([{ mode: "delivery" }, { mode: "pickup" }]);
      expect(audit.rows).toEqual([{ action: "product.created", changes: {
        name: "Produto novo auditado", priceInCents: 3450,
        categoryName: "Imagens", fulfillmentModes: "Entrega, Retirada", isAvailable: true,
      } }]);
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
});

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
      operations: { minimumOrderInCents: 2000, deliveryFeeInCents: 500, version: 1, paymentMethods: ["cash"] },
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
    expect(catalog?.products[0]).not.toHaveProperty("image");
    expect(catalog?.tenant).not.toHaveProperty("logo");
    expect(catalog?.categories[0]).not.toHaveProperty("version");
    await expect(repository.findByTenantId(
      "30000000-0000-0000-0000-000000000003",
    )).resolves.toMatchObject({
      tenant: { slug: "catalogo-postgres", version: 1 },
      categories: [{ name: "Principais", version: 1 }],
      products: [{ name: "Prato local", version: 1 }],
    });
  } finally {
    await pool.end();
  }
});

test("atualiza seções operacionais independentemente e preserva auditoria", async () => {
  const pool = new Pool({ connectionString: databaseUrl, max: 2 });
  const tenantId = "30000000-0000-0000-0000-000000000003";
  try {
    const service = new TenantOperationsAdministrationService(new PostgresTenantOperationsCommandRepository(pool));
    await expect(service.update({
      id: "41000000-0000-4000-8000-000000000001", role: "owner", tenantIds: [tenantId],
    }, {
      tenantId, expectedVersion: 1, section: "attendance", whatsappNumber: "+5511999999999",
      businessHours: [
        { weekday: "monday", opensAt: "10:00", closesAt: "20:00" },
        { weekday: "sunday", opensAt: "11:00", closesAt: "16:00" },
      ],
    })).resolves.toEqual({ tenantId, version: 2 });
    await expect(service.update({
      id: "41000000-0000-4000-8000-000000000001", role: "owner", tenantIds: [tenantId],
    }, {
      tenantId, expectedVersion: 2, section: "tables", diningTables: ["Salão · Mesa 01", "Varanda · Mesa 02"],
    })).resolves.toEqual({ tenantId, version: 3 });
    await expect(service.update({
      id: "41000000-0000-4000-8000-000000000001", role: "owner", tenantIds: [tenantId],
    }, {
      tenantId, expectedVersion: 3, section: "finance", minimumOrderInCents: 3000,
      paymentMethods: ["pix", "credit_card"],
    })).resolves.toEqual({ tenantId, version: 4 });
    await expect(service.update({
      id: "41000000-0000-4000-8000-000000000001", role: "owner", tenantIds: [tenantId],
    }, {
      tenantId, expectedVersion: 4, section: "logistics", deliveryFeeInCents: 700,
      maximumDeliveryDistanceInMeters: 12500,
    })).resolves.toEqual({ tenantId, version: 5 });
    await expect(new PostgresCatalogRepository(pool).findByTenantId(tenantId)).resolves.toMatchObject({ tenant: { operations: {
      version: 5, minimumOrderInCents: 3000, deliveryFeeInCents: 700,
      maximumDeliveryDistanceInMeters: 12500,
      whatsappNumber: "+5511999999999", paymentMethods: ["credit_card", "pix"],
      businessHours: [
        { weekday: "sunday", opensAt: "11:00", closesAt: "16:00" },
        { weekday: "monday", opensAt: "10:00", closesAt: "20:00" },
      ],
      diningTables: ["Salão · Mesa 01", "Varanda · Mesa 02"],
    } } });
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
      const audit = await client.query("SELECT changes FROM tenant_operations_audit_events WHERE tenant_id = $1", [tenantId]);
      expect(audit.rows).toHaveLength(4);
      expect(audit.rows.some(({ changes }) => changes.section === "attendance" && changes.whatsappConfigured)).toBe(true);
      expect(audit.rows.some(({ changes }) => changes.section === "tables" && changes.diningTables.length === 2)).toBe(true);
      expect(audit.rows.some(({ changes }) => changes.section === "finance" && changes.minimumOrderInCents === 3000)).toBe(true);
      expect(audit.rows.some(({ changes }) => changes.section === "logistics" && changes.maximumDeliveryDistanceInMeters === 12500)).toBe(true);
      expect(JSON.stringify(audit.rows)).not.toContain("5511999999999");
      await client.query("ROLLBACK");
    } finally { client.release(); }
  } finally { await pool.end(); }
});

async function validateDineInActivation(): Promise<void> {
  const pool = new Pool({ connectionString: databaseUrl, max: 2 });
  const actor = {
    id: "41000000-0000-4000-8000-000000000001",
    role: "owner" as const,
    tenantIds: ["30000000-0000-0000-0000-000000000003"],
  };
  const productId = "32000000-0000-0000-0000-000000000005";
  const service = new TenantFulfillmentAdministrationService(
    new PostgresTenantFulfillmentCommandRepository(pool),
  );
  try {
    const fixtureClient = await pool.connect();
    try {
      await fixtureClient.query("BEGIN");
      await fixtureClient.query("SELECT set_config('app.tenant_id', $1, true)", [actor.tenantIds[0]]);
      await fixtureClient.query(
        `INSERT INTO products
          (tenant_id, id, category_id, slug, name, description, base_price_in_cents, is_available)
         VALUES ($1, $2, '31000000-0000-0000-0000-000000000003',
                 'produto-consumo-local', 'Produto consumo local',
                 'Fixture exclusiva da ativação', 1000, true)`,
        [actor.tenantIds[0], productId],
      );
      await fixtureClient.query(
        `INSERT INTO product_fulfillment_modes (tenant_id, product_id, mode)
         VALUES ($1, $2, 'pickup')`,
        [actor.tenantIds[0], productId],
      );
      await fixtureClient.query("COMMIT");
    } catch (error) {
      await fixtureClient.query("ROLLBACK");
      throw error;
    } finally {
      fixtureClient.release();
    }

    await expect(service.enableMode(actor, {
      tenantId: actor.tenantIds[0],
      mode: "dine_in",
      initialProductIds: ["32000000-0000-0000-0000-000000000099"],
    })).rejects.toBeInstanceOf(TenantFulfillmentValidationError);

    await expect(service.enableMode(actor, {
      tenantId: actor.tenantIds[0],
      mode: "dine_in",
      initialProductIds: [productId],
    })).resolves.toEqual({
      tenantId: actor.tenantIds[0],
      mode: "dine_in",
      initialProductIds: [productId],
    });

    const client = await pool.connect();
    try {
      await client.query("BEGIN READ ONLY");
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [actor.tenantIds[0]]);
      const tenantModes = await client.query<{ mode: string }>(
        "SELECT mode FROM tenant_fulfillment_modes WHERE tenant_id = $1 ORDER BY mode",
        [actor.tenantIds[0]],
      );
      const productModes = await client.query<{ mode: string }>(
        "SELECT mode FROM product_fulfillment_modes WHERE tenant_id = $1 AND product_id = $2 ORDER BY mode",
        [actor.tenantIds[0], productId],
      );
      const tenantAudit = await client.query<{ action: string; changes: Record<string, unknown> }>(
        `SELECT action, changes FROM tenant_profile_audit_events
          WHERE tenant_id = $1 AND action = 'tenant.fulfillment_mode.enabled'`,
        [actor.tenantIds[0]],
      );
      await client.query("COMMIT");
      expect(tenantModes.rows).toEqual([
        { mode: "delivery" },
        { mode: "dine_in" },
        { mode: "pickup" },
      ]);
      expect(productModes.rows).toContainEqual({ mode: "dine_in" });
      expect(tenantAudit.rows).toEqual([{
        action: "tenant.fulfillment_mode.enabled",
        changes: { mode: "Na mesa", initialProductCount: 1 },
      }]);
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

test("atualiza categoria com versão e auditoria na mesma transação", async () => {
  const pool = new Pool({ connectionString: databaseUrl, max: 2 });
  const actor = {
    id: "41000000-0000-4000-8000-000000000001",
    role: "owner" as const,
    tenantIds: ["30000000-0000-0000-0000-000000000003"],
  };
  const command = {
    tenantId: actor.tenantIds[0],
    categoryId: "31000000-0000-0000-0000-000000000003",
    expectedVersion: 1,
    name: "Pratos principais",
    sortOrder: 2,
  };
  try {
    const service = new CategoryAdministrationService(new PostgresCategoryCommandRepository(pool));
    await expect(service.updateCategory(actor, command)).resolves.toEqual({
      tenantId: command.tenantId,
      categoryId: command.categoryId,
      version: 2,
    });
    await expect(service.updateCategory(actor, command)).rejects.toBeInstanceOf(CategoryConflictError);

    const client = await pool.connect();
    try {
      await client.query("BEGIN READ ONLY");
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [command.tenantId]);
      const category = await client.query<{ name: string; sort_order: number; version: string }>(
        "SELECT name, sort_order, version FROM categories WHERE tenant_id = $1 AND id = $2",
        [command.tenantId, command.categoryId],
      );
      const audit = await client.query<{ actor_role: string; action: string; changes: Record<string, unknown> }>(
        `SELECT actor_role, action, changes FROM category_audit_events
          WHERE tenant_id = $1 AND category_id = $2 ORDER BY occurred_at, id`,
        [command.tenantId, command.categoryId],
      );
      await client.query("COMMIT");
      expect(category.rows[0]).toEqual({ name: "Pratos principais", sort_order: 2, version: "2" });
      expect(audit.rows).toEqual([{
        actor_role: "owner",
        action: "category.updated",
        changes: { name: "Pratos principais", sortOrder: 2 },
      }]);
      await expect(
        new PostgresCategoryAuditRepository(pool).listRecentByTenantId(command.tenantId, 20),
      ).resolves.toEqual([{
        id: expect.any(String),
        tenantId: command.tenantId,
        categoryId: command.categoryId,
        categoryName: "Pratos principais",
        actorRole: "owner",
        newName: "Pratos principais",
        sortOrder: 2,
        occurredAt: expect.any(Date),
      }]);
    } finally {
      client.release();
    }
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
      isAvailable: false,
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
        `SELECT actor_role, changes
           FROM catalog_audit_events
          WHERE tenant_id = $1
            AND entity_id = $2
            AND action = 'product.updated'
          ORDER BY occurred_at, id`,
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
        is_available: false,
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
        { actor_role: "manager", changes: { isAvailable: false, fulfillmentModes: "Retirada" } },
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

test("atualiza perfil do tenant com versão e auditoria na mesma transação", async () => {
  const pool = new Pool({ connectionString: databaseUrl, max: 2 });
  const actor = {
    id: "41000000-0000-4000-8000-000000000001",
    role: "owner" as const,
    tenantIds: ["30000000-0000-0000-0000-000000000003"],
  };
  const command = {
    tenantId: actor.tenantIds[0],
    expectedVersion: 1,
    shortName: "Postgres local",
    tagline: "Perfil validado atomicamente",
  };
  try {
    const service = new TenantProfileAdministrationService(
      new PostgresTenantProfileCommandRepository(pool),
    );
    await expect(service.updateProfile(actor, command)).resolves.toEqual({
      tenantId: command.tenantId,
      version: 2,
    });
    await expect(service.updateProfile(actor, command)).rejects.toBeInstanceOf(
      TenantProfileConflictError,
    );

    const client = await pool.connect();
    try {
      await client.query("BEGIN READ ONLY");
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [command.tenantId]);
      const tenant = await client.query<{
        short_name: string;
        tagline: string;
        version: string;
      }>("SELECT short_name, tagline, version FROM tenants WHERE id = $1", [command.tenantId]);
      const audit = await client.query<{
        actor_role: string;
        action: string;
        changes: Record<string, unknown>;
      }>(
        `SELECT actor_role, action, changes
           FROM tenant_profile_audit_events
          WHERE tenant_id = $1
            AND action = 'tenant.profile.updated'
          ORDER BY occurred_at, id`,
        [command.tenantId],
      );
      await client.query("COMMIT");

      expect(tenant.rows[0]).toEqual({
        short_name: "Postgres local",
        tagline: "Perfil validado atomicamente",
        version: "2",
      });
      expect(audit.rows).toEqual([{
        actor_role: "owner",
        action: "tenant.profile.updated",
        changes: {
          shortName: "Postgres local",
          tagline: "Perfil validado atomicamente",
        },
      }]);
      await expect(
        new PostgresTenantProfileAuditRepository(pool).listRecentByTenantId(
          command.tenantId,
          20,
        ),
      ).resolves.toEqual([{
        id: expect.any(String),
        tenantId: command.tenantId,
        actorRole: "owner",
        shortName: "Postgres local",
        tagline: "Perfil validado atomicamente",
        occurredAt: expect.any(Date),
      }]);
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
});

test("cria categoria e auditoria atomicamente com identificadores derivados", async () => {
  const pool = new Pool({ connectionString: databaseUrl, max: 2 });
  const tenantId = "30000000-0000-0000-0000-000000000003";
  const service = new CategoryCreationService(new PostgresCategoryCreationRepository(pool));
  try {
    await expect(service.createCategory({
      id: "49000000-0000-4000-8000-000000000009",
      role: "owner",
      tenantIds: [tenantId],
    }, {
      tenantId,
      name: "Categoria sem ator persistente",
      sortOrder: 8,
    })).rejects.toThrow();

    const result = await service.createCategory({
      id: "41000000-0000-4000-8000-000000000001",
      role: "owner",
      tenantIds: [tenantId],
    }, { tenantId, name: "Bebidas especiais", sortOrder: 3 });
    expect(result).toEqual({ tenantId, categoryId: expect.any(String), version: 1 });

    const client = await pool.connect();
    try {
      await client.query("BEGIN READ ONLY");
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
      const categories = await client.query<{ id: string; slug: string; name: string; sort_order: number }>(
        `SELECT id, slug, name, sort_order FROM categories
          WHERE tenant_id = $1 AND name IN ('Categoria sem ator persistente', 'Bebidas especiais')
          ORDER BY name`,
        [tenantId],
      );
      const audit = await client.query<{ category_id: string; actor_role: string; action: string; changes: Record<string, unknown> }>(
        "SELECT category_id, actor_role, action, changes FROM category_audit_events WHERE tenant_id = $1 AND action = 'category.created'",
        [tenantId],
      );
      await client.query("COMMIT");
      expect(categories.rows).toEqual([{
        id: result.categoryId,
        slug: `category-${result.categoryId}`,
        name: "Bebidas especiais",
        sort_order: 3,
      }]);
      expect(audit.rows).toEqual([{
        category_id: result.categoryId,
        actor_role: "owner",
        action: "category.created",
        changes: { name: "Bebidas especiais", sortOrder: 3 },
      }]);
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
});

test("ativa Na mesa e produtos iniciais na mesma transação", validateDineInActivation);
