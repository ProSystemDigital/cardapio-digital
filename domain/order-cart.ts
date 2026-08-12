import type {
  AddonId,
  Product,
  ProductId,
  TenantCatalog,
  TenantId,
  VariationId,
} from "./catalog";

export type ProductSelection = {
  tenantId: TenantId;
  productId: ProductId;
  variationId?: VariationId;
  addonIds: readonly AddonId[];
};

export type CartLine = ProductSelection & {
  id: string;
  quantity: number;
  unitPriceInCents: number;
};

export type CartLineResult =
  | { ok: true; line: CartLine }
  | { ok: false; errors: string[] };

function validateVariation(
  product: Product,
  variationId: VariationId | undefined,
  errors: string[],
): number {
  const variations = product.variations ?? [];

  if (variations.length === 0) {
    if (variationId) errors.push("O produto não possui variações.");
    return 0;
  }

  if (!variationId) {
    errors.push("Selecione uma variação.");
    return 0;
  }

  const variation = variations.find((item) => item.id === variationId);
  if (!variation) {
    errors.push("A variação selecionada não pertence ao produto.");
    return 0;
  }
  if (!variation.isAvailable) {
    errors.push("A variação selecionada está indisponível.");
  }

  return variation.priceDeltaInCents;
}

function validateAddons(
  product: Product,
  addonIds: readonly AddonId[],
  errors: string[],
): number {
  const selectedIds = new Set(addonIds);
  if (selectedIds.size !== addonIds.length) {
    errors.push("Um adicional não pode ser selecionado mais de uma vez.");
  }

  const allowedIds = new Set(
    (product.addonGroups ?? []).flatMap((group) =>
      group.addons.map((addon) => addon.id),
    ),
  );
  if (addonIds.some((id) => !allowedIds.has(id))) {
    errors.push("Um adicional selecionado não pertence ao produto.");
  }

  let priceInCents = 0;
  for (const group of product.addonGroups ?? []) {
    const selected = group.addons.filter((addon) => selectedIds.has(addon.id));
    if (
      selected.length < group.minimumSelections ||
      selected.length > group.maximumSelections
    ) {
      errors.push(
        `${group.name} exige de ${group.minimumSelections} a ${group.maximumSelections} seleção(ões).`,
      );
    }
    if (selected.some((addon) => !addon.isAvailable)) {
      errors.push(`Há adicional indisponível em ${group.name}.`);
    }
    priceInCents += selected.reduce(
      (total, addon) => total + addon.priceInCents,
      0,
    );
  }

  return priceInCents;
}

export function createCartLine(
  catalog: TenantCatalog,
  selection: ProductSelection,
  lineId: string,
): CartLineResult {
  const errors: string[] = [];

  if (selection.tenantId !== catalog.tenant.id) {
    errors.push("A seleção pertence a outro tenant.");
  }

  const product = catalog.products.find((item) => item.id === selection.productId);
  if (!product || product.tenantId !== catalog.tenant.id) {
    errors.push("Produto não encontrado no catálogo do tenant.");
    return { ok: false, errors };
  }
  if (!product.isAvailable) {
    errors.push("O produto está indisponível.");
  }

  const variationPrice = validateVariation(product, selection.variationId, errors);
  const addonsPrice = validateAddons(product, selection.addonIds, errors);

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    line: {
      id: lineId,
      tenantId: catalog.tenant.id,
      productId: product.id,
      variationId: selection.variationId,
      addonIds: [...selection.addonIds],
      quantity: 1,
      unitPriceInCents: product.priceInCents + variationPrice + addonsPrice,
    },
  };
}

export function changeLineQuantity(
  lines: readonly CartLine[],
  lineId: string,
  change: number,
): CartLine[] {
  return lines.flatMap((line) => {
    if (line.id !== lineId) return [line];
    const quantity = Math.max(0, line.quantity + change);
    return quantity === 0 ? [] : [{ ...line, quantity }];
  });
}

export function replaceCartLine(
  lines: readonly CartLine[],
  line: CartLine,
): CartLine[] {
  return lines.map((current) => (current.id === line.id ? line : current));
}

function configurationKey(line: ProductSelection): string {
  return [
    line.tenantId,
    line.productId,
    line.variationId ?? "",
    [...line.addonIds].sort().join(","),
  ].join("|");
}

export function addOrMergeCartLine(
  lines: readonly CartLine[],
  line: CartLine,
): CartLine[] {
  const existing = lines.find(
    (current) => configurationKey(current) === configurationKey(line),
  );
  if (!existing) return [...lines, line];

  return lines.map((current) =>
    current.id === existing.id
      ? { ...current, quantity: current.quantity + line.quantity }
      : current,
  );
}

export function getLineItemCount(lines: readonly CartLine[]): number {
  return lines.reduce((total, line) => total + line.quantity, 0);
}

export function getLinesSubtotalInCents(lines: readonly CartLine[]): number {
  return lines.reduce(
    (total, line) => total + line.unitPriceInCents * line.quantity,
    0,
  );
}
