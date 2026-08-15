import type { TenantRole } from "../domain/catalog";

export type CatalogAuditEvent = {
  id: string;
  productName: string;
  actorRole: Extract<TenantRole, "owner" | "manager">;
  priceInCents?: number;
  isAvailable?: boolean;
  name?: string;
  description?: string;
  occurredAt: Date;
};

export interface CatalogAuditRepository {
  listRecentByTenantId(tenantId: string, limit: number): Promise<readonly CatalogAuditEvent[]>;
}
