type CatalogImageFailureTarget = "tenant_logo" | "product" | "unknown";

export function recordCatalogImageOperationalFailure(
  error: unknown,
  target: CatalogImageFailureTarget,
  write: (message: string) => void = console.error,
): void {
  write(JSON.stringify({
    event: "catalog_image_upload_failed",
    target,
    errorType: error instanceof Error ? error.name : "UnknownError",
  }));
}

export function recordCatalogImageCleanupPending(
  target: Exclude<CatalogImageFailureTarget, "unknown">,
  write: (message: string) => void = console.warn,
): void {
  write(JSON.stringify({
    event: "catalog_image_previous_object_cleanup_pending",
    target,
  }));
}
