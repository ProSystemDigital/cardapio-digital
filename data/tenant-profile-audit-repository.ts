import type { TenantId } from "../domain/catalog";

export type TenantProfileAuditEvent = Readonly<{
  id: string;
  tenantId: TenantId;
  actorRole: "owner" | "manager";
  shortName?: string;
  tagline?: string;
  fulfillmentMode?: string;
  occurredAt: Date;
}>;

export interface TenantProfileAuditRepository {
  listRecentByTenantId(
    tenantId: TenantId,
    limit: number,
  ): Promise<readonly TenantProfileAuditEvent[]>;
}
