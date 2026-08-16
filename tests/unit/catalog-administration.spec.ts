import { expect, test } from "@playwright/test";
import { CatalogAdministrationService } from "../../application/catalog-administration-service";
import type { CatalogCommandRepository } from "../../data/catalog-command-repository";
import {
  CatalogAuthorizationError,
  CatalogValidationError,
  type CatalogActor,
  type UpdateProductCommand,
} from "../../domain/catalog-administration";

const tenantId = "30000000-0000-0000-0000-000000000003";
const actor: CatalogActor = {
  id: "36000000-0000-4000-8000-000000000003",
  role: "manager",
  tenantIds: [tenantId],
};
const command: UpdateProductCommand = {
  tenantId,
  productId: "32000000-0000-0000-0000-000000000003",
  expectedVersion: 1,
  priceInCents: 2700,
  isAvailable: false,
};

function repositorySpy() {
  const calls: unknown[] = [];
  const repository: CatalogCommandRepository = {
    async updateProduct(receivedActor, receivedCommand) {
      calls.push([receivedActor, receivedCommand]);
      return { productId: receivedCommand.productId, version: 2 };
    },
  };
  return { calls, repository };
}

test("autoriza proprietário ou gerente vinculado ao tenant", async () => {
  for (const role of ["owner", "manager"] as const) {
    const spy = repositorySpy();
    const service = new CatalogAdministrationService(spy.repository);
    await expect(service.updateProduct({ ...actor, role }, command)).resolves.toEqual({
      productId: command.productId,
      version: 2,
    });
    expect(spy.calls).toHaveLength(1);
  }
});

test("nega outro tenant e administrador da plataforma por padrão", async () => {
  const spy = repositorySpy();
  const service = new CatalogAdministrationService(spy.repository);

  await expect(
    service.updateProduct({ ...actor, tenantIds: ["outro-tenant"] }, command),
  ).rejects.toBeInstanceOf(CatalogAuthorizationError);
  await expect(
    service.updateProduct({ ...actor, role: "platform_admin" }, command),
  ).rejects.toBeInstanceOf(CatalogAuthorizationError);
  expect(spy.calls).toHaveLength(0);
});

test("rejeita ator inválido, comando vazio, preço, conteúdo e versão inválidos", async () => {
  const service = new CatalogAdministrationService(repositorySpy().repository);
  await expect(service.updateProduct({ ...actor, id: "ator" }, command)).rejects.toBeInstanceOf(
    CatalogAuthorizationError,
  );

  for (const invalid of [
    { ...command, expectedVersion: 0 },
    { ...command, priceInCents: -1 },
    { ...command, priceInCents: 100_000_000 },
    { ...command, name: " " },
    { ...command, name: "x".repeat(121) },
    { ...command, description: "x".repeat(501) },
    { ...command, categoryId: "categoria" },
    { tenantId, productId: command.productId, expectedVersion: 1 },
  ]) {
    await expect(service.updateProduct(actor, invalid)).rejects.toBeInstanceOf(
      CatalogValidationError,
    );
  }
});

test("aceita nome e descrição dentro dos limites", async () => {
  const spy = repositorySpy();
  const service = new CatalogAdministrationService(spy.repository);
  await expect(service.updateProduct(actor, {
    tenantId,
    productId: command.productId,
    expectedVersion: 1,
    name: "Prato atualizado",
    description: "Descrição pública atualizada.",
  })).resolves.toEqual({ productId: command.productId, version: 2 });
  expect(spy.calls).toHaveLength(1);
});
