import { expect, test } from "@playwright/test";
import { mesaVivaCatalog } from "../../data/demo-catalogs";
import { createCartLine, type CartLine } from "../../domain/order-cart";
import { buildOrderDraft, formatOrderMessage } from "../../domain/order-draft";

function line(
  productId: string,
  id: string,
  options: { variationId?: string; addonIds?: string[]; quantity?: number } = {},
): CartLine {
  const result = createCartLine(
    mesaVivaCatalog,
    {
      tenantId: mesaVivaCatalog.tenant.id,
      productId,
      variationId: options.variationId,
      addonIds: options.addonIds ?? [],
    },
    id,
  );
  if (!result.ok) throw new Error(result.errors.join(" "));
  return { ...result.line, quantity: options.quantity ?? 1 };
}

test("gera rascunho imutável com produto simples e personalizado", () => {
  const result = buildOrderDraft(
    mesaVivaCatalog,
    [
      line("limonada", "line-1", { quantity: 2 }),
      line("burger", "line-2", { addonIds: ["bacon"] }),
    ],
    "delivery",
    "local-001",
  );

  expect(result).toMatchObject({
    ok: true,
    draft: {
      localReference: "local-001",
      tenantId: "tenant-mesa-viva",
      fulfillmentMode: "delivery",
      subtotalInCents: 7800,
      deliveryFeeInCents: 700,
      totalInCents: 8500,
      status: "preview",
    },
  });
  if (!result.ok) return;
  expect(Object.isFrozen(result.draft)).toBe(true);
  expect(Object.isFrozen(result.draft.items)).toBe(true);
  expect(Object.isFrozen(result.draft.items[1].addonNames)).toBe(true);
});

test("recalcula alteração de preço sem confiar no valor da linha", () => {
  const staleLine = line("limonada", "line-1", { quantity: 3 });
  const changedCatalog = {
    ...mesaVivaCatalog,
    products: mesaVivaCatalog.products.map((product) =>
      product.id === "limonada" ? { ...product, priceInCents: 1600 } : product,
    ),
  };
  const result = buildOrderDraft(changedCatalog, [staleLine], "pickup", "local-002");

  expect(result).toMatchObject({
    ok: true,
    draft: { subtotalInCents: 4800, totalInCents: 4800 },
  });
});

test("rejeita indisponibilidade, outro tenant e pedido abaixo do mínimo", () => {
  const unavailableCatalog = {
    ...mesaVivaCatalog,
    products: mesaVivaCatalog.products.map((product) =>
      product.id === "limonada" ? { ...product, isAvailable: false } : product,
    ),
  };
  expect(buildOrderDraft(unavailableCatalog, [line("limonada", "line-1")], "pickup", "local-003")).toMatchObject({ ok: false });

  const foreign = { ...line("limonada", "line-2"), tenantId: "tenant-externo" };
  expect(buildOrderDraft(mesaVivaCatalog, [foreign], "pickup", "local-004")).toMatchObject({ ok: false });

  expect(buildOrderDraft(mesaVivaCatalog, [line("limonada", "line-3")], "pickup", "local-005")).toMatchObject({
    ok: false,
    errors: expect.arrayContaining(["Pedido abaixo do valor mínimo."]),
  });
});

test("formata mensagem determinística sem IDs internos ou dados pessoais", () => {
  const result = buildOrderDraft(
    mesaVivaCatalog,
    [
      line("limonada", "internal-line-1", { quantity: 3 }),
      line("burger", "internal-line-2", { addonIds: ["queijo"] }),
    ],
    "delivery",
    "internal-reference",
  );
  if (!result.ok) throw new Error(result.errors.join(" "));

  const message = formatOrderMessage(result.draft);
  expect(formatOrderMessage(result.draft)).toBe(message);
  expect(message).toContain("PRÉVIA — PEDIDO NÃO ENVIADO");
  expect(message).toContain("1. 3x Limonada de capim-santo");
  expect(message).toContain("2. 1x Burger Mesa Viva");
  expect(message).toContain("Queijo extra");
  expect(message).toContain("Total: R$ 98,00");
  expect(message).not.toContain("internal-line");
  expect(message).not.toContain("internal-reference");
  expect(message).not.toMatch(/telefone|endereço|cliente|tenant-/i);
});
