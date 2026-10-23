import { expect, test } from "@playwright/test";
import {
  CatalogImageRateLimitError,
  CatalogImageUploadRateLimiter,
} from "../../application/catalog-image-upload-rate-limiter";

const identity = { principalId: "41000000-0000-4000-8000-000000000001" };
const tenantId = "30000000-0000-4000-8000-000000000003";

test("limita por principal e tenant e reabre após a janela", () => {
  let now = 1_000;
  const limiter = new CatalogImageUploadRateLimiter(2, 1_000, 10, () => now);
  limiter.consume(identity, tenantId);
  limiter.consume(identity, tenantId);
  expect(() => limiter.consume(identity, tenantId)).toThrow(CatalogImageRateLimitError);
  now = 2_000;
  expect(() => limiter.consume(identity, tenantId)).not.toThrow();
});

test("isola chaves e limita memória rastreada", () => {
  const limiter = new CatalogImageUploadRateLimiter(1, 10_000, 1, () => 1_000);
  limiter.consume(identity, tenantId);
  expect(() => limiter.consume(
    { principalId: "42000000-0000-4000-8000-000000000002" },
    tenantId,
  )).not.toThrow();
});
