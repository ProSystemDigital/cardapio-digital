import type { CategoryId, TenantId } from "../domain/catalog";

export type CategoryAuditEvent = Readonly<{
  id: string;
  tenantId: TenantId;
  categoryId: CategoryId;
  categoryName: string;
  actorRole: "owner" | "manager";
  newName?: string;
  sortOrder?: number;
  occurredAt: Date;
}>;

export interface CategoryAuditRepository {
  listRecentByTenantId(
    tenantId: TenantId,
    limit: number,
  ): Promise<readonly CategoryAuditEvent[]>;
}
