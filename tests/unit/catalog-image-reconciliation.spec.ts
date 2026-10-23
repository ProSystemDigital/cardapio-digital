import { expect, test } from "@playwright/test";
import {
  buildCatalogImageReconciliationPlan,
  parseCatalogImagePath,
  reconciliationLog,
} from "../../scripts/images/catalog-image-reconciliation.mjs";

const tenantId = "10000000-0000-0000-0000-000000000001";
const productId = "12000000-0000-0000-0000-000000000001";
const activeId = "55000000-0000-4000-8000-000000000001";
const orphanId = "55000000-0000-4000-8000-000000000002";

test("classifica referências, órfãos maduros, objetos jovens e namespace inválido", () => {
  const active = `catalog/tenants/${tenantId}/logo/${activeId}.webp`;
  const orphan = `catalog/tenants/${tenantId}/products/${productId}/${orphanId}.webp`;
  const plan = buildCatalogImageReconciliationPlan({
    blobs: [
      { pathname: active, size: 100, uploadedAt: new Date("2026-08-01T00:00:00Z") },
      { pathname: orphan, size: 200, uploadedAt: new Date("2026-08-01T00:00:00Z") },
      { pathname: `catalog/tenants/${tenantId}/logo/55000000-0000-4000-8000-000000000003.webp`, size: 300, uploadedAt: new Date("2026-08-18T11:30:00Z") },
      { pathname: "catalog/fora-do-contrato.webp", size: 400, uploadedAt: new Date("2026-08-01T00:00:00Z") },
    ],
    referencedObjectKeys: new Set([active]),
    now: new Date("2026-08-18T12:00:00Z"),
  });

  expect(plan.candidates.map(({ pathname }) => pathname)).toEqual([orphan]);
  expect(plan.tenantIds).toEqual([tenantId]);
  expect(plan.metrics).toEqual({
    listedObjects: 4,
    listedBytes: 1000,
    referencedObjects: 1,
    referencedBytes: 100,
    orphanCandidates: 1,
    orphanCandidateBytes: 200,
    youngUnreferencedObjects: 1,
    youngUnreferencedBytes: 300,
    invalidNamespaceObjects: 1,
    invalidNamespaceBytes: 400,
  });
});

test("nunca inclui chave ou URL no log agregado", () => {
  expect(parseCatalogImagePath(`catalog/tenants/${tenantId}/logo/${activeId}.webp`)).toEqual({
    tenantId,
    productId: null,
  });
  expect(parseCatalogImagePath("catalog/tenants/../segredo.webp")).toBeNull();
  const log = reconciliationLog("catalog_image_reconciliation_completed", {
    mode: "dry_run",
    listedObjects: 2,
    listedBytes: 1024,
  });
  expect(log).not.toContain("pathname");
  expect(log).not.toContain("http");
  expect(JSON.parse(log)).toEqual({
    event: "catalog_image_reconciliation_completed",
    mode: "dry_run",
    listedObjects: 2,
    listedBytes: 1024,
  });
});
