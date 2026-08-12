import { expect, test } from "@playwright/test";
import {
  ALL_CATEGORIES,
  changeCartQuantity,
  filterProducts,
  getCartItemCount,
  getCartSubtotalInCents,
} from "../../domain/cart";
import { isCatalogScopedToTenant } from "../../domain/catalog";
import {
  casaDoPortoCatalog,
  mesaVivaCatalog,
} from "../../data/demo-catalogs";
import { InMemoryCatalogRepository } from "../../data/catalog-repository";

test("o catálogo demonstrativo respeita o escopo do tenant", () => {
  expect(isCatalogScopedToTenant(mesaVivaCatalog)).toBe(true);
  expect(isCatalogScopedToTenant(casaDoPortoCatalog)).toBe(true);
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

test("altera quantidades e remove itens zerados", () => {
  const withTwoItems = changeCartQuantity({}, "burger", 2);
  expect(getCartItemCount(withTwoItems)).toBe(2);

  const emptyCart = changeCartQuantity(withTwoItems, "burger", -2);
  expect(emptyCart).toEqual({});
});

test("calcula subtotal em centavos sem aritmética de ponto flutuante", () => {
  const cart = { burger: 2, limonada: 1 };
  expect(getCartSubtotalInCents(mesaVivaCatalog.products, cart)).toBe(10_200);
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
    "Catálogo rejeitado por violar o escopo do tenant.",
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
