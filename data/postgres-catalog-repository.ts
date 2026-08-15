import { Pool, type PoolClient } from "pg";
import type {
  BusinessHours,
  FulfillmentMode,
  Product,
  ProductAddonGroup,
  ProductVariation,
  TenantCatalog,
  Weekday,
} from "../domain/catalog";
import { validateCatalog } from "../domain/catalog-validation";
import type { CatalogRepository } from "./catalog-repository";

type Queryable = Pick<PoolClient, "query">;
type ProductOptions = readonly [
  Map<string, FulfillmentMode[]>,
  Map<string, ProductVariation[]>,
  Map<string, Omit<ProductAddonGroup, "addons">[]>,
  Map<string, ProductAddonGroup["addons"][number][]>,
];

const weekdays: readonly Weekday[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

function integer(value: string | number, field: string): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(parsed)) {
    throw new Error(`Valor inválido em ${field}.`);
  }
  return parsed;
}

export class PostgresCatalogRepository implements CatalogRepository {
  constructor(private readonly pool: Pool) {}

  async listTenantSlugs(): Promise<readonly string[]> {
    const result = await this.pool.query<{ slug: string }>(
      "SELECT slug FROM public.list_public_tenant_slugs() AS slug",
    );
    return result.rows.map(({ slug }) => slug);
  }

  async findByTenantSlug(slug: string): Promise<TenantCatalog | null> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN READ ONLY");
      const resolved = await client.query<{ tenant_id: string | null }>(
        "SELECT public.resolve_public_tenant_id($1) AS tenant_id",
        [slug],
      );
      const tenantId = resolved.rows[0]?.tenant_id;
      if (!tenantId) {
        await client.query("COMMIT");
        return null;
      }

      await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
      const catalog = await loadCatalog(client, tenantId);
      const validationErrors = validateCatalog(catalog);
      if (validationErrors.length > 0) {
        throw new Error(`Catálogo persistido rejeitado: ${validationErrors.join(" ")}`);
      }
      await client.query("COMMIT");
      return catalog;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async findByTenantId(tenantId: string): Promise<TenantCatalog | null> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN READ ONLY");
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
      const catalog = await loadCatalog(client, tenantId);
      const validationErrors = validateCatalog(catalog);
      if (validationErrors.length > 0) {
        throw new Error(`Catálogo persistido rejeitado: ${validationErrors.join(" ")}`);
      }
      await client.query("COMMIT");
      return catalog;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

async function loadCatalog(client: Queryable, tenantId: string): Promise<TenantCatalog> {
  const [tenantResult, modesResult, hoursResult, categoriesResult, productsResult] =
    await Promise.all([
      client.query<{
        id: string; slug: string; display_name: string; short_name: string;
        tagline: string; payment_timing: "on_fulfillment"; order_channel: "whatsapp";
        minimum_order_in_cents: string; delivery_fee_in_cents: string | null;
      }>(`SELECT t.id, t.slug, t.display_name, t.short_name, t.tagline,
          t.payment_timing, t.order_channel, o.minimum_order_in_cents,
          o.delivery_fee_in_cents
        FROM tenants t
        JOIN tenant_operations o ON o.tenant_id = t.id
        WHERE t.id = $1 AND t.archived_at IS NULL`, [tenantId]),
      client.query<{ mode: FulfillmentMode }>(
        "SELECT mode FROM tenant_fulfillment_modes WHERE tenant_id = $1 ORDER BY mode",
        [tenantId],
      ),
      client.query<{ weekday: number; opens_at: string; closes_at: string }>(
        "SELECT weekday, opens_at::text, closes_at::text FROM business_hours WHERE tenant_id = $1 ORDER BY weekday",
        [tenantId],
      ),
      client.query<{ id: string; tenant_id: string; name: string; sort_order: number }>(
        "SELECT id, tenant_id, name, sort_order FROM categories WHERE tenant_id = $1 AND archived_at IS NULL ORDER BY sort_order, name",
        [tenantId],
      ),
      client.query<{
        id: string; tenant_id: string; category_id: string; name: string;
        description: string; base_price_in_cents: string; emoji: string;
        tag: string | null; is_available: boolean;
      }>(`SELECT id, tenant_id, category_id, name, description,
          base_price_in_cents, emoji, tag, is_available
        FROM products
        WHERE tenant_id = $1 AND archived_at IS NULL
        ORDER BY name`, [tenantId]),
    ]);

  const tenant = tenantResult.rows[0];
  if (!tenant) throw new Error("Tenant resolvido sem configuração operacional.");

  const productIds = productsResult.rows.map(({ id }) => id);
  const [productModes, variations, groups, addons] = await loadProductOptions(
    client,
    tenantId,
    productIds,
  );

  const businessHours: BusinessHours[] = hoursResult.rows.map((hours) => ({
    weekday: weekdays[hours.weekday]!,
    opensAt: hours.opens_at.slice(0, 5),
    closesAt: hours.closes_at.slice(0, 5),
  }));

  const products: Product[] = productsResult.rows.map((product) => ({
    id: product.id,
    tenantId: product.tenant_id,
    categoryId: product.category_id,
    name: product.name,
    description: product.description,
    priceInCents: integer(product.base_price_in_cents, "base_price_in_cents"),
    emoji: product.emoji,
    ...(product.tag ? { tag: product.tag } : {}),
    isAvailable: product.is_available,
    fulfillmentModes: productModes.get(product.id) ?? [],
    variations: variations.get(product.id),
    addonGroups: groups.get(product.id)?.map((group) => ({
      ...group,
      addons: addons.get(group.id) ?? [],
    })),
  }));

  return {
    tenant: {
      id: tenant.id,
      slug: tenant.slug,
      displayName: tenant.display_name,
      shortName: tenant.short_name,
      tagline: tenant.tagline,
      fulfillmentModes: modesResult.rows.map(({ mode }) => mode),
      paymentTiming: tenant.payment_timing,
      orderChannel: tenant.order_channel,
      operations: {
        businessHours,
        minimumOrderInCents: integer(tenant.minimum_order_in_cents, "minimum_order_in_cents"),
        ...(tenant.delivery_fee_in_cents === null
          ? {}
          : { deliveryFeeInCents: integer(tenant.delivery_fee_in_cents, "delivery_fee_in_cents") }),
      },
    },
    categories: categoriesResult.rows.map((category) => ({
      id: category.id,
      tenantId: category.tenant_id,
      name: category.name,
      sortOrder: category.sort_order,
    })),
    products,
  };
}

async function loadProductOptions(
  client: Queryable,
  tenantId: string,
  productIds: string[],
): Promise<ProductOptions> {
  if (productIds.length === 0) {
    return [new Map(), new Map(), new Map(), new Map()];
  }
  const [modesResult, variationsResult, groupsResult, addonsResult] = await Promise.all([
    client.query<{ product_id: string; mode: FulfillmentMode }>(
      "SELECT product_id, mode FROM product_fulfillment_modes WHERE tenant_id = $1 AND product_id = ANY($2::uuid[]) ORDER BY mode",
      [tenantId, productIds],
    ),
    client.query<{ product_id: string; id: string; name: string; price_delta_in_cents: string; is_available: boolean }>(
      "SELECT product_id, id, name, price_delta_in_cents, is_available FROM product_variations WHERE tenant_id = $1 AND product_id = ANY($2::uuid[]) AND archived_at IS NULL ORDER BY name",
      [tenantId, productIds],
    ),
    client.query<{ product_id: string; id: string; name: string; minimum_selections: number; maximum_selections: number }>(
      "SELECT product_id, id, name, minimum_selections, maximum_selections FROM addon_groups WHERE tenant_id = $1 AND product_id = ANY($2::uuid[]) AND archived_at IS NULL ORDER BY name",
      [tenantId, productIds],
    ),
    client.query<{ addon_group_id: string; id: string; name: string; price_in_cents: string; is_available: boolean }>(
      "SELECT addon_group_id, id, name, price_in_cents, is_available FROM addons WHERE tenant_id = $1 AND product_id = ANY($2::uuid[]) AND archived_at IS NULL ORDER BY name",
      [tenantId, productIds],
    ),
  ]);

  const modes = new Map<string, FulfillmentMode[]>();
  for (const row of modesResult.rows) append(modes, row.product_id, row.mode);
  const variations = new Map<string, ProductVariation[]>();
  for (const row of variationsResult.rows) append(variations, row.product_id, {
    id: row.id, name: row.name,
    priceDeltaInCents: integer(row.price_delta_in_cents, "price_delta_in_cents"),
    isAvailable: row.is_available,
  });
  const groups = new Map<string, Omit<ProductAddonGroup, "addons">[]>();
  for (const row of groupsResult.rows) append(groups, row.product_id, {
    id: row.id, name: row.name,
    minimumSelections: row.minimum_selections,
    maximumSelections: row.maximum_selections,
  });
  const addons = new Map<string, ProductAddonGroup["addons"][number][]>();
  for (const row of addonsResult.rows) append(addons, row.addon_group_id, {
    id: row.id, name: row.name,
    priceInCents: integer(row.price_in_cents, "price_in_cents"),
    isAvailable: row.is_available,
  });
  return [modes, variations, groups, addons] as const;
}

function append<T>(map: Map<string, T[]>, key: string, value: T): void {
  const values = map.get(key) ?? [];
  values.push(value);
  map.set(key, values);
}
