import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { del, list } from "@vercel/blob";
import pg from "pg";
import {
  buildCatalogImageReconciliationPlan,
  DEFAULT_MAX_DELETIONS,
  parseCatalogImagePath,
  reconciliationLog,
} from "./catalog-image-reconciliation.mjs";

const { Pool } = pg;
const repositoryRoot = resolve(import.meta.dirname, "..", "..");
const args = new Set(process.argv.slice(2));
const apply = args.has("--apply");
const confirmed = args.has("--confirm-delete-orphans");
const maximumArgument = [...args].find((value) => value.startsWith("--max-delete="));
const maximumDeletions = maximumArgument
  ? Number(maximumArgument.slice("--max-delete=".length))
  : DEFAULT_MAX_DELETIONS;

if (apply && !confirmed) {
  throw new Error("Exclusão recusada: use --apply e --confirm-delete-orphans juntos.");
}
if (!Number.isSafeInteger(maximumDeletions) || maximumDeletions < 1 || maximumDeletions > 500) {
  throw new Error("--max-delete deve estar entre 1 e 500.");
}

function parseEnvironment(contents) {
  const values = new Map();
  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (match) values.set(match[1], match[2].trim().replace(/^(['"])(.*)\1$/, "$2"));
  }
  return values;
}

function required(value, name) {
  if (!value?.trim()) throw new Error(`Configuração obrigatória ausente: ${name}.`);
  return value.trim();
}

async function listCatalogBlobs() {
  const blobs = [];
  let cursor;
  let listOperations = 0;
  do {
    const result = await list({
      prefix: "catalog/tenants/",
      limit: 1000,
      ...(cursor ? { cursor } : {}),
      abortSignal: AbortSignal.timeout(15_000),
    });
    listOperations += 1;
    blobs.push(...result.blobs.map(({ pathname, size, uploadedAt }) => ({ pathname, size, uploadedAt })));
    if (blobs.length > 100_000) throw new Error("Limite de objetos por reconciliação excedido.");
    cursor = result.hasMore ? result.cursor : undefined;
    if (result.hasMore && !cursor) throw new Error("Paginação do Blob não devolveu cursor.");
  } while (cursor);
  return { blobs, listOperations };
}

async function loadReferencedKeys(pool, tenantIds) {
  const references = new Set();
  for (const tenantId of tenantIds) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN READ ONLY");
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
      const result = await client.query(
        `SELECT object_key FROM tenant_profile_images WHERE tenant_id = $1
         UNION ALL
         SELECT object_key FROM product_catalog_images WHERE tenant_id = $1`,
        [tenantId],
      );
      for (const row of result.rows) references.add(row.object_key);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  return references;
}

const environment = parseEnvironment(await readFile(resolve(repositoryRoot, ".env.local"), "utf8"));
process.env.BLOB_READ_WRITE_TOKEN = required(
  environment.get("BLOB_READ_WRITE_TOKEN"),
  "BLOB_READ_WRITE_TOKEN",
);
const databaseUrl = required(environment.get("DATABASE_URL"), "DATABASE_URL");
const pool = new Pool({
  connectionString: databaseUrl,
  max: 2,
  connectionTimeoutMillis: 5_000,
  query_timeout: 8_000,
  statement_timeout: 7_000,
  allowExitOnIdle: true,
});

try {
  const { blobs, listOperations } = await listCatalogBlobs();
  const tenantIds = [...new Set(blobs.flatMap(({ pathname }) => {
    const parsed = parseCatalogImagePath(pathname);
    return parsed ? [parsed.tenantId] : [];
  }))];
  const referencedObjectKeys = await loadReferencedKeys(pool, tenantIds);
  const plan = buildCatalogImageReconciliationPlan({ blobs, referencedObjectKeys });
  let deletedObjects = 0;
  let deletedBytes = 0;
  let deletionFailures = 0;

  if (apply) {
    for (const candidate of plan.candidates.slice(0, maximumDeletions)) {
      try {
        await del(candidate.pathname, { abortSignal: AbortSignal.timeout(15_000) });
        deletedObjects += 1;
        deletedBytes += candidate.size;
      } catch (error) {
        deletionFailures += 1;
        console.error(reconciliationLog("catalog_image_reconciliation_delete_failed", {
          errorType: error instanceof Error ? error.name : "UnknownError",
        }));
      }
    }
  }

  console.log(reconciliationLog("catalog_image_reconciliation_completed", {
    mode: apply ? "apply" : "dry_run",
    ...plan.metrics,
    tenantScopes: plan.tenantIds.length,
    listOperations,
    deleteOperations: apply ? Math.min(plan.candidates.length, maximumDeletions) : 0,
    deletedObjects,
    deletedBytes,
    deletionFailures,
    deletionLimitReached: plan.candidates.length > maximumDeletions,
  }));
  if (deletionFailures > 0) process.exitCode = 1;
} catch (error) {
  console.error(reconciliationLog("catalog_image_reconciliation_failed", {
    errorType: error instanceof Error ? error.name : "UnknownError",
  }));
  process.exitCode = 1;
} finally {
  await pool.end();
}
