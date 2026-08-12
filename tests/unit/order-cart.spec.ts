import { expect, test } from "@playwright/test";
import { casaDoPortoCatalog, mesaVivaCatalog } from "../../data/demo-catalogs";
import {
  addOrMergeCartLine,
  changeLineQuantity,
  createCartLine,
  getLineItemCount,
  getLinesSubtotalInCents,
  replaceCartLine,
} from "../../domain/order-cart";

test("cria linha simples recalculando o preço pelo catálogo", () => {
  const result = createCartLine(
    mesaVivaCatalog,
    { tenantId: "tenant-mesa-viva", productId: "limonada", addonIds: [] },
    "line-1",
  );

  expect(result).toEqual({
    ok: true,
    line: {
      id: "line-1",
      tenantId: "tenant-mesa-viva",
      productId: "limonada",
      variationId: undefined,
      addonIds: [],
      quantity: 1,
      unitPriceInCents: 1400,
    },
  });
});

test("exige variação e calcula variação e adicionais em centavos", () => {
  const missingVariation = createCartLine(
    mesaVivaCatalog,
    { tenantId: "tenant-mesa-viva", productId: "nhoque", addonIds: [] },
    "line-1",
  );
  expect(missingVariation).toMatchObject({ ok: false, errors: ["Selecione uma variação."] });

  const customizedBurger = createCartLine(
    mesaVivaCatalog,
    { tenantId: "tenant-mesa-viva", productId: "burger", addonIds: ["bacon", "queijo"] },
    "line-2",
  );
  expect(customizedBurger).toMatchObject({ ok: true, line: { unitPriceInCents: 5500 } });
});

test("rejeita limite, opção desconhecida, indisponibilidade e outro tenant", () => {
  const tooManyAddons = createCartLine(
    mesaVivaCatalog,
    { tenantId: "tenant-mesa-viva", productId: "burger", addonIds: ["bacon", "queijo", "desconhecido"] },
    "line-1",
  );
  expect(tooManyAddons).toMatchObject({ ok: false });

  const unavailableCatalog = {
    ...mesaVivaCatalog,
    products: mesaVivaCatalog.products.map((product) =>
      product.id === "limonada" ? { ...product, isAvailable: false } : product,
    ),
  };
  expect(createCartLine(unavailableCatalog, { tenantId: "tenant-mesa-viva", productId: "limonada", addonIds: [] }, "line-2")).toMatchObject({ ok: false, errors: ["O produto está indisponível."] });

  expect(createCartLine(mesaVivaCatalog, { tenantId: casaDoPortoCatalog.tenant.id, productId: "limonada", addonIds: [] }, "line-3")).toMatchObject({ ok: false, errors: ["A seleção pertence a outro tenant."] });

  const restrictedCatalog = {
    ...mesaVivaCatalog,
    products: mesaVivaCatalog.products.map((product) =>
      product.id === "burger"
        ? {
            ...product,
            addonGroups: product.addonGroups?.map((group) => ({
              ...group,
              minimumSelections: 1,
              maximumSelections: 1,
              addons: group.addons.map((addon) =>
                addon.id === "bacon" ? { ...addon, isAvailable: false } : addon,
              ),
            })),
          }
        : product,
    ),
  };
  const restricted = createCartLine(
    restrictedCatalog,
    { tenantId: "tenant-mesa-viva", productId: "burger", addonIds: ["bacon", "queijo"] },
    "line-4",
  );
  expect(restricted).toMatchObject({
    ok: false,
    errors: expect.arrayContaining([
      "Adicionais exige de 1 a 1 seleção(ões).",
      "Há adicional indisponível em Adicionais.",
    ]),
  });
});

test("mescla configurações iguais e mantém configurações diferentes", () => {
  const bacon = createCartLine(mesaVivaCatalog, { tenantId: "tenant-mesa-viva", productId: "burger", addonIds: ["bacon"] }, "bacon-1");
  const baconAgain = createCartLine(mesaVivaCatalog, { tenantId: "tenant-mesa-viva", productId: "burger", addonIds: ["bacon"] }, "bacon-2");
  const cheese = createCartLine(mesaVivaCatalog, { tenantId: "tenant-mesa-viva", productId: "burger", addonIds: ["queijo"] }, "cheese-1");
  if (!bacon.ok || !baconAgain.ok || !cheese.ok) throw new Error("Fixture inválida");

  const lines = addOrMergeCartLine(addOrMergeCartLine([bacon.line], baconAgain.line), cheese.line);
  expect(lines).toHaveLength(2);
  expect(lines[0].quantity).toBe(2);
  expect(getLineItemCount(lines)).toBe(3);
  expect(getLinesSubtotalInCents(lines)).toBe(14_900);
});

test("edita, altera quantidade e remove uma linha", () => {
  const original = createCartLine(mesaVivaCatalog, { tenantId: "tenant-mesa-viva", productId: "burger", addonIds: ["bacon"] }, "line-1");
  const edited = createCartLine(mesaVivaCatalog, { tenantId: "tenant-mesa-viva", productId: "burger", addonIds: ["queijo"] }, "line-1");
  if (!original.ok || !edited.ok) throw new Error("Fixture inválida");

  const replaced = replaceCartLine([original.line], edited.line);
  expect(replaced[0].unitPriceInCents).toBe(4900);
  const increased = changeLineQuantity(replaced, "line-1", 2);
  expect(increased[0].quantity).toBe(3);
  expect(changeLineQuantity(increased, "line-1", -3)).toEqual([]);
});
