import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import pg from "pg";

const { Client } = pg;
const repositoryRoot = resolve(import.meta.dirname, "..", "..");
const envPath = resolve(repositoryRoot, ".env.local");
const databaseName = "cardapio_digital_dev";
const runtimeRole = "cardapio_runtime_dev";
const tenantId = "30000000-0000-0000-0000-000000000003";
const action = process.env.CARDAPIO_LOCAL_ADMIN_ACTION ?? "provision";

function required(value, name) {
  if (!value?.trim()) throw new Error(`Configuração obrigatória ausente: ${name}.`);
  return value.trim();
}

function parseEnvironment(contents) {
  const values = new Map();
  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (match) values.set(match[1], match[2].trim());
  }
  return values;
}

function decodeDevelopmentIssuer(publishableKey) {
  if (!publishableKey.startsWith("pk_test_")) {
    throw new Error("O provisionamento aceita somente uma chave Clerk Development.");
  }
  const encoded = publishableKey.slice("pk_test_".length);
  const host = Buffer.from(encoded, "base64url").toString("utf8").replace(/\$$/, "");
  if (!/^[a-z0-9-]+\.clerk\.accounts\.dev$/.test(host)) {
    throw new Error("Não foi possível validar o emissor Clerk Development.");
  }
  return `https://${host}`;
}

async function resolveSingleDevelopmentIdentity(environment) {
  const secretKey = required(environment.get("CLERK_SECRET_KEY"), "CLERK_SECRET_KEY");
  const publishableKey = required(
    environment.get("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"),
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  );
  if (!secretKey.startsWith("sk_test_")) {
    throw new Error("O provisionamento aceita somente uma chave secreta Clerk Development.");
  }

  const response = await fetch("https://api.clerk.com/v1/users?limit=2", {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  if (!response.ok) throw new Error("Não foi possível consultar a instância Clerk Development.");

  const users = await response.json();
  if (!Array.isArray(users) || users.length !== 1 || typeof users[0]?.id !== "string") {
    throw new Error("A instância Clerk Development deve conter exatamente um usuário para este gate.");
  }
  return { issuer: decodeDevelopmentIssuer(publishableKey), subject: users[0].id };
}

function adminConfig(database = "postgres") {
  return {
    host: required(process.env.CARDAPIO_DB_HOST, "CARDAPIO_DB_HOST"),
    port: Number(required(process.env.CARDAPIO_DB_PORT, "CARDAPIO_DB_PORT")),
    user: required(process.env.CARDAPIO_DB_ADMIN_USER, "CARDAPIO_DB_ADMIN_USER"),
    password: required(process.env.CARDAPIO_DB_ADMIN_PASSWORD, "CARDAPIO_DB_ADMIN_PASSWORD"),
    database,
  };
}

function quoteIdentifier(identifier) {
  if (!/^[a-z][a-z0-9_]*$/.test(identifier)) throw new Error("Identificador SQL inválido.");
  return `"${identifier}"`;
}

function quoteLiteral(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

async function readSql(relativePath) {
  return readFile(resolve(repositoryRoot, relativePath), "utf8");
}

async function updateLocalDatabaseUrl(runtimePassword) {
  const contents = await readFile(envPath, "utf8");
  const host = required(process.env.CARDAPIO_DB_HOST, "CARDAPIO_DB_HOST");
  const port = required(process.env.CARDAPIO_DB_PORT, "CARDAPIO_DB_PORT");
  const url = `postgresql://${runtimeRole}:${encodeURIComponent(runtimePassword)}@${host}:${port}/${databaseName}`;
  const line = `DATABASE_URL=${url}`;
  const updated = /^\s*DATABASE_URL\s*=.*$/m.test(contents)
    ? contents.replace(/^\s*DATABASE_URL\s*=.*$/m, line)
    : `${contents.replace(/\s*$/, "")}\n${line}\n`;
  await writeFile(envPath, updated, { encoding: "utf8", mode: 0o600 });
}

async function provision(identity) {
  const admin = new Client(adminConfig());
  let databaseCreated = false;
  let roleCreated = false;
  const runtimePassword = randomBytes(32).toString("base64url");

  await admin.connect();
  try {
    const databaseExists = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [databaseName]);
    const roleExists = await admin.query("SELECT 1 FROM pg_roles WHERE rolname = $1", [runtimeRole]);
    if (databaseExists.rowCount || roleExists.rowCount) {
      throw new Error("Banco ou papel local já existe; o provisionamento recusou sobrescrever recursos.");
    }

    await admin.query(
      `CREATE ROLE ${quoteIdentifier(runtimeRole)} LOGIN PASSWORD ${quoteLiteral(runtimePassword)} NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS`,
    );
    roleCreated = true;
    await admin.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
    databaseCreated = true;
  } catch (error) {
    if (databaseCreated) await admin.query(`DROP DATABASE IF EXISTS ${quoteIdentifier(databaseName)} WITH (FORCE)`);
    if (roleCreated) await admin.query(`DROP ROLE IF EXISTS ${quoteIdentifier(runtimeRole)}`);
    throw error;
  } finally {
    await admin.end();
  }

  const database = new Client(adminConfig(databaseName));
  try {
    await database.connect();
    for (const migration of [
      "database/migrations/0001_initial_schema.up.sql",
      "database/migrations/0002_catalog_repository.up.sql",
      "database/migrations/0003_catalog_writes.up.sql",
      "database/migrations/0004_identity_authorization.up.sql",
      "database/migrations/0005_external_identity_links.up.sql",
      "database/migrations/0006_principal_tenant_access.up.sql",
      "database/migrations/0007_tenant_profile_writes.up.sql",
      "database/migrations/0008_category_writes.up.sql",
      "database/migrations/0009_category_creation.up.sql",
      "database/migrations/0010_tenant_fulfillment_activation.up.sql",
      "database/migrations/0011_catalog_image_metadata.up.sql",
      "database/migrations/0012_catalog_image_audit_actions.up.sql",
      "database/tests/catalog-repository-fixture.sql",
      "database/migrations/0013_tenant_operations_writes.up.sql",
      "database/migrations/0014_delivery_distance.up.sql",
      "database/migrations/0022_dining_tables.up.sql",
    ]) {
      await database.query(await readSql(migration));
    }

    await database.query("BEGIN");
    const principal = await database.query(
      "INSERT INTO principals (status) VALUES ('active') RETURNING id",
    );
    const principalId = principal.rows[0].id;
    await database.query(
      `INSERT INTO tenant_memberships
        (tenant_id, principal_id, role, status, granted_by)
       VALUES ($1, $2, 'owner', 'active', $2)`,
      [tenantId, principalId],
    );
    await database.query(
      `INSERT INTO external_identity_links
        (issuer, subject, principal_id, status)
       VALUES ($1, $2, $3, 'active')`,
      [identity.issuer, identity.subject, principalId],
    );
    await database.query(
      `INSERT INTO access_audit_events
        (actor_principal_id, subject_principal_id, tenant_id, action, metadata)
       VALUES ($1, $1, $2, 'tenant_membership.granted', '{"source":"local_bootstrap"}'::jsonb)`,
      [principalId, tenantId],
    );
    await database.query("COMMIT");

    await database.query(`GRANT CONNECT ON DATABASE ${quoteIdentifier(databaseName)} TO ${quoteIdentifier(runtimeRole)}`);
    await database.query(`GRANT USAGE ON SCHEMA public TO ${quoteIdentifier(runtimeRole)}`);
    await database.query("REVOKE ALL ON FUNCTION public.resolve_external_principal_id(text, text) FROM PUBLIC");
    await database.query(`GRANT EXECUTE ON FUNCTION public.resolve_external_principal_id(text, text) TO ${quoteIdentifier(runtimeRole)}`);
    await database.query(`GRANT EXECUTE ON FUNCTION public.list_principal_tenant_access(uuid) TO ${quoteIdentifier(runtimeRole)}`);
    await updateLocalDatabaseUrl(runtimePassword);
  } catch (error) {
    try { await database.query("ROLLBACK"); } catch {}
    await database.end();
    const cleanup = new Client(adminConfig());
    await cleanup.connect();
    try {
      await cleanup.query(`DROP DATABASE IF EXISTS ${quoteIdentifier(databaseName)} WITH (FORCE)`);
      await cleanup.query(`DROP ROLE IF EXISTS ${quoteIdentifier(runtimeRole)}`);
    } finally {
      await cleanup.end();
    }
    throw error;
  }
  await database.end();
  console.log("Provisionamento local concluído sem expor identificadores ou credenciais.");
}

async function changeLinkStatus(identity, status) {
  const database = new Client(adminConfig(databaseName));
  await database.connect();
  try {
    const result = await database.query(
      `UPDATE external_identity_links
          SET status = $3,
              revoked_at = CASE WHEN $3 = 'revoked' THEN now() ELSE NULL END
        WHERE issuer = $1 AND subject = $2`,
      [identity.issuer, identity.subject, status],
    );
    if (result.rowCount !== 1) throw new Error("Vínculo local esperado não foi encontrado.");
  } finally {
    await database.end();
  }
  console.log(status === "revoked" ? "Vínculo local revogado." : "Vínculo local reativado.");
}

async function upgradeAuthorization() {
  const database = new Client(adminConfig(databaseName));
  await database.connect();
  try {
    const functionExists = await database.query(
      "SELECT to_regprocedure('public.list_principal_tenant_access(uuid)') IS NOT NULL AS exists",
    );
    if (!functionExists.rows[0].exists) {
      await database.query(await readSql("database/migrations/0006_principal_tenant_access.up.sql"));
    }
    await database.query(
      `GRANT EXECUTE ON FUNCTION public.list_principal_tenant_access(uuid) TO ${quoteIdentifier(runtimeRole)}`,
    );
  } finally {
    await database.end();
  }
  console.log("Derivação local de tenant e papel habilitada.");
}

async function enableCatalogRead() {
  const database = new Client(adminConfig(databaseName));
  const readableTables = [
    "tenants",
    "tenant_operations",
    "tenant_payment_methods",
    "tenant_fulfillment_modes",
    "business_hours",
    "categories",
    "products",
    "product_fulfillment_modes",
    "product_variations",
    "addon_groups",
    "addons",
  ];
  await database.connect();
  try {
    for (const table of readableTables) {
      await database.query(
        `GRANT SELECT ON TABLE ${quoteIdentifier(table)} TO ${quoteIdentifier(runtimeRole)}`,
      );
    }
  } finally {
    await database.end();
  }
  console.log("Leitura local do catálogo administrativo habilitada.");
}

async function enableCatalogAvailabilityWrite() {
  const database = new Client(adminConfig(databaseName));
  await database.connect();
  try {
    await database.query(
      `GRANT UPDATE (is_available, version, updated_at) ON TABLE products TO ${quoteIdentifier(runtimeRole)}`,
    );
    await database.query(
      `GRANT INSERT ON TABLE catalog_audit_events TO ${quoteIdentifier(runtimeRole)}`,
    );
  } finally {
    await database.end();
  }
  console.log("Mutação local de disponibilidade e auditoria habilitadas.");
}

async function enableCatalogPriceWrite() {
  const database = new Client(adminConfig(databaseName));
  await database.connect();
  try {
    await database.query(
      `GRANT UPDATE (base_price_in_cents, version, updated_at) ON TABLE products TO ${quoteIdentifier(runtimeRole)}`,
    );
    await database.query(
      `GRANT INSERT ON TABLE catalog_audit_events TO ${quoteIdentifier(runtimeRole)}`,
    );
  } finally {
    await database.end();
  }
  console.log("Mutação local de preço habilitada.");
}

async function enableCatalogAuditRead() {
  const database = new Client(adminConfig(databaseName));
  await database.connect();
  try {
    await database.query(
      `GRANT SELECT ON TABLE catalog_audit_events TO ${quoteIdentifier(runtimeRole)}`,
    );
  } finally {
    await database.end();
  }
  console.log("Leitura local da auditoria de catálogo habilitada.");
}

async function enableCatalogContentWrite() {
  const database = new Client(adminConfig(databaseName));
  await database.connect();
  try {
    await database.query(
      `GRANT UPDATE (name, description, version, updated_at) ON TABLE products TO ${quoteIdentifier(runtimeRole)}`,
    );
    await database.query(
      `GRANT INSERT ON TABLE catalog_audit_events TO ${quoteIdentifier(runtimeRole)}`,
    );
  } finally {
    await database.end();
  }
  console.log("Mutação local de conteúdo do produto habilitada.");
}

async function enableCatalogCategoryAssignmentWrite() {
  const database = new Client(adminConfig(databaseName));
  await database.connect();
  try {
    await database.query(
      `INSERT INTO categories (tenant_id, id, slug, name, sort_order)
       VALUES ($1, '31000000-0000-0000-0000-000000000004', 'validacao-local', 'Categoria de validação', 2)
       ON CONFLICT (tenant_id, id) DO NOTHING`,
      [tenantId],
    );
    await database.query(
      `GRANT UPDATE (category_id, version, updated_at) ON TABLE products TO ${quoteIdentifier(runtimeRole)}`,
    );
    await database.query(
      `GRANT INSERT ON TABLE catalog_audit_events TO ${quoteIdentifier(runtimeRole)}`,
    );
  } finally {
    await database.end();
  }
  console.log("Mutação local de classificação e categoria fictícia de validação habilitadas.");
}

async function enableCatalogFulfillmentModesWrite() {
  const database = new Client(adminConfig(databaseName));
  await database.connect();
  try {
    await database.query(
      `GRANT UPDATE (version, updated_at) ON TABLE products TO ${quoteIdentifier(runtimeRole)}`,
    );
    await database.query(
      `GRANT INSERT, DELETE ON TABLE product_fulfillment_modes TO ${quoteIdentifier(runtimeRole)}`,
    );
    await database.query(
      `GRANT INSERT ON TABLE catalog_audit_events TO ${quoteIdentifier(runtimeRole)}`,
    );
  } finally {
    await database.end();
  }
  console.log("Mutação local de modalidades do produto habilitada.");
}

async function enableTenantProfileWrite() {
  const database = new Client(adminConfig(databaseName));
  await database.connect();
  try {
    const state = await database.query(
      `SELECT
         EXISTS (
           SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'tenants' AND column_name = 'version'
         ) AS has_version,
         to_regclass('public.tenant_profile_audit_events') IS NOT NULL AS has_audit`,
    );
    const { has_version: hasVersion, has_audit: hasAudit } = state.rows[0];
    if (hasVersion !== hasAudit) {
      throw new Error("Fundação persistente do perfil está em estado parcial; nenhuma concessão foi aplicada.");
    }
    if (!hasVersion) {
      await database.query(await readSql("database/migrations/0007_tenant_profile_writes.up.sql"));
    }
    await database.query(
      `GRANT UPDATE (short_name, tagline, version, updated_at) ON TABLE tenants TO ${quoteIdentifier(runtimeRole)}`,
    );
    await database.query(
      `GRANT INSERT ON TABLE tenant_profile_audit_events TO ${quoteIdentifier(runtimeRole)}`,
    );
    await database.query(
      `REVOKE UPDATE, DELETE ON TABLE tenant_profile_audit_events FROM ${quoteIdentifier(runtimeRole)}`,
    );
  } finally {
    await database.end();
  }
  console.log("Escrita local do perfil do tenant habilitada com privilégio mínimo.");
}

async function enableTenantProfileAuditRead() {
  const database = new Client(adminConfig(databaseName));
  await database.connect();
  try {
    const auditExists = await database.query(
      "SELECT to_regclass('public.tenant_profile_audit_events') IS NOT NULL AS exists",
    );
    if (!auditExists.rows[0].exists) {
      throw new Error("Auditoria do perfil não está provisionada; nenhuma concessão foi aplicada.");
    }
    await database.query(
      `GRANT SELECT ON TABLE tenant_profile_audit_events TO ${quoteIdentifier(runtimeRole)}`,
    );
  } finally {
    await database.end();
  }
  console.log("Leitura local da auditoria do perfil habilitada.");
}

async function enableCategoryWrite() {
  const database = new Client(adminConfig(databaseName));
  await database.connect();
  try {
    const state = await database.query(
      `SELECT
         EXISTS (
           SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'categories' AND column_name = 'version'
         ) AS has_version,
         to_regclass('public.category_audit_events') IS NOT NULL AS has_audit`,
    );
    const { has_version: hasVersion, has_audit: hasAudit } = state.rows[0];
    if (hasVersion !== hasAudit) {
      throw new Error("Fundação persistente de categorias está em estado parcial; nenhuma concessão foi aplicada.");
    }
    if (!hasVersion) {
      await database.query(await readSql("database/migrations/0008_category_writes.up.sql"));
    }
    await database.query(
      `GRANT UPDATE (name, sort_order, version, updated_at) ON TABLE categories TO ${quoteIdentifier(runtimeRole)}`,
    );
    await database.query(
      `GRANT INSERT ON TABLE category_audit_events TO ${quoteIdentifier(runtimeRole)}`,
    );
    await database.query(
      `REVOKE UPDATE, DELETE ON TABLE category_audit_events FROM ${quoteIdentifier(runtimeRole)}`,
    );
  } finally {
    await database.end();
  }
  console.log("Escrita local de categorias habilitada com privilégio mínimo.");
}

async function enableCategoryAuditRead() {
  const database = new Client(adminConfig(databaseName));
  await database.connect();
  try {
    const auditExists = await database.query(
      "SELECT to_regclass('public.category_audit_events') IS NOT NULL AS exists",
    );
    if (!auditExists.rows[0].exists) {
      throw new Error("Auditoria de categorias não está provisionada; nenhuma concessão foi aplicada.");
    }
    await database.query(
      `GRANT SELECT ON TABLE category_audit_events TO ${quoteIdentifier(runtimeRole)}`,
    );
  } finally {
    await database.end();
  }
  console.log("Leitura local da auditoria de categorias habilitada.");
}

async function enableCategoryCreation() {
  const database = new Client(adminConfig(databaseName));
  await database.connect();
  try {
    const state = await database.query(
      `SELECT
         to_regclass('public.category_audit_events') IS NOT NULL AS has_audit,
         COALESCE((
           SELECT pg_get_constraintdef(oid)
             FROM pg_constraint
            WHERE conrelid = to_regclass('public.category_audit_events')
              AND conname = 'category_audit_events_action_check'
         ), '') LIKE '%category.created%' AS accepts_creation`,
    );
    const { has_audit: hasAudit, accepts_creation: acceptsCreation } = state.rows[0];
    if (!hasAudit) {
      throw new Error("Fundação de categorias não está provisionada; nenhuma concessão foi aplicada.");
    }
    if (!acceptsCreation) {
      await database.query(await readSql("database/migrations/0009_category_creation.up.sql"));
    }
    await database.query(
      `GRANT INSERT ON TABLE categories TO ${quoteIdentifier(runtimeRole)}`,
    );
    await database.query(
      `GRANT INSERT ON TABLE category_audit_events TO ${quoteIdentifier(runtimeRole)}`,
    );
    await database.query(
      `REVOKE UPDATE, DELETE ON TABLE category_audit_events FROM ${quoteIdentifier(runtimeRole)}`,
    );
  } finally {
    await database.end();
  }
  console.log("Criação local de categorias habilitada com privilégio mínimo.");
}

async function enableTenantFulfillmentActivation() {
  const database = new Client(adminConfig(databaseName));
  await database.connect();
  try {
    const state = await database.query(
      `SELECT
         to_regclass('public.tenant_fulfillment_modes') IS NOT NULL AS has_tenant_modes,
         to_regclass('public.product_fulfillment_modes') IS NOT NULL AS has_product_modes,
         to_regclass('public.catalog_audit_events') IS NOT NULL AS has_catalog_audit,
         to_regclass('public.tenant_profile_audit_events') IS NOT NULL AS has_tenant_audit,
         EXISTS (
           SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'version'
         ) AS has_product_version,
         COALESCE((
           SELECT pg_get_constraintdef(oid)
             FROM pg_constraint
            WHERE conrelid = to_regclass('public.tenant_profile_audit_events')
              AND conname = 'tenant_profile_audit_events_action_check'
         ), '') LIKE '%tenant.fulfillment_mode.enabled%' AS accepts_activation`,
    );
    const foundation = state.rows[0];
    if (
      !foundation.has_tenant_modes ||
      !foundation.has_product_modes ||
      !foundation.has_catalog_audit ||
      !foundation.has_tenant_audit ||
      !foundation.has_product_version
    ) {
      throw new Error(
        "Fundação persistente de modalidades está incompleta; nenhuma concessão foi aplicada.",
      );
    }
    if (!foundation.accepts_activation) {
      await database.query(
        await readSql("database/migrations/0010_tenant_fulfillment_activation.up.sql"),
      );
    }
    await database.query(
      `GRANT INSERT ON TABLE tenant_fulfillment_modes TO ${quoteIdentifier(runtimeRole)}`,
    );
    await database.query(
      `GRANT INSERT ON TABLE product_fulfillment_modes TO ${quoteIdentifier(runtimeRole)}`,
    );
    await database.query(
      `GRANT UPDATE (version, updated_at) ON TABLE products TO ${quoteIdentifier(runtimeRole)}`,
    );
    await database.query(
      `GRANT INSERT ON TABLE catalog_audit_events TO ${quoteIdentifier(runtimeRole)}`,
    );
    await database.query(
      `GRANT INSERT ON TABLE tenant_profile_audit_events TO ${quoteIdentifier(runtimeRole)}`,
    );
    await database.query(
      `REVOKE UPDATE, DELETE ON TABLE catalog_audit_events FROM ${quoteIdentifier(runtimeRole)}`,
    );
    await database.query(
      `REVOKE UPDATE, DELETE ON TABLE tenant_profile_audit_events FROM ${quoteIdentifier(runtimeRole)}`,
    );
  } finally {
    await database.end();
  }
  console.log("Ativação local de Na mesa habilitada com privilégio mínimo.");
}

async function enableCatalogImageMetadataWrite() {
  const database = new Client(adminConfig(databaseName));
  await database.connect();
  try {
    const state = await database.query(
      `SELECT
         to_regclass('public.tenant_profile_audit_events') IS NOT NULL AS has_tenant_audit,
         to_regclass('public.catalog_audit_events') IS NOT NULL AS has_catalog_audit,
         to_regclass('public.tenant_profile_images') IS NOT NULL AS has_tenant_images,
         to_regclass('public.product_catalog_images') IS NOT NULL AS has_product_images,
         COALESCE((
           SELECT pg_get_constraintdef(oid)
             FROM pg_constraint
            WHERE conrelid = to_regclass('public.tenant_profile_audit_events')
              AND conname = 'tenant_profile_audit_events_action_check'
         ), '') LIKE '%tenant.logo.updated%' AS accepts_tenant_image_audit,
         COALESCE((
           SELECT pg_get_constraintdef(oid)
             FROM pg_constraint
            WHERE conrelid = to_regclass('public.catalog_audit_events')
              AND conname = 'catalog_audit_events_action_check'
         ), '') LIKE '%product.image.updated%' AS accepts_product_image_audit`,
    );
    const foundation = state.rows[0];
    if (!foundation.has_tenant_audit || !foundation.has_catalog_audit) {
      throw new Error(
        "Auditorias persistentes estão incompletas; nenhuma migration ou concessão foi aplicada.",
      );
    }
    if (foundation.has_tenant_images !== foundation.has_product_images) {
      throw new Error(
        "Metadados persistentes de imagem estão em estado parcial; nenhuma concessão foi aplicada.",
      );
    }
    if (foundation.accepts_tenant_image_audit !== foundation.accepts_product_image_audit) {
      throw new Error(
        "Auditoria persistente de imagens está em estado parcial; nenhuma concessão foi aplicada.",
      );
    }
    if (!foundation.has_tenant_images) {
      await database.query(await readSql("database/migrations/0011_catalog_image_metadata.up.sql"));
    }
    if (!foundation.accepts_tenant_image_audit) {
      await database.query(await readSql("database/migrations/0012_catalog_image_audit_actions.up.sql"));
    }

    await database.query("BEGIN");
    try {
      await database.query(
        `GRANT SELECT, INSERT, UPDATE ON TABLE tenant_profile_images, product_catalog_images TO ${quoteIdentifier(runtimeRole)}`,
      );
      await database.query(
        `REVOKE DELETE ON TABLE tenant_profile_images, product_catalog_images FROM ${quoteIdentifier(runtimeRole)}`,
      );
      await database.query(
        `GRANT SELECT, INSERT ON TABLE tenant_profile_audit_events, catalog_audit_events TO ${quoteIdentifier(runtimeRole)}`,
      );
      await database.query(
        `REVOKE UPDATE, DELETE ON TABLE tenant_profile_audit_events, catalog_audit_events FROM ${quoteIdentifier(runtimeRole)}`,
      );
      await database.query("COMMIT");
    } catch (error) {
      await database.query("ROLLBACK");
      throw error;
    }
  } finally {
    await database.end();
  }
  console.log("Metadados locais de imagem habilitados com privilégio mínimo.");
}

async function enableTenantOperationsWrite() {
  const database = new Client(adminConfig(databaseName));
  await database.connect();
  try {
    const exists = await database.query("SELECT to_regclass('public.tenant_operations_audit_events') IS NOT NULL AS exists");
    if (!exists.rows[0].exists) {
      await database.query(await readSql("database/migrations/0013_tenant_operations_writes.up.sql"));
    }
    const distanceExists = await database.query(`SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'tenant_operations'
        AND column_name = 'maximum_delivery_distance_in_meters'
    ) AS exists`);
    if (!distanceExists.rows[0].exists) {
      await database.query(await readSql("database/migrations/0014_delivery_distance.up.sql"));
    }
    const diningTablesExists = await database.query(`SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'tenant_operations'
        AND column_name = 'dining_table_labels'
    ) AS exists`);
    if (!diningTablesExists.rows[0].exists) {
      await database.query(await readSql("database/migrations/0022_dining_tables.up.sql"));
    }
    await database.query("BEGIN");
    try {
      await database.query(`GRANT UPDATE (minimum_order_in_cents, delivery_fee_in_cents, whatsapp_number, maximum_delivery_distance_in_meters, dining_table_labels, version, updated_at) ON tenant_operations TO ${quoteIdentifier(runtimeRole)}`);
      await database.query(`GRANT SELECT, INSERT, DELETE ON tenant_payment_methods, business_hours TO ${quoteIdentifier(runtimeRole)}`);
      await database.query(`GRANT SELECT, INSERT ON tenant_operations_audit_events TO ${quoteIdentifier(runtimeRole)}`);
      await database.query(`REVOKE UPDATE, DELETE ON tenant_operations_audit_events FROM ${quoteIdentifier(runtimeRole)}`);
      await database.query("COMMIT");
    } catch (error) {
      await database.query("ROLLBACK");
      throw error;
    }
  } finally {
    await database.end();
  }
  console.log("Escrita local da operação habilitada com privilégio mínimo.");
}

async function enableDeliveryGovernanceWrite() {
  const database = new Client(adminConfig(databaseName));
  await database.connect();
  try {
    const originExists = await database.query("SELECT to_regclass('public.tenant_delivery_origins') IS NOT NULL AS exists");
    if (!originExists.rows[0].exists) {
      await database.query(await readSql("database/migrations/0015_tenant_delivery_origin.up.sql"));
    }
    const privacyExists = await database.query("SELECT to_regclass('public.tenant_privacy_settings') IS NOT NULL AS exists");
    if (!privacyExists.rows[0].exists) {
      await database.query(await readSql("database/migrations/0016_tenant_privacy_settings.up.sql"));
    }
    await database.query("BEGIN");
    try {
      await database.query(`REVOKE INSERT, UPDATE, DELETE ON tenant_delivery_origins, tenant_privacy_settings FROM ${quoteIdentifier(runtimeRole)}`);
      await database.query(`GRANT SELECT ON tenant_delivery_origins, tenant_privacy_settings TO ${quoteIdentifier(runtimeRole)}`);
      await database.query(`GRANT INSERT (tenant_id, label, postal_code, street, number, complement, neighborhood, city, state) ON tenant_delivery_origins TO ${quoteIdentifier(runtimeRole)}`);
      await database.query(`GRANT UPDATE (label, postal_code, street, number, complement, neighborhood, city, state, latitude, longitude, geocoding_status, version, updated_at) ON tenant_delivery_origins TO ${quoteIdentifier(runtimeRole)}`);
      await database.query(`GRANT INSERT (tenant_id, controller_legal_name, privacy_email, order_address_retention_days) ON tenant_privacy_settings TO ${quoteIdentifier(runtimeRole)}`);
      await database.query(`GRANT UPDATE (controller_legal_name, privacy_email, order_address_retention_days, version, updated_at) ON tenant_privacy_settings TO ${quoteIdentifier(runtimeRole)}`);
      await database.query(`GRANT SELECT ON tenant_delivery_origin_audit_events, tenant_privacy_audit_events TO ${quoteIdentifier(runtimeRole)}`);
      await database.query(`GRANT INSERT (tenant_id, actor_id, actor_role, action, changes) ON tenant_delivery_origin_audit_events, tenant_privacy_audit_events TO ${quoteIdentifier(runtimeRole)}`);
      await database.query(`REVOKE UPDATE, DELETE ON tenant_delivery_origin_audit_events, tenant_privacy_audit_events FROM ${quoteIdentifier(runtimeRole)}`);
      await database.query("COMMIT");
    } catch (error) {
      await database.query("ROLLBACK");
      throw error;
    }
  } finally {
    await database.end();
  }
  console.log("Governança local de entrega habilitada com privilégio mínimo.");
}

async function enableProductCreation() {
  const database = new Client(adminConfig(databaseName));
  await database.connect();
  try {
    const state = await database.query(`SELECT
      to_regclass('public.products') IS NOT NULL AS has_products,
      to_regclass('public.product_fulfillment_modes') IS NOT NULL AS has_product_modes,
      to_regclass('public.catalog_audit_events') IS NOT NULL AS has_catalog_audit,
      COALESCE((SELECT pg_get_constraintdef(oid) FROM pg_constraint
        WHERE conrelid = to_regclass('public.catalog_audit_events')
          AND conname = 'catalog_audit_events_action_check'), '') LIKE '%product.created%' AS accepts_creation`);
    const foundation = state.rows[0];
    if (!foundation.has_products || !foundation.has_product_modes || !foundation.has_catalog_audit) {
      throw new Error("Fundação persistente de produtos está incompleta; nenhuma concessão foi aplicada.");
    }
    if (!foundation.accepts_creation) {
      await database.query(await readSql("database/migrations/0017_product_creation.up.sql"));
    }
    await database.query("BEGIN");
    try {
      await database.query(`GRANT INSERT (tenant_id, id, category_id, slug, name, description, base_price_in_cents, is_available) ON products TO ${quoteIdentifier(runtimeRole)}`);
      await database.query(`GRANT INSERT ON product_fulfillment_modes TO ${quoteIdentifier(runtimeRole)}`);
      await database.query(`GRANT INSERT ON catalog_audit_events TO ${quoteIdentifier(runtimeRole)}`);
      await database.query(`REVOKE DELETE ON products FROM ${quoteIdentifier(runtimeRole)}`);
      await database.query(`REVOKE UPDATE, DELETE ON catalog_audit_events FROM ${quoteIdentifier(runtimeRole)}`);
      await database.query("COMMIT");
    } catch (error) {
      await database.query("ROLLBACK");
      throw error;
    }
  } finally {
    await database.end();
  }
  console.log("Criação local de produtos habilitada com privilégio mínimo.");
}

async function resolveRequiredDevelopmentIdentity() {
  const environment = parseEnvironment(await readFile(envPath, "utf8"));
  return resolveSingleDevelopmentIdentity(environment);
}

async function enableCategoryArchiving() {
  const database = new Client(adminConfig(databaseName));
  await database.connect();
  try {
    const state = await database.query(`SELECT COALESCE((SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = to_regclass('public.category_audit_events') AND conname = 'category_audit_events_action_check'), '') LIKE '%category.archived%' AS enabled`);
    if (!state.rows[0]?.enabled) await database.query(await readSql("database/migrations/0019_category_archiving.up.sql"));
    await database.query("BEGIN");
    try {
      await database.query(`GRANT UPDATE (archived_at, version, updated_at) ON categories TO ${quoteIdentifier(runtimeRole)}`);
      await database.query(`GRANT SELECT (tenant_id, category_id, archived_at) ON products TO ${quoteIdentifier(runtimeRole)}`);
      await database.query(`GRANT INSERT ON category_audit_events TO ${quoteIdentifier(runtimeRole)}`);
      await database.query(`REVOKE DELETE ON categories FROM ${quoteIdentifier(runtimeRole)}`);
      await database.query("COMMIT");
    } catch (error) { await database.query("ROLLBACK"); throw error; }
  } finally { await database.end(); }
  console.log("Arquivamento local de categorias habilitado com privilégio mínimo.");
}

async function enableProductArchiving() {
  const database = new Client(adminConfig(databaseName));
  await database.connect();
  try {
    const state = await database.query(`SELECT COALESCE((SELECT pg_get_constraintdef(oid)
      FROM pg_constraint WHERE conrelid = to_regclass('public.catalog_audit_events')
      AND conname = 'catalog_audit_events_action_check'), '') LIKE '%product.archived%' AS accepts_archiving`);
    if (!state.rows[0]?.accepts_archiving) {
      await database.query(await readSql("database/migrations/0018_product_archiving.up.sql"));
    }
    await database.query("BEGIN");
    try {
      await database.query(`GRANT UPDATE (archived_at, is_available, version, updated_at) ON products TO ${quoteIdentifier(runtimeRole)}`);
      await database.query(`GRANT INSERT ON catalog_audit_events TO ${quoteIdentifier(runtimeRole)}`);
      await database.query(`REVOKE DELETE ON products FROM ${quoteIdentifier(runtimeRole)}`);
      await database.query("COMMIT");
    } catch (error) {
      await database.query("ROLLBACK");
      throw error;
    }
  } finally {
    await database.end();
  }
  console.log("Arquivamento local de produtos habilitado com privilégio mínimo.");
}

async function enableSubscriptionOnboarding() {
  const database = new Client(adminConfig(databaseName));
  await database.connect();
  try {
    const state = await database.query("SELECT to_regclass('public.subscription_onboarding_intents') IS NOT NULL AS enabled");
    if (!state.rows[0]?.enabled) {
      await database.query(await readSql("database/migrations/0020_subscription_onboarding.up.sql"));
    }
    await database.query("BEGIN");
    try {
      for (const signature of [
        "public.create_subscription_onboarding(text, text, text)",
        "public.attach_subscription_checkout(uuid, text)",
        "public.activate_paid_subscription(text, text, text, text, text)",
        "public.suspend_subscription_access(text, text, text, text)",
        "public.resume_subscription_access(text, text, text)",
      ]) {
        await database.query(`GRANT EXECUTE ON FUNCTION ${signature} TO ${quoteIdentifier(runtimeRole)}`);
      }
      await database.query("COMMIT");
    } catch (error) { await database.query("ROLLBACK"); throw error; }
  } finally { await database.end(); }
  console.log("Onboarding local de assinaturas habilitado com funções estreitas.");
}

async function enableDefaultFulfillmentModes() {
  const database = new Client(adminConfig(databaseName));
  await database.connect();
  try {
    const state = await database.query(
      "SELECT to_regclass('public.tenant_default_fulfillment_mode_enrollments') IS NOT NULL AS enabled",
    );
    if (!state.rows[0]?.enabled) {
      await database.query(await readSql("database/migrations/0021_default_fulfillment_modes.up.sql"));
    }
  } finally {
    await database.end();
  }
  console.log("Modalidades padrão habilitadas para contas existentes e futuras.");
}

if (action === "provision") await provision(await resolveRequiredDevelopmentIdentity());
else if (action === "revoke") await changeLinkStatus(await resolveRequiredDevelopmentIdentity(), "revoked");
else if (action === "activate") await changeLinkStatus(await resolveRequiredDevelopmentIdentity(), "active");
else if (action === "upgrade") await upgradeAuthorization();
else if (action === "enablecatalogread") await enableCatalogRead();
else if (action === "enablecatalogavailabilitywrite") await enableCatalogAvailabilityWrite();
else if (action === "enablecatalogpricewrite") await enableCatalogPriceWrite();
else if (action === "enablecatalogauditread") await enableCatalogAuditRead();
else if (action === "enablecatalogcontentwrite") await enableCatalogContentWrite();
else if (action === "enablecatalogcategoryassignmentwrite") await enableCatalogCategoryAssignmentWrite();
else if (action === "enablecatalogfulfillmentmodeswrite") await enableCatalogFulfillmentModesWrite();
else if (action === "enabletenantprofilewrite") await enableTenantProfileWrite();
else if (action === "enabletenantprofileauditread") await enableTenantProfileAuditRead();
else if (action === "enablecategorywrite") await enableCategoryWrite();
else if (action === "enablecategoryauditread") await enableCategoryAuditRead();
else if (action === "enablecategorycreation") await enableCategoryCreation();
else if (action === "enableproductcreation") await enableProductCreation();
else if (action === "enableproductarchiving") await enableProductArchiving();
else if (action === "enablecategoryarchiving") await enableCategoryArchiving();
else if (action === "enabletenantfulfillmentactivation") await enableTenantFulfillmentActivation();
else if (action === "enablecatalogimagemetadatawrite") await enableCatalogImageMetadataWrite();
else if (action === "enabletenantoperationswrite") await enableTenantOperationsWrite();
else if (action === "enabledeliverygovernancewrite") await enableDeliveryGovernanceWrite();
else if (action === "enablesubscriptiononboarding") await enableSubscriptionOnboarding();
else if (action === "enabledefaultfulfillmentmodes") await enableDefaultFulfillmentModes();
else throw new Error("Ação local inválida.");
