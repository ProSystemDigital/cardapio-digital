import { expect, test } from "@playwright/test";
import { Pool } from "pg";
import { PostgresCatalogImageMetadataRepository } from "../../data/postgres-catalog-image-metadata-repository";
import { CatalogImageConflictError, CatalogImageNotFoundError } from "../../domain/catalog-image-administration";

const databaseUrl = process.env.DATABASE_TEST_URL;
if (!databaseUrl) throw new Error("DATABASE_TEST_URL é obrigatória no teste PostgreSQL.");

test("substitui metadados de logo e produto com versão e auditoria atômicas", async () => {
  const pool = new Pool({ connectionString: databaseUrl, max: 2 });
  const tenantId = "50000000-0000-0000-0000-000000000005";
  const productId = "52000000-0000-0000-0000-000000000005";
  const blobHost = "cardapio-test.public.blob.vercel-storage.com";
  const actor = {
    id: "41000000-0000-4000-8000-000000000001",
    role: "owner" as const,
    tenantIds: [tenantId],
  };
  const repository = new PostgresCatalogImageMetadataRepository(pool);
  const logo = {
    storageProvider: "vercel_blob" as const,
    objectKey: `catalog/tenants/${tenantId}/logo/53000000-0000-0000-0000-000000000001.webp`,
    publicUrl: `https://${blobHost}/catalog/tenants/${tenantId}/logo/53000000-0000-0000-0000-000000000001.webp`,
    mediaType: "image/webp" as const,
    widthPixels: 512,
    heightPixels: 512,
    byteSize: 1024,
    contentSha256: "a".repeat(64),
  };
  const product = {
    storageProvider: "vercel_blob" as const,
    objectKey: `catalog/tenants/${tenantId}/products/${productId}/54000000-0000-0000-0000-000000000001.webp`,
    publicUrl: `https://${blobHost}/catalog/tenants/${tenantId}/products/${productId}/54000000-0000-0000-0000-000000000001.webp`,
    mediaType: "image/webp" as const,
    widthPixels: 1200,
    heightPixels: 900,
    byteSize: 2048,
    contentSha256: "b".repeat(64),
  };
  try {
    await expect(repository.replace(actor, {
      tenantId,
      target: { kind: "tenant_logo" },
      expectedVersion: null,
    }, logo)).resolves.toEqual({ tenantId, version: 1 });
    await expect(repository.replace(actor, {
      tenantId,
      target: { kind: "tenant_logo" },
      expectedVersion: 1,
    }, {
      ...logo,
      objectKey: `catalog/tenants/${tenantId}/logo/53000000-0000-0000-0000-000000000002.webp`,
      publicUrl: `https://${blobHost}/catalog/tenants/${tenantId}/logo/53000000-0000-0000-0000-000000000002.webp`,
      contentSha256: "c".repeat(64),
    })).resolves.toEqual({ tenantId, version: 2, previousObjectKey: logo.objectKey });

    await expect(repository.replace(actor, {
      tenantId,
      target: { kind: "product", productId },
      expectedVersion: null,
      altText: "Prato local servido",
    }, product)).resolves.toEqual({ tenantId, version: 1 });
    await expect(repository.replace(actor, {
      tenantId,
      target: { kind: "product", productId },
      expectedVersion: 1,
      altText: "Prato local atualizado",
    }, {
      ...product,
      objectKey: `catalog/tenants/${tenantId}/products/${productId}/54000000-0000-0000-0000-000000000002.webp`,
      publicUrl: `https://${blobHost}/catalog/tenants/${tenantId}/products/${productId}/54000000-0000-0000-0000-000000000002.webp`,
      contentSha256: "d".repeat(64),
    })).resolves.toEqual({ tenantId, version: 2, previousObjectKey: product.objectKey });
    await expect(repository.replace(actor, {
      tenantId,
      target: { kind: "product", productId },
      expectedVersion: 1,
      altText: "Concorrência obsoleta",
    }, product)).rejects.toBeInstanceOf(CatalogImageConflictError);
    await expect(repository.replace(actor, {
      tenantId: "40000000-0000-0000-0000-000000000004",
      target: { kind: "tenant_logo" },
      expectedVersion: null,
    }, logo)).rejects.toBeInstanceOf(CatalogImageNotFoundError);

    const client = await pool.connect();
    try {
      await client.query("BEGIN READ ONLY");
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
      const logoRow = await client.query<{ object_key: string; version: string }>(
        "SELECT object_key, version FROM tenant_profile_images WHERE tenant_id = $1",
        [tenantId],
      );
      const productRow = await client.query<{ object_key: string; alt_text: string; version: string }>(
        "SELECT object_key, alt_text, version FROM product_catalog_images WHERE tenant_id = $1 AND product_id = $2",
        [tenantId, productId],
      );
      const logoAudit = await client.query<{ action: string; changes: Record<string, unknown> }>(
        "SELECT action, changes FROM tenant_profile_audit_events WHERE tenant_id = $1 AND action = 'tenant.logo.updated' ORDER BY occurred_at, id",
        [tenantId],
      );
      const productAudit = await client.query<{ action: string; changes: Record<string, unknown> }>(
        "SELECT action, changes FROM catalog_audit_events WHERE tenant_id = $1 AND action = 'product.image.updated' ORDER BY occurred_at, id",
        [tenantId],
      );
      await client.query("COMMIT");
      expect(logoRow.rows).toEqual([{
        object_key: `catalog/tenants/${tenantId}/logo/53000000-0000-0000-0000-000000000002.webp`,
        version: "2",
      }]);
      expect(productRow.rows).toEqual([{
        object_key: `catalog/tenants/${tenantId}/products/${productId}/54000000-0000-0000-0000-000000000002.webp`,
        alt_text: "Prato local atualizado",
        version: "2",
      }]);
      expect(logoAudit.rows).toHaveLength(2);
      expect(productAudit.rows).toHaveLength(2);
      expect(JSON.stringify([...logoAudit.rows, ...productAudit.rows])).not.toMatch(/objectKey|publicUrl|https:\/\//);
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
});
