import { expect, test } from "@playwright/test";
import {
  ALL_CATEGORIES,
  filterProducts,
} from "../../domain/cart";
import { isCatalogScopedToTenant } from "../../domain/catalog";
import { validateCatalog } from "../../domain/catalog-validation";
import {
  casaDoPortoCatalog,
  mesaVivaCatalog,
} from "../../data/demo-catalogs";
import { InMemoryCatalogRepository } from "../../data/catalog-repository";

test("o catálogo demonstrativo respeita o escopo do tenant", () => {
  expect(isCatalogScopedToTenant(mesaVivaCatalog)).toBe(true);
  expect(isCatalogScopedToTenant(casaDoPortoCatalog)).toBe(true);
  expect(validateCatalog(mesaVivaCatalog)).toEqual([]);
  expect(validateCatalog(casaDoPortoCatalog)).toEqual([]);
});

test("filtra somente produtos disponíveis por categoria e busca", () => {
  const beverages = filterProducts(mesaVivaCatalog.products, "bebidas", "mate");
  expect(beverages.map((product) => product.id)).toEqual(["cha-mate"]);

  const unavailableProduct = {
    ...mesaVivaCatalog.products[0],
    id: "produto-indisponivel",
    isAvailable: false,
  };
  expect(
    filterProducts([...mesaVivaCatalog.products, unavailableProduct], ALL_CATEGORIES, ""),
  ).not.toContainEqual(unavailableProduct);
});

test("resolve somente o catálogo associado ao slug solicitado", async () => {
  const repository = new InMemoryCatalogRepository([
    mesaVivaCatalog,
    casaDoPortoCatalog,
  ]);

  const mesaViva = await repository.findByTenantSlug("mesa-viva");
  const casaDoPorto = await repository.findByTenantSlug("casa-do-porto");

  expect(mesaViva?.tenant.id).toBe("tenant-mesa-viva");
  expect(mesaViva?.products.some((product) => product.tenantId === "tenant-casa-do-porto")).toBe(false);
  expect(casaDoPorto?.tenant.id).toBe("tenant-casa-do-porto");
  expect(casaDoPorto?.products.some((product) => product.tenantId === "tenant-mesa-viva")).toBe(false);
  expect(await repository.findByTenantSlug("tenant-inexistente")).toBeNull();
});

test("rejeita a inicialização com catálogo fora do escopo do tenant", () => {
  const invalidCatalog = {
    ...mesaVivaCatalog,
    products: [
      {
        ...mesaVivaCatalog.products[0],
        tenantId: "tenant-casa-do-porto",
      },
    ],
  };

  expect(() => new InMemoryCatalogRepository([invalidCatalog])).toThrow(
    "Produto burrata pertence a outro tenant.",
  );
});

test("rejeita slug duplicado para não ocultar um tenant", () => {
  const duplicateSlugCatalog = {
    ...casaDoPortoCatalog,
    tenant: {
      ...casaDoPortoCatalog.tenant,
      slug: mesaVivaCatalog.tenant.slug,
    },
  };

  expect(
    () => new InMemoryCatalogRepository([mesaVivaCatalog, duplicateSlugCatalog]),
  ).toThrow("Catálogo rejeitado por possuir slug de tenant duplicado.");
});

test("rejeita modalidades e valores operacionais inválidos", () => {
  const invalidCatalog = {
    ...casaDoPortoCatalog,
    tenant: {
      ...casaDoPortoCatalog.tenant,
      operations: {
        ...casaDoPortoCatalog.tenant.operations,
        minimumOrderInCents: -1,
      },
    },
    products: [
      {
        ...casaDoPortoCatalog.products[0],
        fulfillmentModes: ["delivery" as const],
      },
    ],
  };

  expect(validateCatalog(invalidCatalog)).toEqual(
    expect.arrayContaining([
      "Pedido mínimo não pode ser negativo.",
      "Produto bolinho-bacalhau usa modalidade não habilitada pelo tenant.",
    ]),
  );
});

test("rejeita variações e grupos de adicionais inconsistentes", () => {
  const invalidProduct = {
    ...mesaVivaCatalog.products[4],
    variations: [
      { id: "invalida", name: "Inválida", priceDeltaInCents: -5000, isAvailable: true },
    ],
    addonGroups: [
      {
        id: "extras",
        name: "Extras",
        minimumSelections: 2,
        maximumSelections: 1,
        addons: [{ id: "extra", name: "Extra", priceInCents: -100, isAvailable: true }],
      },
    ],
  };
  const invalidCatalog = {
    ...mesaVivaCatalog,
    products: [invalidProduct],
  };

  expect(validateCatalog(invalidCatalog)).toEqual(
    expect.arrayContaining([
      "Variação invalida resulta em preço negativo.",
      "Limites inválidos no grupo extras de burger.",
      "Adicional extra possui preço negativo.",
    ]),
  );
});
