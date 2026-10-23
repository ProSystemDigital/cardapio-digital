\set ON_ERROR_STOP on

GRANT SELECT, INSERT ON tenant_profile_images, product_catalog_images TO cardapio_runtime_test;

INSERT INTO tenant_profile_images (
  tenant_id, storage_provider, object_key, public_url, media_type,
  width_pixels, height_pixels, byte_size, content_sha256
)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'vercel_blob', 'tenants/a/logo.webp', 'https://assets.example.test/tenants/a/logo.webp', 'image/webp', 512, 512, 1024, repeat('a', 64)),
  ('20000000-0000-0000-0000-000000000002', 'vercel_blob', 'tenants/b/logo.webp', 'https://assets.example.test/tenants/b/logo.webp', 'image/webp', 512, 512, 1024, repeat('b', 64));

INSERT INTO product_catalog_images (
  tenant_id, product_id, storage_provider, object_key, public_url, media_type,
  width_pixels, height_pixels, byte_size, content_sha256, alt_text
)
VALUES
  ('10000000-0000-0000-0000-000000000001', '12000000-0000-0000-0000-000000000001', 'vercel_blob', 'tenants/a/products/a.webp', 'https://assets.example.test/tenants/a/products/a.webp', 'image/webp', 1200, 900, 2048, repeat('c', 64), 'Produto A'),
  ('20000000-0000-0000-0000-000000000002', '23000000-0000-0000-0000-000000000002', 'vercel_blob', 'tenants/b/products/b.webp', 'https://assets.example.test/tenants/b/products/b.webp', 'image/webp', 1200, 900, 2048, repeat('d', 64), 'Produto B');

DO $test$
BEGIN
  BEGIN
    INSERT INTO product_catalog_images (
      tenant_id, product_id, storage_provider, object_key, public_url, media_type,
      width_pixels, height_pixels, byte_size, content_sha256, alt_text
    ) VALUES (
      '10000000-0000-0000-0000-000000000001',
      '23000000-0000-0000-0000-000000000002',
      'vercel_blob', 'invalid/cross-tenant.webp',
      'https://assets.example.test/invalid/cross-tenant.webp',
      'image/webp', 1200, 900, 1024, repeat('e', 64), 'Inválida'
    );
    RAISE EXCEPTION 'referência de imagem entre tenants foi aceita';
  EXCEPTION
    WHEN foreign_key_violation THEN NULL;
  END;

  BEGIN
    UPDATE tenant_profile_images
      SET media_type = 'image/png', width_pixels = 256, height_pixels = 256
      WHERE tenant_id = '10000000-0000-0000-0000-000000000001';
    RAISE EXCEPTION 'metadado de imagem fora do padrão foi aceito';
  EXCEPTION
    WHEN check_violation THEN NULL;
  END;
END
$test$;

SET ROLE cardapio_runtime_test;

DO $test$
DECLARE
  visible_count integer;
BEGIN
  SELECT count(*) INTO visible_count FROM product_catalog_images;
  IF visible_count <> 0 THEN
    RAISE EXCEPTION 'RLS de imagens expôs linhas sem contexto de tenant';
  END IF;
END
$test$;

BEGIN;
SELECT set_config('app.tenant_id', '10000000-0000-0000-0000-000000000001', true);

DO $test$
DECLARE
  visible_logos integer;
  visible_products integer;
BEGIN
  SELECT count(*) INTO visible_logos FROM tenant_profile_images;
  SELECT count(*) INTO visible_products FROM product_catalog_images;
  IF visible_logos <> 1 OR visible_products <> 1 THEN
    RAISE EXCEPTION 'RLS de imagens não isolou o tenant A';
  END IF;
END
$test$;
COMMIT;

RESET ROLE;
REVOKE ALL ON tenant_profile_images, product_catalog_images FROM cardapio_runtime_test;
