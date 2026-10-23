import { expect, test } from "@playwright/test";
import { ProductCreationService } from "../../application/product-creation-service";
import type { ProductCreationRepository } from "../../data/product-creation-repository";
import {
  CatalogAuthorizationError,
  type CatalogActor,
} from "../../domain/catalog-administration";
import {
  ProductCreationValidationError,
  type CreateProductCommand,
} from "../../domain/product-creation";

const tenantId = "10000000-0000-0000-0000-000000000001";
const categoryId = "30000000-0000-4000-8000-000000000001";
const productId = "12000000-0000-4000-8000-000000000099";
const actor: CatalogActor = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  role: "owner",
  tenantIds: [tenantId],
};
const command: CreateProductCommand = {
  tenantId,
  categoryId,
  name: "Pizza de abobrinha",
  description: "Massa artesanal e abobrinha assada.",
  priceInCents: 5_500,
  isAvailable: true,
  fulfillmentModes: ["delivery", "pickup"],
};

function createService() {
  const calls: Array<{ actor: CatalogActor; command: CreateProductCommand }> = [];
  const repository: ProductCreationRepository = {
    async createProduct(receivedActor, receivedCommand) {
      calls.push({ actor: receivedActor, command: receivedCommand });
      return { tenantId, productId, version: 1, isAvailable: receivedCommand.isAvailable };
    },
  };
  return { service: new ProductCreationService(repository), calls };
}

test("cria produto com a disponibilidade solicitada sem aceitar ID, slug, imagem ou personalizações", async () => {
  const { service, calls } = createService();
  await expect(service.createProduct(actor, command)).resolves.toEqual({
    tenantId,
    productId,
    version: 1,
    isAvailable: true,
  });
  expect(command).not.toHaveProperty("productId");
  expect(command).not.toHaveProperty("slug");
  expect(command).toHaveProperty("isAvailable", true);
  expect(command).not.toHaveProperty("image");
  expect(command).not.toHaveProperty("variations");
  expect(command).not.toHaveProperty("addonGroups");
  expect(calls).toHaveLength(1);
});

test("aceita proprietário e gerente vinculados", async () => {
  for (const role of ["owner", "manager"] as const) {
    const { service, calls } = createService();
    await expect(service.createProduct({ ...actor, role }, command)).resolves.toMatchObject({
      version: 1,
      isAvailable: true,
    });
    expect(calls).toHaveLength(1);
  }
});

test("rejeita contexto, conteúdo, preço, categoria e modalidades antes da porta", async () => {
  const { service, calls } = createService();
  const invalid: CreateProductCommand[] = [
    { ...command, tenantId: "tenant" },
    { ...command, categoryId: "categoria" },
    { ...command, name: " " },
    { ...command, name: "x".repeat(121) },
    { ...command, description: "x".repeat(501) },
    { ...command, priceInCents: -1 },
    { ...command, priceInCents: 100_000_000 },
    { ...command, priceInCents: 1.5 },
    { ...command, isAvailable: true, fulfillmentModes: [] },
    { ...command, fulfillmentModes: ["delivery", "delivery"] },
    { ...command, fulfillmentModes: ["delivery", "invalid" as "pickup"] },
  ];
  for (const candidate of invalid) {
    const candidateActor = candidate.tenantId === tenantId
      ? actor
      : { ...actor, tenantIds: [candidate.tenantId] };
    await expect(service.createProduct(candidateActor, candidate)).rejects.toBeInstanceOf(
      ProductCreationValidationError,
    );
  }
  await expect(service.createProduct({ ...actor, tenantIds: [] }, command)).rejects.toBeInstanceOf(
    CatalogAuthorizationError,
  );
  await expect(service.createProduct({ ...actor, role: "platform_admin" }, command)).rejects.toBeInstanceOf(
    CatalogAuthorizationError,
  );
  expect(calls).toHaveLength(0);
});
