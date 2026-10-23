import { expect, test } from "@playwright/test";
import { Pool } from "pg";
import { TenantPrivacyAdministrationService } from "../../domain/tenant-privacy-administration";
import { DeliveryOriginAdministrationService } from "../../domain/delivery-origin-administration";
import { PostgresTenantPrivacyCommandRepository } from "../../data/postgres-tenant-privacy-command-repository";
import { PostgresDeliveryOriginCommandRepository } from "../../data/postgres-delivery-origin-command-repository";
import { PostgresDeliveryOriginGeocodingRepository } from "../../data/postgres-delivery-origin-geocoding-repository";

const databaseUrl = process.env.DATABASE_TEST_URL;
if (!databaseUrl) throw new Error("DATABASE_TEST_URL é obrigatória.");
const tenantId = "30000000-0000-0000-0000-000000000003";
const actor = { id: "41000000-0000-4000-8000-000000000001", role: "owner" as const, tenantIds: [tenantId] };

test("privacidade cria, atualiza e audita sem copiar nome ou email", async () => {
  const pool = new Pool({ connectionString: databaseUrl, max: 1 });
  try {
    const service = new TenantPrivacyAdministrationService(new PostgresTenantPrivacyCommandRepository(pool));
    await expect(service.save(actor, { tenantId, expectedVersion: null, controllerLegalName: "Loja Teste", privacyEmail: "privacidade@teste.invalid", orderAddressRetentionDays: 90 })).resolves.toEqual({ tenantId, version: 1 });
    await expect(service.save(actor, { tenantId, expectedVersion: 1, controllerLegalName: "Loja Teste II", privacyEmail: "canal@teste.invalid", orderAddressRetentionDays: 120 })).resolves.toEqual({ tenantId, version: 2 });
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
      const rows = await client.query("SELECT controller_legal_name, privacy_email, order_address_retention_days, version FROM tenant_privacy_settings WHERE tenant_id=$1", [tenantId]);
      expect(rows.rows).toEqual([{ controller_legal_name: "Loja Teste II", privacy_email: "canal@teste.invalid", order_address_retention_days: 120, version: "2" }]);
      const audit = await client.query("SELECT changes FROM tenant_privacy_audit_events WHERE tenant_id=$1 ORDER BY occurred_at", [tenantId]);
      expect(audit.rows).toHaveLength(2);
      expect(JSON.stringify(audit.rows)).not.toContain("Loja Teste");
      expect(JSON.stringify(audit.rows)).not.toContain("@teste.invalid");
      await client.query("ROLLBACK");
    } finally { client.release(); }
  } finally { await pool.end(); }
});

test("origem atualizada volta a pending e auditoria não copia endereço", async () => {
  const pool = new Pool({ connectionString: databaseUrl, max: 1 });
  try {
    const service = new DeliveryOriginAdministrationService(new PostgresDeliveryOriginCommandRepository(pool));
    const base = { tenantId, expectedVersion: null, label: "Origem teste", postalCode: "01001000", street: "Rua Fictícia", number: "10", neighborhood: "Centro", city: "São Paulo", state: "SP" };
    await expect(service.save(actor, base)).resolves.toEqual({ tenantId, version: 1, geocodingStatus: "pending" });
    await expect(service.save(actor, { ...base, expectedVersion: 1, number: "20" })).resolves.toEqual({ tenantId, version: 2, geocodingStatus: "pending" });
    const geocoding = new PostgresDeliveryOriginGeocodingRepository(pool);
    await expect(geocoding.find(tenantId)).resolves.toMatchObject({ version: 2, address: { postalCode: "01001000", number: "20", country: "BR" } });
    await expect(geocoding.persist({ tenantId, expectedVersion: 2, actorId: actor.id, actorRole: actor.role, status: "verified", point: { latitude: -23.55052, longitude: -46.633308 } })).resolves.toBe(3);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
      const rows = await client.query("SELECT number, latitude, longitude, geocoding_status, version FROM tenant_delivery_origins WHERE tenant_id=$1", [tenantId]);
      expect(rows.rows).toEqual([{ number: "20", latitude: "-23.550520", longitude: "-46.633308", geocoding_status: "verified", version: "3" }]);
      const audit = await client.query("SELECT changes FROM tenant_delivery_origin_audit_events WHERE tenant_id=$1", [tenantId]);
      expect(audit.rows).toHaveLength(3);
      expect(JSON.stringify(audit.rows)).not.toContain("Rua Fictícia");
      expect(JSON.stringify(audit.rows)).not.toContain("01001000");
      expect(JSON.stringify(audit.rows)).not.toContain("-23.55052");
      await client.query("ROLLBACK");
    } finally { client.release(); }
  } finally { await pool.end(); }
});
