export type TenantId = string;
export type CategoryId = string;
export type ProductId = string;
export type VariationId = string;
export type AddonId = string;

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
  operations: TenantOperations;
};

export type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type BusinessHours = {
  weekday: Weekday;
  opensAt: string;
  closesAt: string;
};

export type TenantOperations = {
  businessHours: readonly BusinessHours[];
  minimumOrderInCents: number;
  deliveryFeeInCents?: number;
};

export type ProductVariation = {
  id: VariationId;
  name: string;
  priceDeltaInCents: number;
  isAvailable: boolean;
};

export type ProductAddon = {
  id: AddonId;
  name: string;
  priceInCents: number;
  isAvailable: boolean;
};

export type ProductAddonGroup = {
  id: string;
  name: string;
  minimumSelections: number;
  maximumSelections: number;
  addons: readonly ProductAddon[];
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
  fulfillmentModes: readonly FulfillmentMode[];
  variations?: readonly ProductVariation[];
  addonGroups?: readonly ProductAddonGroup[];
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
