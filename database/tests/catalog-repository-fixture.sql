INSERT INTO tenants (
  id, slug, display_name, short_name, tagline, order_channel, payment_timing
)
VALUES (
  '30000000-0000-0000-0000-000000000003',
  'catalogo-postgres', 'Catálogo PostgreSQL', 'Postgres',
  'Fixture local sem dados pessoais', 'whatsapp', 'on_fulfillment'
);

INSERT INTO tenant_operations (tenant_id, minimum_order_in_cents, delivery_fee_in_cents)
VALUES ('30000000-0000-0000-0000-000000000003', 2000, 500);

INSERT INTO tenant_fulfillment_modes (tenant_id, mode)
VALUES
  ('30000000-0000-0000-0000-000000000003', 'pickup'),
  ('30000000-0000-0000-0000-000000000003', 'delivery');

INSERT INTO business_hours (tenant_id, weekday, opens_at, closes_at)
VALUES ('30000000-0000-0000-0000-000000000003', 1, '09:00', '18:00');

INSERT INTO categories (tenant_id, id, slug, name, sort_order)
VALUES (
  '30000000-0000-0000-0000-000000000003',
  '31000000-0000-0000-0000-000000000003',
  'principais', 'Principais', 1
);

INSERT INTO products (
  tenant_id, id, category_id, slug, name, description,
  base_price_in_cents, emoji, tag, is_available
)
VALUES (
  '30000000-0000-0000-0000-000000000003',
  '32000000-0000-0000-0000-000000000003',
  '31000000-0000-0000-0000-000000000003',
  'prato-local', 'Prato local', 'Fixture do repositório',
  2500, '🍽️', 'Teste', true
);

INSERT INTO product_fulfillment_modes (tenant_id, product_id, mode)
VALUES
  ('30000000-0000-0000-0000-000000000003', '32000000-0000-0000-0000-000000000003', 'pickup'),
  ('30000000-0000-0000-0000-000000000003', '32000000-0000-0000-0000-000000000003', 'delivery');

INSERT INTO product_variations (
  tenant_id, product_id, id, name, price_delta_in_cents, is_available
)
VALUES (
  '30000000-0000-0000-0000-000000000003',
  '32000000-0000-0000-0000-000000000003',
  '33000000-0000-0000-0000-000000000003',
  'Grande', 500, true
);

INSERT INTO addon_groups (
  tenant_id, product_id, id, name, minimum_selections, maximum_selections
)
VALUES (
  '30000000-0000-0000-0000-000000000003',
  '32000000-0000-0000-0000-000000000003',
  '34000000-0000-0000-0000-000000000003',
  'Extras', 0, 1
);

INSERT INTO addons (
  tenant_id, product_id, addon_group_id, id, name, price_in_cents, is_available
)
VALUES (
  '30000000-0000-0000-0000-000000000003',
  '32000000-0000-0000-0000-000000000003',
  '34000000-0000-0000-0000-000000000003',
  '35000000-0000-0000-0000-000000000003',
  'Extra local', 300, true
);

-- Tenant técnico isolado para o teste de metadados de imagem. Não participa
-- das asserções do catálogo administrativo principal.
INSERT INTO tenants (id, slug, display_name, short_name, tagline, order_channel, payment_timing)
VALUES ('50000000-0000-0000-0000-000000000005', 'imagem-teste', 'Imagem Teste', 'Imagem', 'Fixture isolada', 'whatsapp', 'on_fulfillment');

INSERT INTO tenant_operations (tenant_id, minimum_order_in_cents, delivery_fee_in_cents)
VALUES ('50000000-0000-0000-0000-000000000005', 0, 0);

INSERT INTO tenant_fulfillment_modes (tenant_id, mode)
VALUES
  ('50000000-0000-0000-0000-000000000005', 'pickup'),
  ('50000000-0000-0000-0000-000000000005', 'delivery');

INSERT INTO categories (tenant_id, id, slug, name, sort_order)
VALUES ('50000000-0000-0000-0000-000000000005', '51000000-0000-0000-0000-000000000005', 'imagens', 'Imagens', 1);

INSERT INTO products (tenant_id, id, category_id, slug, name, description, base_price_in_cents, emoji, is_available)
VALUES ('50000000-0000-0000-0000-000000000005', '52000000-0000-0000-0000-000000000005', '51000000-0000-0000-0000-000000000005', 'imagem-teste', 'Imagem teste', 'Fixture isolada', 100, 'I', false);
