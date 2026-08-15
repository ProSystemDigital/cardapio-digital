import { expect, test } from "@playwright/test";
import { AuthorizationService, AccessDeniedError } from "../../application/authorization-service";
import { AuthorizedCatalogAdministrationService } from "../../application/authorized-catalog-administration-service";
import { CatalogAdministrationService } from "../../application/catalog-administration-service";
import type { AuthorizationRepository } from "../../data/authorization-repository";
import type { CatalogCommandRepository } from "../../data/catalog-command-repository";

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

  const manager = new AuthorizationService(authorizationRepository("manager"));
  await expect(
    manager.authorizeTenant({ principalId }, tenantId, "catalog.product.update"),
  ).resolves.toMatchObject({ role: "manager" });
  await expect(
    manager.authorizeTenant({ principalId }, tenantId, "tenant.memberships.manage"),
  ).rejects.toBeInstanceOf(AccessDeniedError);

  const platform = new AuthorizationService(authorizationRepository(null, true));
  await expect(
    platform.authorizePlatform({ principalId }, "platform.tenants.read"),
  ).resolves.toMatchObject({ role: "platform_admin" });
  await expect(
    platform.authorizeTenant({ principalId }, tenantId, "catalog.product.update"),
  ).rejects.toBeInstanceOf(AccessDeniedError);
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
