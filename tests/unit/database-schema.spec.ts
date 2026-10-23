import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migrationsDirectory = resolve(process.cwd(), "database", "migrations");
const up = readFileSync(resolve(migrationsDirectory, "0001_initial_schema.up.sql"), "utf8");
const down = readFileSync(resolve(migrationsDirectory, "0001_initial_schema.down.sql"), "utf8");
const integrationTest = readFileSync(
  resolve(process.cwd(), "database", "tests", "multitenant-isolation.sql"),
  "utf8",
);
const localRunner = readFileSync(
  resolve(process.cwd(), "scripts", "database", "test-local-postgres.ps1"),
  "utf8",
);
const secondUp = readFileSync(resolve(migrationsDirectory, "0002_catalog_repository.up.sql"), "utf8");
const secondDown = readFileSync(resolve(migrationsDirectory, "0002_catalog_repository.down.sql"), "utf8");
const writesUp = readFileSync(resolve(migrationsDirectory, "0003_catalog_writes.up.sql"), "utf8");
const writesDown = readFileSync(resolve(migrationsDirectory, "0003_catalog_writes.down.sql"), "utf8");
const authorizationUp = readFileSync(resolve(migrationsDirectory, "0004_identity_authorization.up.sql"), "utf8");
const authorizationDown = readFileSync(resolve(migrationsDirectory, "0004_identity_authorization.down.sql"), "utf8");
const identityLinksUp = readFileSync(resolve(migrationsDirectory, "0005_external_identity_links.up.sql"), "utf8");
const identityLinksDown = readFileSync(resolve(migrationsDirectory, "0005_external_identity_links.down.sql"), "utf8");
const principalTenantAccessUp = readFileSync(resolve(migrationsDirectory, "0006_principal_tenant_access.up.sql"), "utf8");
const principalTenantAccessDown = readFileSync(resolve(migrationsDirectory, "0006_principal_tenant_access.down.sql"), "utf8");
const tenantProfileWritesUp = readFileSync(resolve(migrationsDirectory, "0007_tenant_profile_writes.up.sql"), "utf8");
const tenantProfileWritesDown = readFileSync(resolve(migrationsDirectory, "0007_tenant_profile_writes.down.sql"), "utf8");
const categoryWritesUp = readFileSync(resolve(migrationsDirectory, "0008_category_writes.up.sql"), "utf8");
const categoryWritesDown = readFileSync(resolve(migrationsDirectory, "0008_category_writes.down.sql"), "utf8");
const categoryCreationUp = readFileSync(resolve(migrationsDirectory, "0009_category_creation.up.sql"), "utf8");
const categoryCreationDown = readFileSync(resolve(migrationsDirectory, "0009_category_creation.down.sql"), "utf8");
const tenantFulfillmentUp = readFileSync(resolve(migrationsDirectory, "0010_tenant_fulfillment_activation.up.sql"), "utf8");
const tenantFulfillmentDown = readFileSync(resolve(migrationsDirectory, "0010_tenant_fulfillment_activation.down.sql"), "utf8");
const catalogImageMetadataUp = readFileSync(resolve(migrationsDirectory, "0011_catalog_image_metadata.up.sql"), "utf8");
const catalogImageMetadataDown = readFileSync(resolve(migrationsDirectory, "0011_catalog_image_metadata.down.sql"), "utf8");
const catalogImageAuditUp = readFileSync(resolve(migrationsDirectory, "0012_catalog_image_audit_actions.up.sql"), "utf8");
const catalogImageAuditDown = readFileSync(resolve(migrationsDirectory, "0012_catalog_image_audit_actions.down.sql"), "utf8");
const tenantOperationsUp = readFileSync(resolve(migrationsDirectory, "0013_tenant_operations_writes.up.sql"), "utf8");
const tenantOperationsDown = readFileSync(resolve(migrationsDirectory, "0013_tenant_operations_writes.down.sql"), "utf8");
const deliveryDistanceUp = readFileSync(resolve(migrationsDirectory, "0014_delivery_distance.up.sql"), "utf8");
const deliveryDistanceDown = readFileSync(resolve(migrationsDirectory, "0014_delivery_distance.down.sql"), "utf8");
const deliveryOriginUp = readFileSync(resolve(migrationsDirectory, "0015_tenant_delivery_origin.up.sql"), "utf8");
const deliveryOriginDown = readFileSync(resolve(migrationsDirectory, "0015_tenant_delivery_origin.down.sql"), "utf8");
const tenantPrivacyUp = readFileSync(resolve(migrationsDirectory, "0016_tenant_privacy_settings.up.sql"), "utf8");
const tenantPrivacyDown = readFileSync(resolve(migrationsDirectory, "0016_tenant_privacy_settings.down.sql"), "utf8");
const productCreationUp = readFileSync(resolve(migrationsDirectory, "0017_product_creation.up.sql"), "utf8");
const productCreationDown = readFileSync(resolve(migrationsDirectory, "0017_product_creation.down.sql"), "utf8");
const categoryArchivingUp = readFileSync(resolve(migrationsDirectory, "0019_category_archiving.up.sql"), "utf8");
const categoryArchivingDown = readFileSync(resolve(migrationsDirectory, "0019_category_archiving.down.sql"), "utf8");
const defaultFulfillmentModesUp = readFileSync(resolve(migrationsDirectory, "0021_default_fulfillment_modes.up.sql"), "utf8");
const defaultFulfillmentModesDown = readFileSync(resolve(migrationsDirectory, "0021_default_fulfillment_modes.down.sql"), "utf8");
const diningTablesUp = readFileSync(resolve(migrationsDirectory, "0022_dining_tables.up.sql"), "utf8");
const diningTablesDown = readFileSync(resolve(migrationsDirectory, "0022_dining_tables.down.sql"), "utf8");
const catalogImageMetadataIsolation = readFileSync(
  resolve(process.cwd(), "database", "tests", "catalog-image-metadata-isolation.sql"),
  "utf8",
);
const catalogImageCleanup = readFileSync(
  resolve(process.cwd(), "database", "tests", "catalog-image-cleanup.sql"),
  "utf8",
);
const identityLinksFixture = readFileSync(
  resolve(process.cwd(), "database", "tests", "external-identity-fixture.sql"),
  "utf8",
);

const tenantTables = [
  "tenants",
  "tenant_branding",
  "tenant_operations",
  "tenant_fulfillment_modes",
  "business_hours",
  "categories",
  "products",
  "product_fulfillment_modes",
  "product_variations",
  "addon_groups",
  "addons",
  "orders",
  "order_items",
  "order_item_addons",
] as const;

test("migration inicial e rollback são transacionais e simétricos", () => {
  expect(up.trim()).toMatch(/^BEGIN;[\s\S]*COMMIT;$/);
  expect(down.trim()).toMatch(/^BEGIN;[\s\S]*COMMIT;$/);

  for (const table of tenantTables) {
    expect(up).toContain(`CREATE TABLE ${table} (`);
    expect(down).toContain(`DROP TABLE IF EXISTS ${table};`);
  }
});

test("migration do repositório é transacional e reversível", () => {
  expect(secondUp.trim()).toMatch(/^BEGIN;[\s\S]*COMMIT;$/);
  expect(secondDown.trim()).toMatch(/^BEGIN;[\s\S]*COMMIT;$/);
  expect(secondUp).toContain("ADD COLUMN emoji");
  expect(secondUp).toContain("CREATE FUNCTION public.resolve_public_tenant_id");
  expect(secondUp).toContain("CREATE FUNCTION public.list_public_tenant_slugs");
  expect(secondDown).toContain("DROP FUNCTION IF EXISTS public.resolve_public_tenant_id");
  expect(secondDown).toContain("DROP COLUMN IF EXISTS emoji");
});

test("migration de escrita versiona produto e protege auditoria por RLS", () => {
  expect(writesUp.trim()).toMatch(/^BEGIN;[\s\S]*COMMIT;$/);
  expect(writesDown.trim()).toMatch(/^BEGIN;[\s\S]*COMMIT;$/);
  expect(writesUp).toContain("ADD COLUMN version bigint NOT NULL DEFAULT 1");
  expect(writesUp).toContain("CREATE TABLE catalog_audit_events");
  expect(writesUp).toContain("catalog_audit_events ENABLE ROW LEVEL SECURITY");
  expect(writesUp).toContain("catalog_audit_events FORCE ROW LEVEL SECURITY");
  expect(writesUp).toContain("catalog_audit_events_select");
  expect(writesUp).toContain("catalog_audit_events_insert");
  expect(writesUp).not.toContain("catalog_audit_events_tenant_isolation");
  expect(writesUp).toContain("FOREIGN KEY (tenant_id, entity_id)");
  expect(writesDown).toContain("DROP TABLE IF EXISTS catalog_audit_events");
});

test("identidade separa memberships e papéis de plataforma sem PII", () => {
  expect(authorizationUp.trim()).toMatch(/^BEGIN;[\s\S]*COMMIT;$/);
  expect(authorizationDown.trim()).toMatch(/^BEGIN;[\s\S]*COMMIT;$/);
  expect(authorizationUp).toContain("CREATE TABLE principals");
  expect(authorizationUp).toContain("CREATE TABLE tenant_memberships");
  expect(authorizationUp).toContain("CREATE TABLE platform_role_assignments");
  expect(authorizationUp).toContain("CREATE TABLE access_audit_events");
  expect(authorizationUp).toContain("tenant_memberships_select_self");
  expect(authorizationUp).toContain("platform_role_assignments_select_self");
  expect(authorizationUp).not.toMatch(/\b(email|phone|display_name|password|address)\b/i);
  expect(authorizationDown).toContain("DROP TABLE IF EXISTS principals");
});

test("vínculo externo expõe somente resolvedor estreito e reversível", () => {
  expect(identityLinksUp.trim()).toMatch(/^BEGIN;[\s\S]*COMMIT;$/);
  expect(identityLinksDown.trim()).toMatch(/^BEGIN;[\s\S]*COMMIT;$/);
  expect(identityLinksUp).toContain("CREATE TABLE external_identity_links");
  expect(identityLinksUp).toContain("external_identity_links ENABLE ROW LEVEL SECURITY");
  expect(identityLinksUp).not.toContain("CREATE POLICY");
  expect(identityLinksUp).toContain("SECURITY DEFINER");
  expect(identityLinksUp).toContain("SET search_path = pg_catalog, public");
  expect(identityLinksUp).toContain("principal.status = 'active'");
  expect(identityLinksUp).not.toMatch(/\b(email|phone|display_name|password|token)\b/i);
  expect(identityLinksDown).toContain("DROP TABLE IF EXISTS external_identity_links");
  expect(identityLinksFixture).toContain("status, revoked_at");
  expect(identityLinksFixture).toContain("'revoked',\n    now()");
});

test("memberships do principal usam função estreita e reversível", () => {
  expect(principalTenantAccessUp).toContain("CREATE FUNCTION public.list_principal_tenant_access");
  expect(principalTenantAccessUp).toContain("SECURITY DEFINER");
  expect(principalTenantAccessUp).toContain("membership.status = 'active'");
  expect(principalTenantAccessUp).toContain("principal.status = 'active'");
  expect(principalTenantAccessUp).toContain("REVOKE ALL ON FUNCTION public.list_principal_tenant_access(uuid) FROM PUBLIC");
  expect(principalTenantAccessDown).toContain("DROP FUNCTION IF EXISTS public.list_principal_tenant_access(uuid)");
});

test("fundação de escrita do perfil versiona tenant e separa auditoria", () => {
  expect(tenantProfileWritesUp.trim()).toMatch(/^BEGIN;[\s\S]*COMMIT;$/);
  expect(tenantProfileWritesDown.trim()).toMatch(/^BEGIN;[\s\S]*COMMIT;$/);
  expect(tenantProfileWritesUp).toContain("ALTER TABLE tenants");
  expect(tenantProfileWritesUp).toContain("ADD COLUMN version bigint NOT NULL DEFAULT 1");
  expect(tenantProfileWritesUp).toContain("CREATE TABLE tenant_profile_audit_events");
  expect(tenantProfileWritesUp).toContain("tenant_profile_audit_events ENABLE ROW LEVEL SECURITY");
  expect(tenantProfileWritesUp).toContain("tenant_profile_audit_events FORCE ROW LEVEL SECURITY");
  expect(tenantProfileWritesUp).toContain("tenant_profile_audit_events_select");
  expect(tenantProfileWritesUp).toContain("tenant_profile_audit_events_insert");
  expect(tenantProfileWritesUp).toContain("REVOKE ALL ON tenant_profile_audit_events FROM PUBLIC");
  expect(tenantProfileWritesUp).not.toContain("GRANT ");
  expect(tenantProfileWritesDown).toContain("DROP TABLE IF EXISTS tenant_profile_audit_events");
  expect(tenantProfileWritesDown).toContain("ALTER TABLE tenants DROP COLUMN IF EXISTS version");
});

test("fundação de escrita de categorias versiona entidade e separa auditoria", () => {
  expect(categoryWritesUp.trim()).toMatch(/^BEGIN;[\s\S]*COMMIT;$/);
  expect(categoryWritesDown.trim()).toMatch(/^BEGIN;[\s\S]*COMMIT;$/);
  expect(categoryWritesUp).toContain("ALTER TABLE categories");
  expect(categoryWritesUp).toContain("ADD COLUMN version bigint NOT NULL DEFAULT 1");
  expect(categoryWritesUp).toContain("CREATE TABLE category_audit_events");
  expect(categoryWritesUp).toContain("FOREIGN KEY (tenant_id, category_id)");
  expect(categoryWritesUp).toContain("category_audit_events ENABLE ROW LEVEL SECURITY");
  expect(categoryWritesUp).toContain("category_audit_events FORCE ROW LEVEL SECURITY");
  expect(categoryWritesUp).toContain("category_audit_events_select");
  expect(categoryWritesUp).toContain("category_audit_events_insert");
  expect(categoryWritesUp).toContain("REVOKE ALL ON category_audit_events FROM PUBLIC");
  expect(categoryWritesUp).not.toContain("GRANT ");
  expect(categoryWritesDown).toContain("DROP TABLE IF EXISTS category_audit_events");
  expect(categoryWritesDown).toContain("ALTER TABLE categories DROP COLUMN IF EXISTS version");
});

test("migration de criação de categorias amplia auditoria de forma reversível", () => {
  expect(categoryCreationUp.trim()).toMatch(/^BEGIN;[\s\S]*COMMIT;$/);
  expect(categoryCreationDown.trim()).toMatch(/^BEGIN;[\s\S]*COMMIT;$/);
  expect(categoryCreationUp).toContain("DROP CONSTRAINT category_audit_events_action_check");
  expect(categoryCreationUp).toContain("'category.created'");
  expect(categoryCreationUp).not.toContain("GRANT ");
  expect(categoryCreationDown).toContain("CHECK (action IN ('category.updated'))");
});

test("migration de criação de produtos amplia auditoria sem conceder acesso", () => {
  expect(productCreationUp.trim()).toMatch(/^BEGIN;[\s\S]*COMMIT;$/);
  expect(productCreationDown.trim()).toMatch(/^BEGIN;[\s\S]*COMMIT;$/);
  expect(productCreationUp).toContain("'product.created'");
  expect(productCreationUp).not.toContain("GRANT ");
  expect(productCreationDown).toContain("DELETE FROM catalog_audit_events WHERE action = 'product.created'");
  expect(productCreationDown).not.toContain("'product.created',");
  expect(localRunner).toContain("productCreationUpMigration");
  expect(localRunner).toContain("productCreationDownMigration");
});

test("migration de arquivamento de categorias é transacional e reversível", () => {
  expect(categoryArchivingUp.trim()).toMatch(/^BEGIN;[\s\S]*COMMIT;$/);
  expect(categoryArchivingDown.trim()).toMatch(/^BEGIN;[\s\S]*COMMIT;$/);
  expect(categoryArchivingUp).toContain("'category.archived'");
  expect(categoryArchivingUp).not.toContain("GRANT ");
  expect(categoryArchivingDown).toContain("DELETE FROM category_audit_events WHERE action = 'category.archived'");
  expect(localRunner).toContain("categoryArchivingUpMigration");
  expect(localRunner).toContain("categoryArchivingDownMigration");
});

test("migration de modalidade do tenant amplia auditoria de forma reversível", () => {
  expect(tenantFulfillmentUp).toContain("tenant.fulfillment_mode.enabled");
  expect(tenantFulfillmentUp.trim()).toMatch(/^BEGIN;[\s\S]*COMMIT;$/);
  expect(tenantFulfillmentUp).not.toContain("GRANT ");
  expect(tenantFulfillmentDown).not.toContain("tenant.fulfillment_mode.enabled");
  expect(tenantFulfillmentDown).toContain("tenant.profile.updated");
  expect(localRunner).toContain("tenantFulfillmentUpMigration");
  expect(localRunner).toContain("tenantFulfillmentDownMigration");
  expect(localRunner).toContain("tenantFulfillmentCleanup");
});

test("fundação de imagens mantém binários fora do PostgreSQL e isola metadados", () => {
  expect(catalogImageMetadataUp.trim()).toMatch(/^BEGIN;[\s\S]*COMMIT;$/);
  expect(catalogImageMetadataDown.trim()).toMatch(/^BEGIN;[\s\S]*COMMIT;$/);
  expect(catalogImageMetadataUp).toContain("CREATE TABLE tenant_profile_images");
  expect(catalogImageMetadataUp).toContain("CREATE TABLE product_catalog_images");
  expect(catalogImageMetadataUp).toContain("FOREIGN KEY (tenant_id, product_id)");
  expect(catalogImageMetadataUp).toContain("media_type = 'image/webp'");
  expect(catalogImageMetadataUp).toContain("width_pixels = 512");
  expect(catalogImageMetadataUp).toContain("width_pixels = 1200");
  expect(catalogImageMetadataUp).toContain("content_sha256");
  expect(catalogImageMetadataUp).toContain("ENABLE ROW LEVEL SECURITY");
  expect(catalogImageMetadataUp).toContain("FORCE ROW LEVEL SECURITY");
  expect(catalogImageMetadataUp).toContain("REVOKE ALL ON tenant_profile_images FROM PUBLIC");
  expect(catalogImageMetadataUp).not.toMatch(/\b(bytea|large object|GRANT)\b/i);
  expect(catalogImageMetadataDown).toContain("DROP TABLE IF EXISTS product_catalog_images");
  expect(catalogImageMetadataDown).toContain("DROP TABLE IF EXISTS tenant_profile_images");
  expect(localRunner).toContain("catalogImageMetadataUpMigration");
  expect(localRunner).toContain("catalogImageMetadataDownMigration");
  expect(localRunner).toContain("catalogImageMetadataIsolation");
  expect(catalogImageMetadataIsolation).toContain("RLS de imagens expôs linhas sem contexto de tenant");
  expect(catalogImageMetadataIsolation).toContain("RLS de imagens não isolou o tenant A");
  expect(catalogImageMetadataIsolation).toContain("referência de imagem entre tenants foi aceita");
});

test("auditoria de imagens amplia ações sem conceder privilégios", () => {
  expect(catalogImageAuditUp.trim()).toMatch(/^BEGIN;[\s\S]*COMMIT;$/);
  expect(catalogImageAuditDown.trim()).toMatch(/^BEGIN;[\s\S]*COMMIT;$/);
  expect(catalogImageAuditUp).toContain("tenant.logo.updated");
  expect(catalogImageAuditUp).toContain("product.image.updated");
  expect(catalogImageAuditUp).not.toContain("GRANT ");
  expect(catalogImageAuditDown).not.toContain("tenant.logo.updated");
  expect(catalogImageAuditDown).not.toContain("product.image.updated");
  expect(localRunner).toContain("catalogImageAuditUpMigration");
  expect(localRunner).toContain("catalogImageAuditDownMigration");
  expect(localRunner).toContain("catalogImageCommandFixture");
});

test("configuração operacional é versionada, isolada, auditada e reversível", () => {
  expect(tenantOperationsUp.trim()).toMatch(/^BEGIN;[\s\S]*COMMIT;$/);
  expect(tenantOperationsDown.trim()).toMatch(/^BEGIN;[\s\S]*COMMIT;$/);
  expect(tenantOperationsUp).toContain("ADD COLUMN version bigint NOT NULL DEFAULT 1");
  expect(tenantOperationsUp).toContain("CREATE TABLE tenant_payment_methods");
  expect(tenantOperationsUp).toContain("CREATE TABLE tenant_operations_audit_events");
  expect(tenantOperationsUp).toContain("ENABLE ROW LEVEL SECURITY");
  expect(tenantOperationsUp).toContain("FORCE ROW LEVEL SECURITY");
  expect(tenantOperationsUp).not.toContain("GRANT ");
  expect(tenantOperationsDown).toContain("DROP TABLE IF EXISTS tenant_operations_audit_events");
  expect(localRunner).toContain("tenantOperationsUpMigration");
  expect(localRunner).toContain("tenantOperationsDownMigration");
});

test("distância máxima de entrega usa metros, limites e rollback", () => {
  expect(deliveryDistanceUp.trim()).toMatch(/^BEGIN;[\s\S]*COMMIT;$/);
  expect(deliveryDistanceUp).toContain("maximum_delivery_distance_in_meters integer NOT NULL DEFAULT 10000");
  expect(deliveryDistanceUp).toContain("BETWEEN 500 AND 200000");
  expect(deliveryDistanceUp).not.toContain("GRANT ");
  expect(deliveryDistanceDown).toContain("DROP COLUMN IF EXISTS maximum_delivery_distance_in_meters");
  expect(localRunner).toContain("deliveryDistanceUpMigration");
  expect(localRunner).toContain("deliveryDistanceDownMigration");
});

test("origem logística é isolada, versionada, auditada e reversível", () => {
  expect(deliveryOriginUp.trim()).toMatch(/^BEGIN;[\s\S]*COMMIT;$/);
  expect(deliveryOriginDown.trim()).toMatch(/^BEGIN;[\s\S]*COMMIT;$/);
  expect(deliveryOriginUp).toContain("CREATE TABLE tenant_delivery_origins");
  expect(deliveryOriginUp).toContain("CREATE TABLE tenant_delivery_origin_audit_events");
  expect(deliveryOriginUp).toContain("geocoding_status IN ('pending', 'verified', 'failed')");
  expect(deliveryOriginUp).toContain("ENABLE ROW LEVEL SECURITY");
  expect(deliveryOriginUp).toContain("FORCE ROW LEVEL SECURITY");
  expect(deliveryOriginUp).toContain("current_setting('app.tenant_id', true)");
  expect(deliveryOriginUp).not.toContain("GRANT ");
  expect(deliveryOriginDown).toContain("DROP TABLE IF EXISTS tenant_delivery_origins");
  expect(localRunner).toContain("deliveryOriginUpMigration");
  expect(localRunner).toContain("deliveryOriginDownMigration");
});

test("privacidade do tenant exige canal e retenção, com RLS e rollback", () => {
  expect(tenantPrivacyUp.trim()).toMatch(/^BEGIN;[\s\S]*COMMIT;$/);
  expect(tenantPrivacyDown.trim()).toMatch(/^BEGIN;[\s\S]*COMMIT;$/);
  expect(tenantPrivacyUp).toContain("CREATE TABLE tenant_privacy_settings");
  expect(tenantPrivacyUp).toContain("CREATE TABLE tenant_privacy_audit_events");
  expect(tenantPrivacyUp).toContain("order_address_retention_days BETWEEN 1 AND 3650");
  expect(tenantPrivacyUp).toContain("ENABLE ROW LEVEL SECURITY");
  expect(tenantPrivacyUp).toContain("FORCE ROW LEVEL SECURITY");
  expect(tenantPrivacyUp).not.toContain("GRANT ");
  expect(tenantPrivacyDown).toContain("DROP TABLE IF EXISTS tenant_privacy_settings");
  expect(localRunner).toContain("tenantPrivacyUpMigration");
  expect(localRunner).toContain("tenantPrivacyDownMigration");
});

test("modalidades padrão cobrem contas existentes, futuras e rollback seguro", () => {
  expect(defaultFulfillmentModesUp.trim()).toMatch(/^BEGIN;[\s\S]*COMMIT;$/);
  expect(defaultFulfillmentModesDown.trim()).toMatch(/^BEGIN;[\s\S]*COMMIT;$/);
  expect(defaultFulfillmentModesUp).toContain("VALUES ('dine_in'::text), ('pickup'::text), ('delivery'::text)");
  expect(defaultFulfillmentModesUp).toContain("tenant_default_fulfillment_mode_enrollments");
  expect(defaultFulfillmentModesUp).toContain("FORCE ROW LEVEL SECURITY");
  expect(defaultFulfillmentModesUp).not.toContain("GRANT ");
  expect(defaultFulfillmentModesDown).toContain("default fulfillment modes are already used by products");
  expect(defaultFulfillmentModesDown).toContain("DROP TABLE tenant_default_fulfillment_mode_enrollments");
});

test("identificações de mesa possuem limite persistente e rollback", () => {
  expect(diningTablesUp.trim()).toMatch(/^BEGIN;[\s\S]*COMMIT;$/);
  expect(diningTablesDown.trim()).toMatch(/^BEGIN;[\s\S]*COMMIT;$/);
  expect(diningTablesUp).toContain("ADD COLUMN dining_table_labels text[] NOT NULL");
  expect(diningTablesUp).toContain("cardinality(dining_table_labels) <= 100");
  expect(diningTablesUp).not.toContain("GRANT ");
  expect(diningTablesDown).toContain("DROP COLUMN IF EXISTS dining_table_labels");
});

test("todas as tabelas negam acesso sem contexto de tenant", () => {
  for (const table of tenantTables) {
    expect(up).toContain(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);
    expect(up).toContain(`ALTER TABLE ${table} FORCE ROW LEVEL SECURITY;`);
    expect(up).toContain(`CREATE POLICY ${table}_tenant_isolation ON ${table}`);
  }

  expect(up).toContain("current_setting('app.tenant_id', true)");
  expect(up).not.toMatch(/CREATE POLICY[\s\S]*USING\s*\(true\)/i);
});

test("relações críticas carregam tenant nas chaves estrangeiras", () => {
  const compositeReferences = [
    "FOREIGN KEY (tenant_id, category_id)",
    "FOREIGN KEY (tenant_id, product_id)",
    "FOREIGN KEY (tenant_id, mode)",
    "FOREIGN KEY (tenant_id, product_id, addon_group_id)",
    "FOREIGN KEY (tenant_id, fulfillment_mode)",
    "FOREIGN KEY (tenant_id, order_id)",
    "FOREIGN KEY (tenant_id, order_id, order_item_id)",
    "FOREIGN KEY (tenant_id, addon_id)",
  ];

  for (const reference of compositeReferences) {
    expect(up).toContain(reference);
  }
});

test("valores históricos usam centavos inteiros e snapshots", () => {
  expect(up).toContain("base_price_in_cents bigint");
  expect(up).toContain("product_name_snapshot text NOT NULL");
  expect(up).toContain("unit_price_in_cents_snapshot bigint");
  expect(up).toContain("addon_name_snapshot text NOT NULL");
  expect(up).not.toMatch(/\b(decimal|numeric|money|real|double precision)\b/i);
});

test("esquema não antecipa dados pessoais", () => {
  const personalDataColumns = [
    "customer_name",
    "phone",
    "email",
    "address",
    "postal_code",
    "cpf",
    "table_number",
  ];

  for (const column of personalDataColumns) {
    expect(up.toLowerCase()).not.toContain(column);
  }
});

test("gate local usa recursos descartáveis e papel sem bypass de RLS", () => {
  expect(localRunner).toContain('$testDatabase = "cardapio_digital_test"');
  expect(localRunner).toContain('$runtimeRole = "cardapio_runtime_test"');
  expect(localRunner).toContain("LOGIN PASSWORD");
  expect(localRunner).toContain("NOSUPERUSER");
  expect(localRunner).toContain("NOBYPASSRLS");
  expect(localRunner).toContain("Remove-Item Env:\\PGPASSWORD");
  expect(localRunner).toContain("Remove-Item Env:\\DATABASE_TEST_URL");
  expect(localRunner).toContain('$env:PGCLIENTENCODING = "UTF8"');
  expect(localRunner).toContain("Remove-Item Env:\\PGCLIENTENCODING");
  expect(localRunner).toContain("--if-exists --force");
  expect(localRunner).toContain("catalog-image-cleanup.sql");
  expect(catalogImageCleanup).toContain("action = 'tenant.logo.updated'");
  expect(catalogImageCleanup).toContain("action = 'product.image.updated'");
});

test("teste PostgreSQL cobre negação, isolamento e snapshots", () => {
  expect(integrationTest).toContain("RLS expôs linhas sem contexto de tenant");
  expect(integrationTest).toContain("RLS não isolou a leitura do tenant A");
  expect(integrationTest).toContain("referência cruzada entre tenants foi aceita");
  expect(integrationTest).toContain("snapshot histórico mudou com o catálogo");
  expect(integrationTest).toContain("SET ROLE cardapio_runtime_test");
});
