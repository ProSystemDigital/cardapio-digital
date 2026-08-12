import type { TenantCatalog } from "./catalog";

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function validateCatalog(catalog: TenantCatalog): string[] {
  const errors: string[] = [];
  const tenant = catalog.tenant;
  const tenantModes = new Set(tenant.fulfillmentModes);
  const categoryIds = new Set<string>();
  const productIds = new Set<string>();

  if (!tenant.id.trim() || !tenant.slug.trim()) {
    errors.push("Tenant deve possuir id e slug.");
  }

  if (tenant.fulfillmentModes.length === 0) {
    errors.push("Tenant deve habilitar ao menos uma modalidade.");
  }

  if (tenant.operations.minimumOrderInCents < 0) {
    errors.push("Pedido mínimo não pode ser negativo.");
  }

  if ((tenant.operations.deliveryFeeInCents ?? 0) < 0) {
    errors.push("Taxa de entrega não pode ser negativa.");
  }

  if (tenantModes.has("delivery") && tenant.operations.deliveryFeeInCents === undefined) {
    errors.push("Tenant com entrega deve definir taxa de entrega.");
  }

  for (const hours of tenant.operations.businessHours) {
    if (!TIME_PATTERN.test(hours.opensAt) || !TIME_PATTERN.test(hours.closesAt)) {
      errors.push(`Horário inválido para ${hours.weekday}.`);
    } else if (hours.opensAt >= hours.closesAt) {
      errors.push(`Abertura deve anteceder fechamento em ${hours.weekday}.`);
    }
  }

  for (const category of catalog.categories) {
    if (category.tenantId !== tenant.id) {
      errors.push(`Categoria ${category.id} pertence a outro tenant.`);
    }
    if (categoryIds.has(category.id)) {
      errors.push(`Categoria duplicada: ${category.id}.`);
    }
    categoryIds.add(category.id);
  }

  for (const product of catalog.products) {
    if (product.tenantId !== tenant.id) {
      errors.push(`Produto ${product.id} pertence a outro tenant.`);
    }
    if (!categoryIds.has(product.categoryId)) {
      errors.push(`Produto ${product.id} referencia categoria inexistente.`);
    }
    if (productIds.has(product.id)) {
      errors.push(`Produto duplicado: ${product.id}.`);
    }
    productIds.add(product.id);

    if (product.priceInCents < 0) {
      errors.push(`Produto ${product.id} possui preço negativo.`);
    }
    if (product.fulfillmentModes.length === 0) {
      errors.push(`Produto ${product.id} deve possuir modalidade.`);
    }
    if (product.fulfillmentModes.some((mode) => !tenantModes.has(mode))) {
      errors.push(`Produto ${product.id} usa modalidade não habilitada pelo tenant.`);
    }

    const variationIds = new Set<string>();
    for (const variation of product.variations ?? []) {
      if (variationIds.has(variation.id)) {
        errors.push(`Variação duplicada em ${product.id}: ${variation.id}.`);
      }
      variationIds.add(variation.id);
      if (product.priceInCents + variation.priceDeltaInCents < 0) {
        errors.push(`Variação ${variation.id} resulta em preço negativo.`);
      }
    }

    const groupIds = new Set<string>();
    for (const group of product.addonGroups ?? []) {
      if (groupIds.has(group.id)) {
        errors.push(`Grupo de adicionais duplicado em ${product.id}: ${group.id}.`);
      }
      groupIds.add(group.id);
      if (
        group.minimumSelections < 0 ||
        group.maximumSelections < group.minimumSelections ||
        group.maximumSelections > group.addons.length
      ) {
        errors.push(`Limites inválidos no grupo ${group.id} de ${product.id}.`);
      }

      const addonIds = new Set<string>();
      for (const addon of group.addons) {
        if (addonIds.has(addon.id)) {
          errors.push(`Adicional duplicado no grupo ${group.id}: ${addon.id}.`);
        }
        addonIds.add(addon.id);
        if (addon.priceInCents < 0) {
          errors.push(`Adicional ${addon.id} possui preço negativo.`);
        }
      }
    }
  }

  return errors;
}
