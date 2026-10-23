import { expect, test } from "@playwright/test";
import { AuthorizationService, AccessDeniedError } from "../../application/authorization-service";
import { AuthorizedCatalogAdministrationService } from "../../application/authorized-catalog-administration-service";
import { CatalogAdministrationService } from "../../application/catalog-administration-service";
import type { AuthorizationRepository } from "../../data/authorization-repository";
import type { CatalogCommandRepository } from "../../data/catalog-command-repository";
import { AuthorizedTenantProfileAdministrationService } from "../../application/authorized-tenant-profile-administration-service";
import { TenantProfileAdministrationService } from "../../application/tenant-profile-administration-service";
import type { TenantProfileCommandRepository } from "../../data/tenant-profile-command-repository";
import { AuthorizedCategoryAdministrationService } from "../../application/authorized-category-administration-service";
import { CategoryAdministrationService } from "../../application/category-administration-service";
import type { CategoryCommandRepository } from "../../data/category-command-repository";
import { AuthorizedCategoryCreationService } from "../../application/authorized-category-creation-service";
import { CategoryCreationService } from "../../application/category-creation-service";
import type { CategoryCreationRepository } from "../../data/category-creation-repository";
import { AuthorizedTenantFulfillmentAdministrationService } from "../../application/authorized-tenant-fulfillment-administration-service";
import { TenantFulfillmentAdministrationService } from "../../application/tenant-fulfillment-administration-service";
import type { TenantFulfillmentCommandRepository } from "../../data/tenant-fulfillment-command-repository";
import { AuthorizedProductCreationService } from "../../application/authorized-product-creation-service";
import { ProductCreationService } from "../../application/product-creation-service";
import type { ProductCreationRepository } from "../../data/product-creation-repository";

const principalId = "41000000-0000-4000-8000-000000000001";
const tenantId = "30000000-0000-0000-0000-000000000003";

function authorizationRepository(
  tenantRole: "owner" | "manager" | null,
  platform = false,
): AuthorizationRepository {
  return {
    async listTenantAccess(receivedPrincipalId) {
      return tenantRole
        ? [{ principalId: receivedPrincipalId, tenantId, role: tenantRole }]
        : [];
    },
    async resolveTenantAccess(receivedPrincipalId, receivedTenantId) {
      return tenantRole
        ? { principalId: receivedPrincipalId, tenantId: receivedTenantId, role: tenantRole }
        : null;
    },
    async resolvePlatformAccess(receivedPrincipalId) {
      return platform ? { principalId: receivedPrincipalId, role: "platform_admin" } : null;
    },
  };
}

test("matriz diferencia proprietário, gerente e administrador da plataforma", async () => {
  const owner = new AuthorizationService(authorizationRepository("owner"));
  await expect(
    owner.authorizeTenant({ principalId }, tenantId, "tenant.memberships.manage"),
  ).resolves.toMatchObject({ role: "owner" });
  await expect(
    owner.authorizeTenant({ principalId }, tenantId, "catalog.product.archive"),
  ).resolves.toMatchObject({ role: "owner" });
  await expect(
    owner.authorizeTenant({ principalId }, tenantId, "catalog.category.archive"),
  ).resolves.toMatchObject({ role: "owner" });

  const manager = new AuthorizationService(authorizationRepository("manager"));
  await expect(
    manager.authorizeTenant({ principalId }, tenantId, "catalog.product.update"),
  ).resolves.toMatchObject({ role: "manager" });
  await expect(
    manager.authorizeTenant({ principalId }, tenantId, "catalog.image.update"),
  ).resolves.toMatchObject({ role: "manager" });
  await expect(
    manager.authorizeTenant({ principalId }, tenantId, "tenant.profile.update"),
  ).resolves.toMatchObject({ role: "manager" });
  await expect(
    manager.authorizeTenant({ principalId }, tenantId, "tenant.memberships.manage"),
  ).rejects.toBeInstanceOf(AccessDeniedError);
  await expect(
    manager.authorizeTenant({ principalId }, tenantId, "catalog.product.archive"),
  ).rejects.toBeInstanceOf(AccessDeniedError);
  await expect(
    manager.authorizeTenant({ principalId }, tenantId, "catalog.category.archive"),
  ).rejects.toBeInstanceOf(AccessDeniedError);

  const platform = new AuthorizationService(authorizationRepository(null, true));
  await expect(
    platform.authorizePlatform({ principalId }, "platform.tenants.read"),
  ).resolves.toMatchObject({ role: "platform_admin" });
  await expect(
    platform.authorizeTenant({ principalId }, tenantId, "catalog.product.update"),
  ).rejects.toBeInstanceOf(AccessDeniedError);
});

test("composição do perfil deriva ator e permissão específica antes da escrita", async () => {
  const calls: unknown[] = [];
  const repository: TenantProfileCommandRepository = {
    async updateProfile(actor, command) {
      calls.push({ actor, command });
      return { tenantId: command.tenantId, version: 2 };
    },
  };
  const service = new AuthorizedTenantProfileAdministrationService(
    new AuthorizationService(authorizationRepository("manager")),
    new TenantProfileAdministrationService(repository),
  );
  const command = { tenantId, expectedVersion: 1, shortName: "Mesa", tagline: "Sabor" };

  await expect(service.updateProfile({ principalId }, command)).resolves.toEqual({
    tenantId,
    version: 2,
  });
  expect(calls).toEqual([{
    actor: { id: principalId, role: "manager", tenantIds: [tenantId] },
    command,
  }]);
});

test("composição do perfil não chama repositório sem membership", async () => {
  let called = false;
  const repository: TenantProfileCommandRepository = {
    async updateProfile(_actor, command) {
      called = true;
      return { tenantId: command.tenantId, version: 2 };
    },
  };
  const service = new AuthorizedTenantProfileAdministrationService(
    new AuthorizationService(authorizationRepository(null)),
    new TenantProfileAdministrationService(repository),
  );
  await expect(service.updateProfile(
    { principalId },
    { tenantId, expectedVersion: 1, shortName: "Mesa" },
  )).rejects.toBeInstanceOf(AccessDeniedError);
  expect(called).toBe(false);
});

test("composição de categoria deriva ator e permissão específica antes da escrita", async () => {
  const calls: unknown[] = [];
  const repository: CategoryCommandRepository = {
    async archiveCategory(actor, command) { calls.push({ actor, command }); return { tenantId: command.tenantId, categoryId: command.categoryId, version: command.expectedVersion + 1 }; },
    async updateCategory(actor, command) {
      calls.push({ actor, command });
      return { tenantId: command.tenantId, categoryId: command.categoryId, version: 2 };
    },
  };
  const service = new AuthorizedCategoryAdministrationService(
    new AuthorizationService(authorizationRepository("manager")),
    new CategoryAdministrationService(repository),
  );
  const command = {
    tenantId,
    categoryId: "31000000-0000-0000-0000-000000000003",
    expectedVersion: 1,
    name: "Principais",
  };
  await expect(service.updateCategory({ principalId }, command)).resolves.toEqual({
    tenantId,
    categoryId: command.categoryId,
    version: 2,
  });
  expect(calls).toEqual([{
    actor: { id: principalId, role: "manager", tenantIds: [tenantId] },
    command,
  }]);
});

test("composição de categoria não chama repositório sem membership", async () => {
  let called = false;
  const repository: CategoryCommandRepository = {
    async archiveCategory(_actor, command) { called = true; return { tenantId: command.tenantId, categoryId: command.categoryId, version: command.expectedVersion + 1 }; },
    async updateCategory(_actor, command) {
      called = true;
      return { tenantId: command.tenantId, categoryId: command.categoryId, version: 2 };
    },
  };
  const service = new AuthorizedCategoryAdministrationService(
    new AuthorizationService(authorizationRepository(null)),
    new CategoryAdministrationService(repository),
  );
  await expect(service.updateCategory({ principalId }, {
    tenantId,
    categoryId: "31000000-0000-0000-0000-000000000003",
    expectedVersion: 1,
    name: "Principais",
  })).rejects.toBeInstanceOf(AccessDeniedError);
  expect(called).toBe(false);
});

test("composição de criação deriva ator e permissão específica antes da inserção", async () => {
  const calls: unknown[] = [];
  const repository: CategoryCreationRepository = {
    async createCategory(actor, command) {
      calls.push({ actor, command });
      return {
        tenantId: command.tenantId,
        categoryId: "31000000-0000-0000-0000-000000000004",
        version: 1,
      };
    },
  };
  const service = new AuthorizedCategoryCreationService(
    new AuthorizationService(authorizationRepository("manager")),
    new CategoryCreationService(repository),
  );
  const command = { tenantId, name: "Bebidas", sortOrder: 3 };

  await expect(service.createCategory({ principalId }, command)).resolves.toMatchObject({
    tenantId,
    version: 1,
  });
  expect(calls).toEqual([{
    actor: { id: principalId, role: "manager", tenantIds: [tenantId] },
    command,
  }]);
});

test("composição de criação não insere sem membership", async () => {
  let called = false;
  const repository: CategoryCreationRepository = {
    async createCategory(_actor, command) {
      called = true;
      return {
        tenantId: command.tenantId,
        categoryId: "31000000-0000-0000-0000-000000000004",
        version: 1,
      };
    },
  };
  const service = new AuthorizedCategoryCreationService(
    new AuthorizationService(authorizationRepository(null)),
    new CategoryCreationService(repository),
  );

  await expect(service.createCategory(
    { principalId },
    { tenantId, name: "Bebidas", sortOrder: 3 },
  )).rejects.toBeInstanceOf(AccessDeniedError);
  expect(called).toBe(false);
});

test("composição de produto deriva ator e permissão antes da inserção", async () => {
  const calls: unknown[] = [];
  const repository: ProductCreationRepository = {
    async createProduct(actor, command) {
      calls.push({ actor, command });
      return { tenantId: command.tenantId, productId: "32000000-0000-0000-0000-000000000010", version: 1, isAvailable: false };
    },
  };
  const service = new AuthorizedProductCreationService(
    new AuthorizationService(authorizationRepository("manager")),
    new ProductCreationService(repository),
  );
  const command = {
    tenantId,
    categoryId: "31000000-0000-0000-0000-000000000003",
    name: "Produto novo",
    description: "Descrição pública",
    priceInCents: 2500,
    isAvailable: false,
    fulfillmentModes: ["pickup"] as const,
  };
  await expect(service.createProduct({ principalId }, command)).resolves.toMatchObject({
    tenantId, version: 1, isAvailable: false,
  });
  expect(calls).toEqual([{ actor: { id: principalId, role: "manager", tenantIds: [tenantId] }, command }]);
});

test("composição de produto não insere sem membership", async () => {
  let called = false;
  const repository: ProductCreationRepository = {
    async createProduct(_actor, command) {
      called = true;
      return { tenantId: command.tenantId, productId: "32000000-0000-0000-0000-000000000010", version: 1, isAvailable: false };
    },
  };
  const service = new AuthorizedProductCreationService(
    new AuthorizationService(authorizationRepository(null)),
    new ProductCreationService(repository),
  );
  await expect(service.createProduct({ principalId }, {
    tenantId,
    categoryId: "31000000-0000-0000-0000-000000000003",
    name: "Produto novo",
    description: "",
    priceInCents: 2500,
    isAvailable: false,
    fulfillmentModes: ["pickup"],
  })).rejects.toBeInstanceOf(AccessDeniedError);
  expect(called).toBe(false);
});

test("composição de modalidade do tenant deriva ator e permissão específica", async () => {
  const calls: unknown[] = [];
  const repository: TenantFulfillmentCommandRepository = {
    async enableMode(actor, command) {
      calls.push({ actor, command });
      return command;
    },
  };
  const service = new AuthorizedTenantFulfillmentAdministrationService(
    new AuthorizationService(authorizationRepository("manager")),
    new TenantFulfillmentAdministrationService(repository),
  );
  const command = {
    tenantId,
    mode: "dine_in" as const,
    initialProductIds: ["32000000-0000-0000-0000-000000000003"],
  };

  await expect(service.enableMode({ principalId }, command)).resolves.toEqual(command);
  expect(calls).toEqual([{
    actor: { id: principalId, role: "manager", tenantIds: [tenantId] },
    command,
  }]);
});

test("composição de modalidade não chama repositório sem membership", async () => {
  let called = false;
  const repository: TenantFulfillmentCommandRepository = {
    async enableMode(_actor, command) {
      called = true;
      return command;
    },
  };
  const service = new AuthorizedTenantFulfillmentAdministrationService(
    new AuthorizationService(authorizationRepository(null)),
    new TenantFulfillmentAdministrationService(repository),
  );

  await expect(service.enableMode({ principalId }, {
    tenantId,
    mode: "dine_in",
    initialProductIds: ["32000000-0000-0000-0000-000000000003"],
  })).rejects.toBeInstanceOf(AccessDeniedError);
  expect(called).toBe(false);
});

test("comando deriva ator da autorização e não da entrada do navegador", async () => {
  const calls: unknown[] = [];
  const commandRepository: CatalogCommandRepository = {
    async updateProduct(actor, command) {
      calls.push({ actor, command });
      return { productId: command.productId, version: 2 };
    },
  };
  const service = new AuthorizedCatalogAdministrationService(
    new AuthorizationService(authorizationRepository("manager")),
    new CatalogAdministrationService(commandRepository),
  );
  const command = {
    tenantId,
    productId: "32000000-0000-0000-0000-000000000003",
    expectedVersion: 1,
    isAvailable: false,
  };

  await service.updateProduct({ principalId }, command);
  expect(calls).toEqual([{
    actor: { id: principalId, role: "manager", tenantIds: [tenantId] },
    command,
  }]);
});

test("ausência ou revogação da membership impede o repositório de escrita", async () => {
  const catalogCalls: unknown[] = [];
  const commandRepository: CatalogCommandRepository = {
    async updateProduct(actor, command) {
      catalogCalls.push([actor, command]);
      return { productId: command.productId, version: 2 };
    },
  };
  const service = new AuthorizedCatalogAdministrationService(
    new AuthorizationService(authorizationRepository(null)),
    new CatalogAdministrationService(commandRepository),
  );

  await expect(service.updateProduct({ principalId }, {
    tenantId,
    productId: "32000000-0000-0000-0000-000000000003",
    expectedVersion: 1,
    isAvailable: false,
  })).rejects.toBeInstanceOf(AccessDeniedError);
  expect(catalogCalls).toHaveLength(0);
});

test("identidade técnica inválida falha antes de consultar permissões", async () => {
  let repositoryCalled = false;
  const repository = authorizationRepository("owner");
  const guardedRepository: AuthorizationRepository = {
    async listTenantAccess(...args) {
      repositoryCalled = true;
      return repository.listTenantAccess(...args);
    },
    async resolveTenantAccess(...args) {
      repositoryCalled = true;
      return repository.resolveTenantAccess(...args);
    },
    async resolvePlatformAccess(...args) {
      repositoryCalled = true;
      return repository.resolvePlatformAccess(...args);
    },
  };
  const service = new AuthorizationService(guardedRepository);
  await expect(
    service.authorizeTenant({ principalId: "forjado" }, tenantId, "catalog.read"),
  ).rejects.toBeInstanceOf(AccessDeniedError);
  expect(repositoryCalled).toBe(false);
});

test("lista somente memberships internas para identidade válida", async () => {
  const service = new AuthorizationService(authorizationRepository("owner"));
  await expect(service.listTenantAccess({ principalId })).resolves.toEqual([
    { principalId, tenantId, role: "owner" },
  ]);
  await expect(service.listTenantAccess({ principalId: "forjado" }))
    .rejects.toBeInstanceOf(AccessDeniedError);
});
