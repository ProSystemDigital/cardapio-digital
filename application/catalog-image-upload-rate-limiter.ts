import type { TrustedIdentity } from "../domain/authorization";
import type { TenantId } from "../domain/catalog";

export class CatalogImageRateLimitError extends Error {}

type WindowState = { count: number; resetAt: number };

export class CatalogImageUploadRateLimiter {
  private readonly windows = new Map<string, WindowState>();

  constructor(
    private readonly maximumUploads = 5,
    private readonly windowMs = 10 * 60 * 1000,
    private readonly maximumTrackedKeys = 500,
    private readonly now: () => number = Date.now,
  ) {
    if (
      !Number.isSafeInteger(maximumUploads) || maximumUploads < 1 || maximumUploads > 20 ||
      !Number.isSafeInteger(windowMs) || windowMs < 1_000 || windowMs > 3_600_000 ||
      !Number.isSafeInteger(maximumTrackedKeys) || maximumTrackedKeys < 1 || maximumTrackedKeys > 10_000
    ) {
      throw new Error("Configuração de limite de upload inválida.");
    }
  }

  consume(identity: TrustedIdentity, tenantId: TenantId): void {
    const timestamp = this.now();
    const key = `${identity.principalId}:${tenantId}`;
    const current = this.windows.get(key);
    if (!current || current.resetAt <= timestamp) {
      this.ensureCapacity(timestamp);
      this.windows.set(key, { count: 1, resetAt: timestamp + this.windowMs });
      return;
    }
    if (current.count >= this.maximumUploads) {
      throw new CatalogImageRateLimitError("Limite temporário de uploads atingido.");
    }
    current.count += 1;
  }

  private ensureCapacity(timestamp: number): void {
    for (const [key, state] of this.windows) {
      if (state.resetAt <= timestamp) this.windows.delete(key);
    }
    if (this.windows.size < this.maximumTrackedKeys) return;
    const oldestKey = this.windows.keys().next().value as string | undefined;
    if (oldestKey) this.windows.delete(oldestKey);
  }
}
