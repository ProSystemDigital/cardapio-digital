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
      "database/tests/catalog-repository-fixture.sql",
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

const environment = parseEnvironment(await readFile(envPath, "utf8"));
const identity = await resolveSingleDevelopmentIdentity(environment);

if (action === "provision") await provision(identity);
else if (action === "revoke") await changeLinkStatus(identity, "revoked");
else if (action === "activate") await changeLinkStatus(identity, "active");
else if (action === "upgrade") await upgradeAuthorization();
else if (action === "enablecatalogread") await enableCatalogRead();
else if (action === "enablecatalogavailabilitywrite") await enableCatalogAvailabilityWrite();
else if (action === "enablecatalogpricewrite") await enableCatalogPriceWrite();
else if (action === "enablecatalogauditread") await enableCatalogAuditRead();
else if (action === "enablecatalogcontentwrite") await enableCatalogContentWrite();
else throw new Error("Ação local inválida.");
