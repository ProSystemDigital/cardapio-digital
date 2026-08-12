export type TenantId = string;
export type CategoryId = string;
export type ProductId = string;

export type FulfillmentMode = "dine_in" | "pickup" | "delivery";
export type PaymentTiming = "on_fulfillment";
export type TenantRole = "owner" | "manager" | "platform_admin";

export type TenantProfile = {
  id: TenantId;
  slug: string;
  displayName: string;
  shortName: string;
  tagline: string;
  fulfillmentModes: readonly FulfillmentMode[];
  paymentTiming: PaymentTiming;
  orderChannel: "whatsapp";
};

export type Category = {
  id: CategoryId;
  tenantId: TenantId;
  name: string;
  sortOrder: number;
};

export type Product = {
  id: ProductId;
  tenantId: TenantId;
  categoryId: CategoryId;
  name: string;
  description: string;
  priceInCents: number;
  emoji: string;
  tag?: string;
  isAvailable: boolean;
};

export type TenantCatalog = {
  tenant: TenantProfile;
  categories: readonly Category[];
  products: readonly Product[];
};

export function isCatalogScopedToTenant(catalog: TenantCatalog): boolean {
  const tenantId = catalog.tenant.id;
  const categoryIds = new Set(
    catalog.categories
      .filter((category) => category.tenantId === tenantId)
      .map((category) => category.id),
  );

  return (
    categoryIds.size === catalog.categories.length &&
    catalog.products.every(
      (product) =>
        product.tenantId === tenantId && categoryIds.has(product.categoryId),
    )
  );
}
