import { expect, test } from "@playwright/test";
import { CategoryAdministrationService } from "../../application/category-administration-service";
import { CategoryCreationService } from "../../application/category-creation-service";
import type { CategoryCommandRepository } from "../../data/category-command-repository";
import type { CategoryCreationRepository } from "../../data/category-creation-repository";
import {
  CategoryAuthorizationError,
  CategoryValidationError,
  type CategoryActor,
  type CreateCategoryCommand,
  type UpdateCategoryCommand,
} from "../../domain/category-administration";

const tenantId = "10000000-0000-0000-0000-000000000001";
const categoryId = "30000000-0000-4000-8000-000000000001";
const actor: CategoryActor = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  role: "owner",
  tenantIds: [tenantId],
};

function createService() {
  const calls: Array<{ actor: CategoryActor; command: UpdateCategoryCommand }> = [];
  const repository: CategoryCommandRepository = {
    async archiveCategory(receivedActor, receivedCommand) {
      calls.push({ actor: receivedActor, command: receivedCommand });
      return { tenantId, categoryId, version: receivedCommand.expectedVersion + 1 };
    },
    async updateCategory(receivedActor, command) {
      calls.push({ actor: receivedActor, command });
      return {
        tenantId: command.tenantId,
        categoryId: command.categoryId,
        version: command.expectedVersion + 1,
      };
    },
  };
  return { service: new CategoryAdministrationService(repository), calls };
}

test("cria categorias sucessivas pelo contrato sem aceitar identificador ou slug", async () => {
  const calls: unknown[] = [];
  const repository: CategoryCreationRepository = {
    async createCategory(receivedActor, receivedCommand) {
      calls.push({ actor: receivedActor, command: receivedCommand });
      return {
        tenantId: receivedCommand.tenantId,
        categoryId: "30000000-0000-4000-8000-000000000099",
        version: 1,
      };
    },
  };
  const service = new CategoryCreationService(repository);
  const command: CreateCategoryCommand = { tenantId, name: "Bebidas", sortOrder: 3 };
  await expect(service.createCategory(actor, command)).resolves.toEqual({
    tenantId,
    categoryId: "30000000-0000-4000-8000-000000000099",
    version: 1,
  });
  expect(command).not.toHaveProperty("categoryId");
  expect(command).not.toHaveProperty("slug");
  expect(calls).toHaveLength(1);
});

test("rejeita criação de categoria inválida ou sem autorização antes do repositório", async () => {
  let called = false;
  const service = new CategoryCreationService({
    async createCategory(_actor, command) {
      called = true;
      return { tenantId: command.tenantId, categoryId, version: 1 };
    },
  });
  const invalid: CreateCategoryCommand[] = [
    { tenantId, name: " ", sortOrder: 1 },
    { tenantId, name: "x".repeat(81), sortOrder: 1 },
    { tenantId, name: "Bebidas", sortOrder: -1 },
    { tenantId, name: "Bebidas", sortOrder: 10_001 },
  ];
  for (const command of invalid) {
    await expect(service.createCategory(actor, command)).rejects.toBeInstanceOf(CategoryValidationError);
  }
  await expect(
    service.createCategory({ ...actor, tenantIds: [] }, { tenantId, name: "Bebidas", sortOrder: 1 }),
  ).rejects.toBeInstanceOf(CategoryAuthorizationError);
  expect(called).toBe(false);
});

test("autoriza proprietário ou gerente e preserva categoria e versão", async () => {
  for (const role of ["owner", "manager"] as const) {
    const { service, calls } = createService();
    const result = await service.updateCategory(
      { ...actor, role },
      { tenantId, categoryId, expectedVersion: 2, name: "Principais", sortOrder: 1 },
    );
    expect(result).toEqual({ tenantId, categoryId, version: 3 });
    expect(calls).toHaveLength(1);
  }
});

test("nega administrador da plataforma, outro tenant e ator inválido", async () => {
  const { service } = createService();
  const command = { tenantId, categoryId, expectedVersion: 1, name: "Principais" };
  await expect(service.updateCategory({ ...actor, role: "platform_admin" }, command)).rejects.toBeInstanceOf(CategoryAuthorizationError);
  await expect(service.updateCategory({ ...actor, tenantIds: [] }, command)).rejects.toBeInstanceOf(CategoryAuthorizationError);
  await expect(service.updateCategory({ ...actor, id: "cliente" }, command)).rejects.toBeInstanceOf(CategoryAuthorizationError);
});

test("rejeita identificadores, versão, nome e ordem inválidos antes do repositório", async () => {
  const { service, calls } = createService();
  const invalidCommands: UpdateCategoryCommand[] = [
    { tenantId, categoryId, expectedVersion: 0, name: "Principais" },
    { tenantId, categoryId, expectedVersion: 1 },
    { tenantId, categoryId, expectedVersion: 1, name: " " },
    { tenantId, categoryId, expectedVersion: 1, name: "x".repeat(81) },
    { tenantId, categoryId, expectedVersion: 1, sortOrder: -1 },
    { tenantId, categoryId, expectedVersion: 1, sortOrder: 10_001 },
    { tenantId, categoryId, expectedVersion: 1, sortOrder: 1.5 },
    { tenantId, categoryId: "categoria", expectedVersion: 1, name: "Principais" },
  ];
  for (const command of invalidCommands) {
    await expect(service.updateCategory(actor, command)).rejects.toBeInstanceOf(CategoryValidationError);
  }
  await expect(
    service.updateCategory(
      { ...actor, tenantIds: ["tenant"] },
      { tenantId: "tenant", categoryId, expectedVersion: 1, name: "Principais" },
    ),
  ).rejects.toBeInstanceOf(CategoryValidationError);
  expect(calls).toHaveLength(0);
});
