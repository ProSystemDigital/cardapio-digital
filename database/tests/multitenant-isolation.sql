\set ON_ERROR_STOP on

GRANT USAGE ON SCHEMA public TO cardapio_runtime_test;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO cardapio_runtime_test;
REVOKE UPDATE, DELETE ON catalog_audit_events FROM cardapio_runtime_test;
REVOKE INSERT, UPDATE, DELETE ON principals FROM cardapio_runtime_test;
REVOKE INSERT, UPDATE, DELETE ON tenant_memberships FROM cardapio_runtime_test;
REVOKE INSERT, UPDATE, DELETE ON platform_role_assignments FROM cardapio_runtime_test;
REVOKE INSERT, UPDATE, DELETE ON access_audit_events FROM cardapio_runtime_test;
REVOKE ALL ON external_identity_links FROM cardapio_runtime_test;
GRANT EXECUTE ON FUNCTION public.resolve_external_principal_id(text, text) TO cardapio_runtime_test;
GRANT EXECUTE ON FUNCTION public.list_principal_tenant_access(uuid) TO cardapio_runtime_test;

INSERT INTO tenants (id, slug, display_name, short_name, tagline, order_channel, payment_timing)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'tenant-a', 'Tenant A', 'A', 'Teste A', 'whatsapp', 'on_fulfillment'),
  ('20000000-0000-0000-0000-000000000002', 'tenant-b', 'Tenant B', 'B', 'Teste B', 'whatsapp', 'on_fulfillment');

INSERT INTO tenant_fulfillment_modes (tenant_id, mode)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'pickup'),
  ('20000000-0000-0000-0000-000000000002', 'pickup');

INSERT INTO categories (tenant_id, id, slug, name)
VALUES
  ('10000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', 'categoria-a', 'Categoria A'),
  ('20000000-0000-0000-0000-000000000002', '22000000-0000-0000-0000-000000000002', 'categoria-b', 'Categoria B');

INSERT INTO products (tenant_id, id, category_id, slug, name, description, base_price_in_cents)
VALUES
  ('10000000-0000-0000-0000-000000000001', '12000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', 'produto-a', 'Produto A', 'Teste', 1000),
  ('20000000-0000-0000-0000-000000000002', '23000000-0000-0000-0000-000000000002', '22000000-0000-0000-0000-000000000002', 'produto-b', 'Produto B', 'Teste', 2000);

DO $test$
BEGIN
  BEGIN
    INSERT INTO products (tenant_id, category_id, slug, name, description, base_price_in_cents)
    VALUES ('10000000-0000-0000-0000-000000000001', '22000000-0000-0000-0000-000000000002', 'produto-cruzado', 'Inválido', 'Teste', 1);
    RAISE EXCEPTION 'referência cruzada entre tenants foi aceita';
  EXCEPTION
    WHEN foreign_key_violation THEN NULL;
  END;
END
$test$;

SET ROLE cardapio_runtime_test;

DO $test$
DECLARE
  visible_count integer;
BEGIN
  SELECT count(*) INTO visible_count FROM categories;
  IF visible_count <> 0 THEN
    RAISE EXCEPTION 'RLS expôs linhas sem contexto de tenant';
  END IF;

  BEGIN
    INSERT INTO categories (tenant_id, slug, name)
    VALUES ('10000000-0000-0000-0000-000000000001', 'sem-contexto', 'Inválida');
    RAISE EXCEPTION 'RLS aceitou escrita sem contexto de tenant';
  EXCEPTION
    WHEN insufficient_privilege OR check_violation THEN NULL;
  END;
END
$test$;

BEGIN;
SELECT set_config('app.tenant_id', '10000000-0000-0000-0000-000000000001', true);

DO $test$
DECLARE
  visible_count integer;
  foreign_count integer;
BEGIN
  SELECT count(*) INTO visible_count FROM categories;
  SELECT count(*) INTO foreign_count
    FROM categories
    WHERE tenant_id = '20000000-0000-0000-0000-000000000002';

  IF visible_count <> 1 OR foreign_count <> 0 THEN
    RAISE EXCEPTION 'RLS não isolou a leitura do tenant A';
  END IF;

  BEGIN
    INSERT INTO categories (tenant_id, slug, name)
    VALUES ('20000000-0000-0000-0000-000000000002', 'escrita-cruzada', 'Inválida');
    RAISE EXCEPTION 'RLS aceitou escrita em outro tenant';
  EXCEPTION
    WHEN insufficient_privilege OR check_violation THEN NULL;
  END;
END
$test$;
COMMIT;

RESET ROLE;

INSERT INTO orders (
  tenant_id, id, public_reference, fulfillment_mode, status,
  subtotal_in_cents, delivery_fee_in_cents, total_in_cents
)
VALUES (
  '10000000-0000-0000-0000-000000000001',
  '13000000-0000-0000-0000-000000000001',
  'TESTE-A-1', 'pickup', 'created', 1000, 0, 1000
);

INSERT INTO order_items (
  tenant_id, order_id, id, product_id, product_name_snapshot,
  unit_price_in_cents_snapshot, quantity, line_total_in_cents
)
VALUES (
  '10000000-0000-0000-0000-000000000001',
  '13000000-0000-0000-0000-000000000001',
  '14000000-0000-0000-0000-000000000001',
  '12000000-0000-0000-0000-000000000001',
  'Produto A', 1000, 1, 1000
);

UPDATE products
SET name = 'Produto A atualizado', base_price_in_cents = 2500
WHERE tenant_id = '10000000-0000-0000-0000-000000000001'
  AND id = '12000000-0000-0000-0000-000000000001';

DO $test$
DECLARE
  snapshot_name text;
  snapshot_price bigint;
BEGIN
  SELECT product_name_snapshot, unit_price_in_cents_snapshot
    INTO snapshot_name, snapshot_price
    FROM order_items
    WHERE tenant_id = '10000000-0000-0000-0000-000000000001'
      AND id = '14000000-0000-0000-0000-000000000001';

  IF snapshot_name <> 'Produto A' OR snapshot_price <> 1000 THEN
    RAISE EXCEPTION 'snapshot histórico mudou com o catálogo';
  END IF;
END
$test$;
