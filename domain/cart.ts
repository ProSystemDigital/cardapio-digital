import type { CategoryId, Product, ProductId } from "./catalog";

export const ALL_CATEGORIES = "all" as const;
export type CategoryFilter = CategoryId | typeof ALL_CATEGORIES;
export type Cart = Readonly<Record<ProductId, number>>;

export function changeCartQuantity(
  cart: Cart,
  productId: ProductId,
  change: number,
): Cart {
  const quantity = Math.max(0, (cart[productId] ?? 0) + change);
  const next = { ...cart };

  if (quantity === 0) {
    delete next[productId];
  } else {
    next[productId] = quantity;
  }

  return next;
}

export function getCartItemCount(cart: Cart): number {
  return Object.values(cart).reduce((total, quantity) => total + quantity, 0);
}

export function getCartSubtotalInCents(
  products: readonly Product[],
  cart: Cart,
): number {
  return products.reduce(
    (total, product) =>
      total + product.priceInCents * (cart[product.id] ?? 0),
    0,
  );
}

export function filterProducts(
  products: readonly Product[],
  category: CategoryFilter,
  query: string,
): Product[] {
  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");

  return products.filter((product) => {
    const matchesCategory =
      category === ALL_CATEGORIES || product.categoryId === category;
    const matchesQuery =
      !normalizedQuery ||
      `${product.name} ${product.description}`
        .toLocaleLowerCase("pt-BR")
        .includes(normalizedQuery);

    return product.isAvailable && matchesCategory && matchesQuery;
  });
}
