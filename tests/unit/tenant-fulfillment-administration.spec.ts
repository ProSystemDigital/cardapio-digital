import { expect, test } from "@playwright/test";
import { TenantFulfillmentAdministrationService } from "../../application/tenant-fulfillment-administration-service";
import type { TenantFulfillmentCommandRepository } from "../../data/tenant-fulfillment-command-repository";
import {
  TenantFulfillmentAuthorizationError,
  TenantFulfillmentValidationError,
} from "../../domain/tenant-fulfillment-administration";

const tenantId = "30000000-0000-0000-0000-000000000003";
const actorId = "41000000-0000-4000-8000-000000000001";
const productId = "32000000-0000-0000-0000-000000000003";

test("contrato habilita somente Na mesa no tenant autorizado", async () => {
  const calls: unknown[] = [];
  const repository: TenantFulfillmentCommandRepository = {
    async enableMode(actor, command) {
      calls.push({ actor, command });
      return command;
    },
  };
  const service = new TenantFulfillmentAdministrationService(repository);
  const actor = { id: actorId, role: "owner" as const, tenantIds: [tenantId] };
  const command = { tenantId, mode: "dine_in" as const, initialProductIds: [productId] };

  await expect(service.enableMode(actor, command)).resolves.toEqual(command);
  expect(calls).toEqual([{ actor, command }]);
});

test("contrato bloqueia outra modalidade, outro tenant e administrador da plataforma", async () => {
  let called = false;
  const repository: TenantFulfillmentCommandRepository = {
    async enableMode(_actor, command) {
      called = true;
      return command;
    },
  };
  const service = new TenantFulfillmentAdministrationService(repository);

  await expect(service.enableMode(
    { id: actorId, role: "owner", tenantIds: [tenantId] },
    { tenantId, mode: "delivery", initialProductIds: [productId] },
  )).rejects.toBeInstanceOf(TenantFulfillmentValidationError);
  await expect(service.enableMode(
    { id: actorId, role: "manager", tenantIds: [] },
    { tenantId, mode: "dine_in", initialProductIds: [productId] },
  )).rejects.toBeInstanceOf(TenantFulfillmentAuthorizationError);
  await expect(service.enableMode(
    { id: actorId, role: "platform_admin", tenantIds: [tenantId] },
    { tenantId, mode: "dine_in", initialProductIds: [productId] },
  )).rejects.toBeInstanceOf(TenantFulfillmentAuthorizationError);
  expect(called).toBe(false);
});

test("contrato rejeita identificadores técnicos inválidos antes da porta", async () => {
  let called = false;
  const repository: TenantFulfillmentCommandRepository = {
    async enableMode(_actor, command) {
      called = true;
      return command;
    },
  };
  const service = new TenantFulfillmentAdministrationService(repository);

  await expect(service.enableMode(
    { id: "forjado", role: "owner", tenantIds: [tenantId] },
    { tenantId, mode: "dine_in", initialProductIds: [productId] },
  )).rejects.toBeInstanceOf(TenantFulfillmentAuthorizationError);
  await expect(service.enableMode(
    { id: actorId, role: "owner", tenantIds: ["tenant-forjado"] },
    { tenantId: "tenant-forjado", mode: "dine_in", initialProductIds: [productId] },
  )).rejects.toBeInstanceOf(TenantFulfillmentValidationError);
  expect(called).toBe(false);
});

test("contrato exige produtos iniciais únicos e válidos", async () => {
  let called = false;
  const repository: TenantFulfillmentCommandRepository = {
    async enableMode(_actor, command) {
      called = true;
      return command;
    },
  };
  const service = new TenantFulfillmentAdministrationService(repository);
  const actor = { id: actorId, role: "owner" as const, tenantIds: [tenantId] };

  await expect(service.enableMode(actor, {
    tenantId,
    mode: "dine_in",
    initialProductIds: [],
  })).rejects.toBeInstanceOf(TenantFulfillmentValidationError);
  await expect(service.enableMode(actor, {
    tenantId,
    mode: "dine_in",
    initialProductIds: [productId, productId],
  })).rejects.toBeInstanceOf(TenantFulfillmentValidationError);
  await expect(service.enableMode(actor, {
    tenantId,
    mode: "dine_in",
    initialProductIds: ["forjado"],
  })).rejects.toBeInstanceOf(TenantFulfillmentValidationError);
  expect(called).toBe(false);
});
