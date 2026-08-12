import type { FulfillmentMode, TenantCatalog } from "./catalog";
import type { CartLine } from "./order-cart";

export type OrderQuote = {
  mode: FulfillmentMode | null;
  subtotalInCents: number;
  deliveryFeeInCents: number;
  totalInCents: number;
  minimumOrderInCents: number;
  missingMinimumInCents: number;
  incompatibleLineIds: readonly string[];
  errors: readonly string[];
  canContinue: boolean;
};

export function calculateOrderQuote(
  catalog: TenantCatalog,
  lines: readonly CartLine[],
  mode: FulfillmentMode | null,
): OrderQuote {
  const errors: string[] = [];
  const tenantId = catalog.tenant.id;
  const productsById = new Map(
    catalog.products.map((product) => [product.id, product]),
  );
  const validLines = lines.filter((line) => {
    const product = productsById.get(line.productId);
    const valid =
      line.tenantId === tenantId &&
      product?.tenantId === tenantId &&
      line.quantity > 0 &&
      line.unitPriceInCents >= 0;
    if (!valid) errors.push(`Linha inválida ou pertencente a outro tenant: ${line.id}.`);
    return valid;
  });

  const subtotalInCents = validLines.reduce(
    (total, line) => total + line.unitPriceInCents * line.quantity,
    0,
  );
  const minimumOrderInCents = catalog.tenant.operations.minimumOrderInCents;
  const missingMinimumInCents = Math.max(
    0,
    minimumOrderInCents - subtotalInCents,
  );

  if (!mode) errors.push("Selecione uma modalidade de atendimento.");
  if (mode && !catalog.tenant.fulfillmentModes.includes(mode)) {
    errors.push("Modalidade não habilitada pelo estabelecimento.");
  }

  const incompatibleLineIds = mode
    ? validLines
        .filter((line) => !productsById.get(line.productId)?.fulfillmentModes.includes(mode))
        .map((line) => line.id)
    : [];
  if (incompatibleLineIds.length > 0) {
    errors.push("Há itens incompatíveis com a modalidade selecionada.");
  }
  if (lines.length === 0) errors.push("Adicione ao menos um item ao carrinho.");
  if (missingMinimumInCents > 0) errors.push("Pedido abaixo do valor mínimo.");

  const deliveryFeeInCents =
    mode === "delivery" && catalog.tenant.fulfillmentModes.includes("delivery")
      ? (catalog.tenant.operations.deliveryFeeInCents ?? 0)
      : 0;

  return {
    mode,
    subtotalInCents,
    deliveryFeeInCents,
    totalInCents: subtotalInCents + deliveryFeeInCents,
    minimumOrderInCents,
    missingMinimumInCents,
    incompatibleLineIds,
    errors,
    canContinue: errors.length === 0,
  };
}
