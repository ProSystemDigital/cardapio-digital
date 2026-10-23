import { expect, test } from "@playwright/test";
import { validatePublicCatalogImageReference } from "../../data/postgres-catalog-repository";

const tenantId = "10000000-0000-0000-0000-000000000001";
const productId = "12000000-0000-0000-0000-000000000001";
const objectId = "55000000-0000-4000-8000-000000000005";

function reference(path: string) {
  return {
    object_key: path,
    public_url: `https://store.public.blob.vercel-storage.com/${path}`,
    storage_provider: "vercel_blob",
    media_type: "image/webp",
  };
}

test("aceita somente referência pública no namespace exato do tenant e produto", () => {
  const path = `catalog/tenants/${tenantId}/products/${productId}/${objectId}.webp`;
  expect(() => validatePublicCatalogImageReference(
    reference(path),
    tenantId,
    `products/${productId}`,
  )).not.toThrow();

  expect(() => validatePublicCatalogImageReference(
    reference(path),
    "20000000-0000-0000-0000-000000000002",
    `products/${productId}`,
  )).toThrow("namespace");
});

test("recusa host, protocolo ou formato fora do armazenamento aprovado", () => {
  const path = `catalog/tenants/${tenantId}/logo/${objectId}.webp`;
  expect(() => validatePublicCatalogImageReference({
    ...reference(path),
    public_url: `https://example.test/${path}`,
  }, tenantId, "logo")).toThrow("armazenamento aprovado");
  expect(() => validatePublicCatalogImageReference({
    ...reference(path),
    media_type: "image/png",
  }, tenantId, "logo")).toThrow("namespace");
});
