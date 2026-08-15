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
});

test("teste PostgreSQL cobre negação, isolamento e snapshots", () => {
  expect(integrationTest).toContain("RLS expôs linhas sem contexto de tenant");
  expect(integrationTest).toContain("RLS não isolou a leitura do tenant A");
  expect(integrationTest).toContain("referência cruzada entre tenants foi aceita");
  expect(integrationTest).toContain("snapshot histórico mudou com o catálogo");
  expect(integrationTest).toContain("SET ROLE cardapio_runtime_test");
});
