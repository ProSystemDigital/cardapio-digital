import type { CategoryId, Product } from "./catalog";

export const ALL_CATEGORIES = "all" as const;
export type CategoryFilter = CategoryId | typeof ALL_CATEGORIES;

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
