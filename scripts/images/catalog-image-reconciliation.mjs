const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const CATALOG_IMAGE_PATH = new RegExp(
  `^catalog/tenants/(${UUID})/(?:logo|products/(${UUID}))/(${UUID})\\.webp$`,
  "i",
);

export const DEFAULT_ORPHAN_GRACE_MS = 24 * 60 * 60 * 1000;
export const DEFAULT_MAX_DELETIONS = 100;

export function parseCatalogImagePath(pathname) {
  const match = CATALOG_IMAGE_PATH.exec(pathname);
  return match ? { tenantId: match[1], productId: match[2] ?? null } : null;
}

export function buildCatalogImageReconciliationPlan({
  blobs,
  referencedObjectKeys,
  now = new Date(),
  graceMs = DEFAULT_ORPHAN_GRACE_MS,
}) {
  if (!Number.isSafeInteger(graceMs) || graceMs < 60_000) {
    throw new Error("Período de carência inválido para reconciliação.");
  }
  const cutoff = now.getTime() - graceMs;
  const metrics = {
    listedObjects: blobs.length,
    listedBytes: 0,
    referencedObjects: 0,
    referencedBytes: 0,
    orphanCandidates: 0,
    orphanCandidateBytes: 0,
    youngUnreferencedObjects: 0,
    youngUnreferencedBytes: 0,
    invalidNamespaceObjects: 0,
    invalidNamespaceBytes: 0,
  };
  const candidates = [];
  const tenantIds = new Set();

  for (const blob of blobs) {
    if (!Number.isSafeInteger(blob.size) || blob.size < 0 || !(blob.uploadedAt instanceof Date)) {
      throw new Error("Metadados de objeto inválidos durante reconciliação.");
    }
    metrics.listedBytes += blob.size;
    const parsed = parseCatalogImagePath(blob.pathname);
    if (!parsed) {
      metrics.invalidNamespaceObjects += 1;
      metrics.invalidNamespaceBytes += blob.size;
      continue;
    }
    tenantIds.add(parsed.tenantId);
    if (referencedObjectKeys.has(blob.pathname)) {
      metrics.referencedObjects += 1;
      metrics.referencedBytes += blob.size;
    } else if (blob.uploadedAt.getTime() <= cutoff) {
      candidates.push(blob);
      metrics.orphanCandidates += 1;
      metrics.orphanCandidateBytes += blob.size;
    } else {
      metrics.youngUnreferencedObjects += 1;
      metrics.youngUnreferencedBytes += blob.size;
    }
  }

  return { candidates, tenantIds: [...tenantIds].sort(), metrics };
}

export function reconciliationLog(event, fields) {
  return JSON.stringify({ event, ...fields });
}
