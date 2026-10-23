export type CatalogBlob = Readonly<{
  pathname: string;
  size: number;
  uploadedAt: Date;
}>;

export type CatalogImageReconciliationMetrics = Readonly<{
  listedObjects: number;
  listedBytes: number;
  referencedObjects: number;
  referencedBytes: number;
  orphanCandidates: number;
  orphanCandidateBytes: number;
  youngUnreferencedObjects: number;
  youngUnreferencedBytes: number;
  invalidNamespaceObjects: number;
  invalidNamespaceBytes: number;
}>;

export const DEFAULT_ORPHAN_GRACE_MS: number;
export const DEFAULT_MAX_DELETIONS: number;
export function parseCatalogImagePath(pathname: string): { tenantId: string; productId: string | null } | null;
export function buildCatalogImageReconciliationPlan(input: Readonly<{
  blobs: readonly CatalogBlob[];
  referencedObjectKeys: ReadonlySet<string>;
  now?: Date;
  graceMs?: number;
}>): Readonly<{
  candidates: readonly CatalogBlob[];
  tenantIds: readonly string[];
  metrics: CatalogImageReconciliationMetrics;
}>;
export function reconciliationLog(event: string, fields: Readonly<Record<string, unknown>>): string;
