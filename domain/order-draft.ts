import type { FulfillmentMode, TenantCatalog } from "./catalog";
import { createCartLine, type CartLine } from "./order-cart";
import { calculateOrderQuote } from "./order-quote";

export type OrderDraftItem = {
  productName: string;
  variationName?: string;
  addonNames: readonly string[];
  quantity: number;
  unitPriceInCents: number;
  totalInCents: number;
};

export type OrderDraft = {
  localReference: string;
  tenantId: string;
  tenantName: string;
  fulfillmentMode: FulfillmentMode;
  diningTable?: string;
  items: readonly OrderDraftItem[];
  subtotalInCents: number;
  deliveryFeeInCents: number;
  totalInCents: number;
  status: "preview";
};

export type OrderDraftResult =
  | { ok: true; draft: OrderDraft }
  | { ok: false; errors: readonly string[] };

export function buildOrderDraft(
  catalog: TenantCatalog,
  lines: readonly CartLine[],
  mode: FulfillmentMode | null,
  localReference: string,
  diningTable: string | null = null,
): OrderDraftResult {
  if (!mode) return { ok: false, errors: ["Selecione uma modalidade de atendimento."] };
  if (!localReference.trim()) return { ok: false, errors: ["Referência local inválida."] };
  if (mode === "dine_in" && (!diningTable || !catalog.tenant.operations.diningTables.includes(diningTable))) {
    return { ok: false, errors: ["Selecione uma mesa válida do estabelecimento."] };
  }

  const refreshedLines: CartLine[] = [];
  const errors: string[] = [];

  for (const line of lines) {
    const refreshed = createCartLine(
      catalog,
      {
        tenantId: line.tenantId,
        productId: line.productId,
        variationId: line.variationId,
        addonIds: line.addonIds,
      },
      line.id,
    );
    if (!refreshed.ok) {
      errors.push(...refreshed.errors.map((error) => `${line.id}: ${error}`));
      continue;
    }
    refreshedLines.push({ ...refreshed.line, quantity: line.quantity });
  }

  if (errors.length > 0) return { ok: false, errors };

  const quote = calculateOrderQuote(catalog, refreshedLines, mode);
  if (!quote.canContinue) return { ok: false, errors: quote.errors };

  const productsById = new Map(catalog.products.map((product) => [product.id, product]));
  const items = refreshedLines.map((line) => {
    const product = productsById.get(line.productId);
    if (!product) throw new Error("Catálogo alterado durante a criação da prévia.");
    const variationName = product.variations?.find(
      (variation) => variation.id === line.variationId,
    )?.name;
    const addonNames = (product.addonGroups ?? []).flatMap((group) =>
      group.addons
        .filter((addon) => line.addonIds.includes(addon.id))
        .map((addon) => addon.name),
    );
    return {
      productName: product.name,
      variationName,
      addonNames: Object.freeze(addonNames),
      quantity: line.quantity,
      unitPriceInCents: line.unitPriceInCents,
      totalInCents: line.unitPriceInCents * line.quantity,
    };
  });

  return {
    ok: true,
    draft: Object.freeze({
      localReference,
      tenantId: catalog.tenant.id,
      tenantName: catalog.tenant.shortName,
      fulfillmentMode: mode,
      ...(mode === "dine_in" && diningTable ? { diningTable } : {}),
      items: Object.freeze(items.map((item) => Object.freeze(item))),
      subtotalInCents: quote.subtotalInCents,
      deliveryFeeInCents: quote.deliveryFeeInCents,
      totalInCents: quote.totalInCents,
      status: "preview" as const,
    }),
  };
}

const modeLabels: Record<FulfillmentMode, string> = {
  dine_in: "Na mesa",
  pickup: "Retirada",
  delivery: "Entrega",
};

function formatCents(value: number): string {
  return `R$ ${(value / 100).toFixed(2).replace(".", ",")}`;
}

export function formatOrderMessage(draft: OrderDraft): string {
  const itemLines = draft.items.flatMap((item, index) => {
    const details = [item.variationName, ...item.addonNames].filter(Boolean);
    return [
      `${index + 1}. ${item.quantity}x ${item.productName} — ${formatCents(item.totalInCents)}`,
      ...(details.length ? [`   ${details.join(" · ")}`] : []),
    ];
  });

  return [
    "PRÉVIA — PEDIDO NÃO ENVIADO",
    draft.tenantName,
    `Modalidade: ${modeLabels[draft.fulfillmentMode]}`,
    ...(draft.diningTable ? [`Mesa: ${draft.diningTable}`] : []),
    "",
    ...itemLines,
    "",
    `Subtotal: ${formatCents(draft.subtotalInCents)}`,
    ...(draft.deliveryFeeInCents > 0
      ? [`Taxa de entrega: ${formatCents(draft.deliveryFeeInCents)}`]
      : []),
    `Total: ${formatCents(draft.totalInCents)}`,
  ].join("\n");
}
