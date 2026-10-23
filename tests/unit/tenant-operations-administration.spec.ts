import { expect, test } from "@playwright/test";
import { TenantOperationsAdministrationService } from "../../application/tenant-operations-administration-service";
import { TenantOperationsAuthorizationError, TenantOperationsValidationError, type UpdateTenantOperationsCommand } from "../../domain/tenant-operations-administration";
import { BRAZILIAN_WHATSAPP_INPUT_PATTERN, formatBrazilianWhatsapp, isBrazilianMobileWhatsapp, normalizeBrazilianWhatsapp } from "../../domain/brazilian-whatsapp";

const tenantId = "30000000-0000-0000-0000-000000000003";
const actor = { id: "41000000-0000-4000-8000-000000000001", role: "owner" as const, tenantIds: [tenantId] };
const command: Extract<UpdateTenantOperationsCommand, { section: "attendance" }> = {
  tenantId, expectedVersion: 1, section: "attendance", whatsappNumber: "+5511999999999",
  businessHours: [{ weekday: "monday", opensAt: "09:00", closesAt: "18:00" }],
};

test("atualiza configuração operacional validada no tenant autorizado", async () => {
  const received: UpdateTenantOperationsCommand[] = [];
  const service = new TenantOperationsAdministrationService({ async updateOperations(_actor, input) {
    received.push(input); return { tenantId: input.tenantId, version: 2 };
  } });
  await expect(service.update(actor, command)).resolves.toEqual({ tenantId, version: 2 });
  expect(received).toEqual([command]);
});

test("recusa outro tenant e cada seção operacional inválida", async () => {
  const service = new TenantOperationsAdministrationService({ async updateOperations() { throw new Error("não deve persistir"); } });
  expect(() => service.update({ ...actor, tenantIds: [] }, command)).toThrow(TenantOperationsAuthorizationError);
  const invalidCommands: UpdateTenantOperationsCommand[] = [
    { tenantId, expectedVersion: 1, section: "attendance", whatsappNumber: "11999999999", businessHours: command.businessHours },
    { tenantId, expectedVersion: 1, section: "attendance", whatsappNumber: command.whatsappNumber, businessHours: [{ weekday: "monday" as const, opensAt: "18:00", closesAt: "09:00" }] },
    { tenantId, expectedVersion: 1, section: "tables", diningTables: ["Salão · Mesa 01", "salão · mesa 01"] },
    { tenantId, expectedVersion: 1, section: "tables", diningTables: ["Mesa sem ambiente"] },
    { tenantId, expectedVersion: 1, section: "finance", minimumOrderInCents: -1, paymentMethods: ["pix"] },
    { tenantId, expectedVersion: 1, section: "finance", minimumOrderInCents: 1000, paymentMethods: [] },
    { tenantId, expectedVersion: 1, section: "logistics", deliveryFeeInCents: 0, maximumDeliveryDistanceInMeters: 499 },
    { tenantId, expectedVersion: 1, section: "logistics", deliveryFeeInCents: 0, maximumDeliveryDistanceInMeters: 200001 },
  ];
  for (const invalid of invalidCommands) expect(() => service.update(actor, invalid)).toThrow(TenantOperationsValidationError);
});

test("normaliza e apresenta celular brasileiro no padrão da Anatel", () => {
  for (const input of ["5511999999999", "+5511999999999", "+55 (11) 99999-9999", "(11) 99999-9999"]) {
    expect(normalizeBrazilianWhatsapp(input)).toBe("+5511999999999");
  }
  expect(formatBrazilianWhatsapp("+5511999999999")).toBe("+55 (11) 99999-9999");
  expect(new RegExp(`^(?:${BRAZILIAN_WHATSAPP_INPUT_PATTERN})$`).test("+55 (11) 99999-9999")).toBe(true);
  expect(isBrazilianMobileWhatsapp("+5511999999999")).toBe(true);
  expect(isBrazilianMobileWhatsapp("+55999999999")).toBe(false);
});
