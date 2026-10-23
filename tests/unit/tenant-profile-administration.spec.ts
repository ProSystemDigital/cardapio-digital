import { expect, test } from "@playwright/test";
import { TenantProfileAdministrationService } from "../../application/tenant-profile-administration-service";
import type { TenantProfileCommandRepository } from "../../data/tenant-profile-command-repository";
import {
  TenantProfileAuthorizationError,
  TenantProfileValidationError,
  type TenantProfileActor,
  type UpdateTenantProfileCommand,
} from "../../domain/tenant-profile-administration";

const tenantId = "10000000-0000-0000-0000-000000000001";
const actor: TenantProfileActor = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  role: "owner",
  tenantIds: [tenantId],
};

function createService() {
  const calls: Array<{ actor: TenantProfileActor; command: UpdateTenantProfileCommand }> = [];
  const repository: TenantProfileCommandRepository = {
    async updateProfile(receivedActor, command) {
      calls.push({ actor: receivedActor, command });
      return { tenantId: command.tenantId, version: command.expectedVersion + 1 };
    },
  };
  return { service: new TenantProfileAdministrationService(repository), calls };
}

test("autoriza proprietário ou gerente do tenant e preserva versão esperada", async () => {
  for (const role of ["owner", "manager"] as const) {
    const { service, calls } = createService();
    const result = await service.updateProfile(
      { ...actor, role },
      { tenantId, expectedVersion: 3, shortName: "Mesa Viva", tagline: "Sabor local" },
    );
    expect(result).toEqual({ tenantId, version: 4 });
    expect(calls).toHaveLength(1);
  }
});

test("aceita exatamente 30 caracteres no nome e no slogan", async () => {
  const { service } = createService();
  await expect(service.updateProfile(actor, {
    tenantId,
    expectedVersion: 1,
    shortName: "N".repeat(30),
    tagline: "S".repeat(30),
  })).resolves.toMatchObject({ version: 2 });
});

test("nega administrador da plataforma, outro tenant e ator inválido", async () => {
  const { service } = createService();
  const command = { tenantId, expectedVersion: 1, shortName: "Mesa Viva" };
  await expect(service.updateProfile({ ...actor, role: "platform_admin" }, command)).rejects.toBeInstanceOf(TenantProfileAuthorizationError);
  await expect(service.updateProfile({ ...actor, tenantIds: [] }, command)).rejects.toBeInstanceOf(TenantProfileAuthorizationError);
  await expect(service.updateProfile({ ...actor, id: "cliente" }, command)).rejects.toBeInstanceOf(TenantProfileAuthorizationError);
});

test("rejeita comando vazio, versão, tenant e textos inválidos antes do repositório", async () => {
  const { service, calls } = createService();
  const invalidCommands: UpdateTenantProfileCommand[] = [
    { tenantId, expectedVersion: 0, shortName: "Mesa" },
    { tenantId, expectedVersion: 1 },
    { tenantId, expectedVersion: 1, shortName: " " },
    { tenantId, expectedVersion: 1, tagline: " " },
    { tenantId, expectedVersion: 1, shortName: "x".repeat(31) },
    { tenantId, expectedVersion: 1, tagline: "x".repeat(31) },
  ];
  for (const command of invalidCommands) {
    await expect(service.updateProfile(actor, command)).rejects.toBeInstanceOf(TenantProfileValidationError);
  }
  await expect(
    service.updateProfile(
      { ...actor, tenantIds: ["tenant"] },
      { tenantId: "tenant", expectedVersion: 1, shortName: "Mesa" },
    ),
  ).rejects.toBeInstanceOf(TenantProfileValidationError);
  expect(calls).toHaveLength(0);
});
