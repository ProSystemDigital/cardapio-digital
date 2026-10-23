import { expect, test } from "@playwright/test";
import { VercelBlobCatalogImageStorage } from "../../data/vercel-blob-catalog-image-storage";

// Mirrors the deterministic PostgreSQL identifiers used by the local admin
// fixture; PostgreSQL UUIDs need not encode RFC version/variant bits.
const tenantId = "10000000-0000-0000-0000-000000000001";
const productId = "30000000-0000-0000-0000-000000000001";
const objectId = "55000000-0000-4000-8000-000000000005";
const normalized = {
  bytes: new Uint8Array([1, 2, 3]),
  mediaType: "image/webp" as const,
  byteSize: 3,
  widthPixels: 1200,
  heightPixels: 900,
  contentSha256: "a".repeat(64),
};

test("envia WebP público com chave aleatória imutável e metadados preservados", async () => {
  const calls: unknown[][] = [];
  const pathname = `catalog/tenants/${tenantId}/products/${productId}/${objectId}.webp`;
  const storage = new VercelBlobCatalogImageStorage(async (...args) => {
    calls.push(args);
    return {
      pathname,
      url: `https://store.public.blob.vercel-storage.com/${pathname}`,
    };
  }, async () => {}, () => objectId);

  await expect(storage.put(tenantId, { kind: "product", productId }, normalized)).resolves.toEqual({
    storageProvider: "vercel_blob",
    objectKey: pathname,
    publicUrl: `https://store.public.blob.vercel-storage.com/${pathname}`,
    mediaType: "image/webp",
    byteSize: 3,
    widthPixels: 1200,
    heightPixels: 900,
    contentSha256: "a".repeat(64),
  });
  expect(calls).toHaveLength(1);
  expect(calls[0][0]).toBe(pathname);
  expect(Buffer.isBuffer(calls[0][1])).toBe(true);
  expect(calls[0][2]).toMatchObject({
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: false,
    contentType: "image/webp",
    cacheControlMaxAge: 31_536_000,
  });
  expect((calls[0][2] as { abortSignal: AbortSignal }).abortSignal).toBeInstanceOf(AbortSignal);
});

test("aborta upload que excede o timeout do SDK", async () => {
  const storage = new VercelBlobCatalogImageStorage((_pathname, _body, options) => (
    new Promise((_resolve, reject) => {
      options.abortSignal.addEventListener("abort", () => reject(options.abortSignal.reason));
    })
  ), async () => {}, () => objectId, 1);
  await expect(storage.put(tenantId, { kind: "tenant_logo" }, {
    ...normalized,
    widthPixels: 512,
    heightPixels: 512,
  })).rejects.toThrow("tempo limite");
});

test("gera caminho separado para logo e aceita exclusão somente no namespace próprio", async () => {
  const deleted: string[] = [];
  const pathname = `catalog/tenants/${tenantId}/logo/${objectId}.webp`;
  const storage = new VercelBlobCatalogImageStorage(async () => ({
    pathname,
    url: `https://store.public.blob.vercel-storage.com/${pathname}`,
  }), async (key) => { deleted.push(key); }, () => objectId);

  await storage.put(tenantId, { kind: "tenant_logo" }, {
    ...normalized,
    widthPixels: 512,
    heightPixels: 512,
  });
  await storage.delete(pathname);
  expect(deleted).toEqual([pathname]);
  await expect(storage.delete("catalog/tenants/../../segredo.webp")).rejects.toThrow(
    "Chave recusada",
  );
  await expect(storage.delete("outro-prefixo/imagem.webp")).rejects.toThrow(
    "Chave recusada",
  );
});

test("recusa resposta divergente ou URL fora do Blob público", async () => {
  const expectedPath = `catalog/tenants/${tenantId}/logo/${objectId}.webp`;
  const image = { ...normalized, widthPixels: 512, heightPixels: 512 };
  await expect(new VercelBlobCatalogImageStorage(async () => ({
    pathname: "chave-diferente.webp",
    url: `https://store.public.blob.vercel-storage.com/${expectedPath}`,
  }), async () => {}, () => objectId).put(tenantId, { kind: "tenant_logo" }, image)).rejects.toThrow(
    "chave diferente",
  );
  await expect(new VercelBlobCatalogImageStorage(async () => ({
    pathname: expectedPath,
    url: `https://example.test/${expectedPath}`,
  }), async () => {}, () => objectId).put(tenantId, { kind: "tenant_logo" }, image)).rejects.toThrow(
    "URL pública fora do contrato",
  );
});
