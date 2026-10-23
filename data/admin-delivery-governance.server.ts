import "server-only";
import { Pool } from "pg";
import type { TenantId } from "../domain/catalog";

export type TenantPrivacyView = Readonly<{
  controllerLegalName: string;
  privacyEmail: string;
  orderAddressRetentionDays: number;
  version: number;
}>;

export type DeliveryOriginView = Readonly<{
  label: string;
  postalCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  geocodingStatus: "pending" | "verified" | "failed";
  version: number;
}>;

let pool: Pool | null = null;

export async function loadDeliveryGovernance(tenantId: TenantId): Promise<{
  privacy: TenantPrivacyView | null;
  origin: DeliveryOriginView | null;
} | null> {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) return null;
  pool ??= new Pool({ connectionString: databaseUrl, max: 3, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 5_000, allowExitOnIdle: true });
  const client = await pool.connect();
  try {
    await client.query("BEGIN READ ONLY");
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
    const [privacy, origin] = await Promise.all([
      client.query<{ controller_legal_name: string; privacy_email: string; order_address_retention_days: number; version: string }>(
        "SELECT controller_legal_name, privacy_email, order_address_retention_days, version FROM tenant_privacy_settings WHERE tenant_id = $1",
        [tenantId],
      ),
      client.query<{ label: string; postal_code: string; street: string; number: string; complement: string | null; neighborhood: string; city: string; state: string; geocoding_status: "pending" | "verified" | "failed"; version: string }>(
        "SELECT label, postal_code, street, number, complement, neighborhood, city, state, geocoding_status, version FROM tenant_delivery_origins WHERE tenant_id = $1",
        [tenantId],
      ),
    ]);
    await client.query("COMMIT");
    const privacyRow = privacy.rows[0];
    const originRow = origin.rows[0];
    return {
      privacy: privacyRow ? {
        controllerLegalName: privacyRow.controller_legal_name,
        privacyEmail: privacyRow.privacy_email,
        orderAddressRetentionDays: privacyRow.order_address_retention_days,
        version: Number(privacyRow.version),
      } : null,
      origin: originRow ? {
        label: originRow.label,
        postalCode: originRow.postal_code,
        street: originRow.street,
        number: originRow.number,
        ...(originRow.complement ? { complement: originRow.complement } : {}),
        neighborhood: originRow.neighborhood,
        city: originRow.city,
        state: originRow.state,
        geocodingStatus: originRow.geocoding_status,
        version: Number(originRow.version),
      } : null,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
