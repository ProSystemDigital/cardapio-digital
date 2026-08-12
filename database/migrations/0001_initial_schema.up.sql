BEGIN;

CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  display_name text NOT NULL,
  short_name text NOT NULL,
  tagline text NOT NULL,
  order_channel text NOT NULL CHECK (order_channel IN ('whatsapp')),
  payment_timing text NOT NULL CHECK (payment_timing IN ('on_fulfillment')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);

CREATE TABLE tenant_branding (
  tenant_id uuid PRIMARY KEY REFERENCES tenants (id) ON DELETE RESTRICT,
  primary_color text NOT NULL,
  secondary_color text NOT NULL,
  accent_color text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tenant_operations (
  tenant_id uuid PRIMARY KEY REFERENCES tenants (id) ON DELETE RESTRICT,
  minimum_order_in_cents bigint NOT NULL CHECK (minimum_order_in_cents >= 0),
  delivery_fee_in_cents bigint CHECK (delivery_fee_in_cents >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tenant_fulfillment_modes (
  tenant_id uuid NOT NULL REFERENCES tenants (id) ON DELETE RESTRICT,
  mode text NOT NULL CHECK (mode IN ('dine_in', 'pickup', 'delivery')),
  PRIMARY KEY (tenant_id, mode)
);

CREATE TABLE business_hours (
  tenant_id uuid NOT NULL REFERENCES tenants (id) ON DELETE RESTRICT,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  opens_at time NOT NULL,
  closes_at time NOT NULL,
  PRIMARY KEY (tenant_id, id),
  UNIQUE (tenant_id, weekday),
  CHECK (opens_at < closes_at)
);

CREATE TABLE categories (
  tenant_id uuid NOT NULL REFERENCES tenants (id) ON DELETE RESTRICT,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  PRIMARY KEY (tenant_id, id),
  UNIQUE (tenant_id, slug)
);

CREATE TABLE products (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL,
  slug text NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  base_price_in_cents bigint NOT NULL CHECK (base_price_in_cents >= 0),
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  PRIMARY KEY (tenant_id, id),
  UNIQUE (tenant_id, slug),
  FOREIGN KEY (tenant_id, category_id)
    REFERENCES categories (tenant_id, id) ON DELETE RESTRICT
);

CREATE TABLE product_fulfillment_modes (
  tenant_id uuid NOT NULL,
  product_id uuid NOT NULL,
  mode text NOT NULL,
  PRIMARY KEY (tenant_id, product_id, mode),
  FOREIGN KEY (tenant_id, product_id)
    REFERENCES products (tenant_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (tenant_id, mode)
    REFERENCES tenant_fulfillment_modes (tenant_id, mode) ON DELETE RESTRICT
);

CREATE TABLE product_variations (
  tenant_id uuid NOT NULL,
  product_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price_delta_in_cents bigint NOT NULL DEFAULT 0,
  is_available boolean NOT NULL DEFAULT true,
  archived_at timestamptz,
  PRIMARY KEY (tenant_id, product_id, id),
  FOREIGN KEY (tenant_id, product_id)
    REFERENCES products (tenant_id, id) ON DELETE RESTRICT
);

CREATE TABLE addon_groups (
  tenant_id uuid NOT NULL,
  product_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  minimum_selections integer NOT NULL CHECK (minimum_selections >= 0),
  maximum_selections integer NOT NULL CHECK (maximum_selections >= minimum_selections),
  archived_at timestamptz,
  PRIMARY KEY (tenant_id, product_id, id),
  FOREIGN KEY (tenant_id, product_id)
    REFERENCES products (tenant_id, id) ON DELETE RESTRICT
);

CREATE TABLE addons (
  tenant_id uuid NOT NULL,
  product_id uuid NOT NULL,
  addon_group_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price_in_cents bigint NOT NULL CHECK (price_in_cents >= 0),
  is_available boolean NOT NULL DEFAULT true,
  archived_at timestamptz,
  PRIMARY KEY (tenant_id, id),
  FOREIGN KEY (tenant_id, product_id, addon_group_id)
    REFERENCES addon_groups (tenant_id, product_id, id) ON DELETE RESTRICT
);

CREATE TABLE orders (
  tenant_id uuid NOT NULL REFERENCES tenants (id) ON DELETE RESTRICT,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  public_reference text NOT NULL,
  fulfillment_mode text NOT NULL,
  status text NOT NULL CHECK (status IN ('created', 'submitted', 'accepted', 'rejected', 'cancelled', 'completed')),
  subtotal_in_cents bigint NOT NULL CHECK (subtotal_in_cents >= 0),
  delivery_fee_in_cents bigint NOT NULL CHECK (delivery_fee_in_cents >= 0),
  total_in_cents bigint NOT NULL CHECK (total_in_cents = subtotal_in_cents + delivery_fee_in_cents),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id),
  UNIQUE (tenant_id, public_reference),
  FOREIGN KEY (tenant_id, fulfillment_mode)
    REFERENCES tenant_fulfillment_modes (tenant_id, mode) ON DELETE RESTRICT
);

CREATE TABLE order_items (
  tenant_id uuid NOT NULL,
  order_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  product_name_snapshot text NOT NULL,
  variation_name_snapshot text,
  unit_price_in_cents_snapshot bigint NOT NULL CHECK (unit_price_in_cents_snapshot >= 0),
  quantity integer NOT NULL CHECK (quantity > 0),
  line_total_in_cents bigint NOT NULL CHECK (line_total_in_cents >= 0),
  PRIMARY KEY (tenant_id, order_id, id),
  FOREIGN KEY (tenant_id, order_id)
    REFERENCES orders (tenant_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (tenant_id, product_id)
    REFERENCES products (tenant_id, id) ON DELETE RESTRICT
);

CREATE TABLE order_item_addons (
  tenant_id uuid NOT NULL,
  order_id uuid NOT NULL,
  order_item_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  addon_id uuid NOT NULL,
  addon_name_snapshot text NOT NULL,
  unit_price_in_cents_snapshot bigint NOT NULL CHECK (unit_price_in_cents_snapshot >= 0),
  quantity integer NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (tenant_id, order_id, order_item_id, id),
  FOREIGN KEY (tenant_id, order_id, order_item_id)
    REFERENCES order_items (tenant_id, order_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (tenant_id, addon_id)
    REFERENCES addons (tenant_id, id) ON DELETE RESTRICT
);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants FORCE ROW LEVEL SECURITY;
CREATE POLICY tenants_tenant_isolation ON tenants
  USING (id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (id = nullif(current_setting('app.tenant_id', true), '')::uuid);

ALTER TABLE tenant_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_branding FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_branding_tenant_isolation ON tenant_branding
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

ALTER TABLE tenant_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_operations FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_operations_tenant_isolation ON tenant_operations
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

ALTER TABLE tenant_fulfillment_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_fulfillment_modes FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_fulfillment_modes_tenant_isolation ON tenant_fulfillment_modes
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours FORCE ROW LEVEL SECURITY;
CREATE POLICY business_hours_tenant_isolation ON business_hours
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories FORCE ROW LEVEL SECURITY;
CREATE POLICY categories_tenant_isolation ON categories
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE products FORCE ROW LEVEL SECURITY;
CREATE POLICY products_tenant_isolation ON products
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

ALTER TABLE product_fulfillment_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_fulfillment_modes FORCE ROW LEVEL SECURITY;
CREATE POLICY product_fulfillment_modes_tenant_isolation ON product_fulfillment_modes
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

ALTER TABLE product_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variations FORCE ROW LEVEL SECURITY;
CREATE POLICY product_variations_tenant_isolation ON product_variations
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

ALTER TABLE addon_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE addon_groups FORCE ROW LEVEL SECURITY;
CREATE POLICY addon_groups_tenant_isolation ON addon_groups
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

ALTER TABLE addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE addons FORCE ROW LEVEL SECURITY;
CREATE POLICY addons_tenant_isolation ON addons
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders FORCE ROW LEVEL SECURITY;
CREATE POLICY orders_tenant_isolation ON orders
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items FORCE ROW LEVEL SECURITY;
CREATE POLICY order_items_tenant_isolation ON order_items
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

ALTER TABLE order_item_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_addons FORCE ROW LEVEL SECURITY;
CREATE POLICY order_item_addons_tenant_isolation ON order_item_addons
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

COMMIT;
