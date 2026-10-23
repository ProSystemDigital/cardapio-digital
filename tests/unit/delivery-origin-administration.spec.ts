import { expect, test } from "@playwright/test";
import { DeliveryOriginAdministrationService, DeliveryOriginAuthorizationError, DeliveryOriginValidationError, type DeliveryOriginCommandPort, type SaveDeliveryOriginCommand } from "../../domain/delivery-origin-administration";

const tenantId = "30000000-0000-0000-0000-000000000003";
const actorId = "20000000-0000-4000-8000-000000000002";
const command = { tenantId, expectedVersion: null, label: "Loja principal", postalCode: "01001-000", street: "Rua de Teste", number: "10", neighborhood: "Centro", city: "São Paulo", state: "sp" };

test("proprietário ou gerente salva endereço normalizado sem aceitar coordenadas", async () => {
  let received: SaveDeliveryOriginCommand = command;
  const port: DeliveryOriginCommandPort = { save: async (_actor, value) => { received = value; return { tenantId, version: 1, geocodingStatus: "pending" }; } };
  const service = new DeliveryOriginAdministrationService(port);
  await expect(service.save({ id: actorId, role: "manager", tenantIds: [tenantId] }, command)).resolves.toEqual({ tenantId, version: 1, geocodingStatus: "pending" });
  expect(received.postalCode).toBe("01001000");
  expect(received.state).toBe("SP");
  expect(command).not.toHaveProperty("latitude");
  expect(command).not.toHaveProperty("longitude");
});

test("origem recusa outro tenant, papel de plataforma e endereço inválido", async () => {
  const port: DeliveryOriginCommandPort = { save: async () => { throw new Error("não deve chamar"); } };
  const service = new DeliveryOriginAdministrationService(port);
  await expect(service.save({ id: actorId, role: "platform_admin", tenantIds: [tenantId] }, command)).rejects.toBeInstanceOf(DeliveryOriginAuthorizationError);
  await expect(service.save({ id: actorId, role: "owner", tenantIds: [] }, command)).rejects.toBeInstanceOf(DeliveryOriginAuthorizationError);
  await expect(service.save({ id: actorId, role: "owner", tenantIds: [tenantId] }, { ...command, postalCode: "123" })).rejects.toBeInstanceOf(DeliveryOriginValidationError);
});
