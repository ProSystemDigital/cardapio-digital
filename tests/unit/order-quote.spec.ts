import { expect, test } from "@playwright/test";
import { casaDoPortoCatalog, mesaVivaCatalog } from "../../data/demo-catalogs";
import { createCartLine, type CartLine } from "../../domain/order-cart";
import { calculateOrderQuote } from "../../domain/order-quote";

function createLine(productId: string, lineId: string): CartLine {
  const result = createCartLine(
    mesaVivaCatalog,
    { tenantId: mesaVivaCatalog.tenant.id, productId, addonIds: [] },
    lineId,
  );
  if (!result.ok) throw new Error(result.errors.join(" "));
  return result.line;
}

test("calcula mesa e retirada sem taxa", () => {
  const lines = [{ ...createLine("limonada", "line-1"), quantity: 3 }];

  for (const mode of ["dine_in", "pickup"] as const) {
    const quote = calculateOrderQuote(mesaVivaCatalog, lines, mode);
    expect(quote).toMatchObject({
      subtotalInCents: 4200,
      deliveryFeeInCents: 0,
      totalInCents: 4200,
      missingMinimumInCents: 0,
      incompatibleLineIds: [],
      canContinue: true,
    });
  }
});

test("aplica taxa somente à entrega e informa valor faltante", () => {
  const quote = calculateOrderQuote(
    mesaVivaCatalog,
    [createLine("limonada", "line-1")],
    "delivery",
  );

  expect(quote).toMatchObject({
    subtotalInCents: 1400,
    deliveryFeeInCents: 700,
    totalInCents: 2100,
    minimumOrderInCents: 3000,
    missingMinimumInCents: 1600,
    canContinue: false,
  });
});

test("identifica linhas incompatíveis com entrega", () => {
  const line = createLine("burrata", "line-burrata");
  const quote = calculateOrderQuote(mesaVivaCatalog, [line], "delivery");

  expect(quote.incompatibleLineIds).toEqual(["line-burrata"]);
  expect(quote.errors).toContain("Há itens incompatíveis com a modalidade selecionada.");
});

test("rejeita modalidade não habilitada pelo tenant", () => {
  const result = createCartLine(
    casaDoPortoCatalog,
    { tenantId: casaDoPortoCatalog.tenant.id, productId: "peixe-grelhado", variationId: "executivo", addonIds: [] },
    "line-1",
  );
  if (!result.ok) throw new Error(result.errors.join(" "));

  const quote = calculateOrderQuote(casaDoPortoCatalog, [result.line], "delivery");
  expect(quote.deliveryFeeInCents).toBe(0);
  expect(quote.errors).toContain("Modalidade não habilitada pelo estabelecimento.");
  expect(quote.canContinue).toBe(false);
});

test("rejeita linha pertencente a outro tenant e ausência de modalidade", () => {
  const foreignLine = {
    ...createLine("limonada", "foreign-line"),
    tenantId: casaDoPortoCatalog.tenant.id,
  };
  const quote = calculateOrderQuote(mesaVivaCatalog, [foreignLine], null);

  expect(quote.subtotalInCents).toBe(0);
  expect(quote.errors).toEqual(expect.arrayContaining([
    "Linha inválida ou pertencente a outro tenant: foreign-line.",
    "Selecione uma modalidade de atendimento.",
  ]));
  expect(quote.canContinue).toBe(false);
});
