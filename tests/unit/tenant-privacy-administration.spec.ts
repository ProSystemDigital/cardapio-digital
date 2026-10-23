import { expect, test } from "@playwright/test";
import { TenantPrivacyAdministrationService, TenantPrivacyAuthorizationError, TenantPrivacyValidationError, type SaveTenantPrivacyCommand, type TenantPrivacyCommandPort } from "../../domain/tenant-privacy-administration";

const tenantId = "30000000-0000-0000-0000-000000000003";
const actorId = "20000000-0000-4000-8000-000000000002";
const command = { tenantId, expectedVersion: null, controllerLegalName: "  Loja   Exemplo ", privacyEmail: " PRIVACIDADE@LOJA.COM.BR ", orderAddressRetentionDays: 90 };

test("proprietário salva controlador, canal normalizado e retenção explícita", async () => {
  let received: SaveTenantPrivacyCommand = command;
  const port: TenantPrivacyCommandPort = { save: async (_actor, value) => { received = value; return { tenantId, version: 1 }; } };
  await expect(new TenantPrivacyAdministrationService(port).save({ id: actorId, role: "owner", tenantIds: [tenantId] }, command)).resolves.toEqual({ tenantId, version: 1 });
  expect(received.controllerLegalName).toBe("Loja Exemplo");
  expect(received.privacyEmail).toBe("privacidade@loja.com.br");
});

test("privacidade recusa gerente, outro tenant, contato e retenção inválidos", async () => {
  const port: TenantPrivacyCommandPort = { save: async () => { throw new Error("não deve chamar"); } };
  const service = new TenantPrivacyAdministrationService(port);
  await expect(service.save({ id: actorId, role: "manager", tenantIds: [tenantId] }, command)).rejects.toBeInstanceOf(TenantPrivacyAuthorizationError);
  await expect(service.save({ id: actorId, role: "owner", tenantIds: [] }, command)).rejects.toBeInstanceOf(TenantPrivacyAuthorizationError);
  await expect(service.save({ id: actorId, role: "owner", tenantIds: [tenantId] }, { ...command, privacyEmail: "invalido" })).rejects.toBeInstanceOf(TenantPrivacyValidationError);
  await expect(service.save({ id: actorId, role: "owner", tenantIds: [tenantId] }, { ...command, orderAddressRetentionDays: 0 })).rejects.toBeInstanceOf(TenantPrivacyValidationError);
});
