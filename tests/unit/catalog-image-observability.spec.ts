import { expect, test } from "@playwright/test";
import {
  recordCatalogImageCleanupPending,
  recordCatalogImageOperationalFailure,
} from "../../application/catalog-image-observability";

test("registra falha de upload sem mensagem, segredo, tenant, chave ou identidade", () => {
  const logs: string[] = [];
  recordCatalogImageOperationalFailure(
    new Error("token-secreto catalog/tenants/tenant/object.webp"),
    "product",
    (message) => logs.push(message),
  );
  expect(logs).toHaveLength(1);
  expect(JSON.parse(logs[0])).toEqual({
    event: "catalog_image_upload_failed",
    target: "product",
    errorType: "Error",
  });
  expect(logs[0]).not.toContain("token-secreto");
  expect(logs[0]).not.toContain("catalog/tenants");
});

test("registra limpeza pendente somente com evento e tipo de alvo", () => {
  const logs: string[] = [];
  recordCatalogImageCleanupPending("tenant_logo", (message) => logs.push(message));
  expect(JSON.parse(logs[0])).toEqual({
    event: "catalog_image_previous_object_cleanup_pending",
    target: "tenant_logo",
  });
});
