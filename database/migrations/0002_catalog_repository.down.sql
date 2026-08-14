BEGIN;

DROP FUNCTION IF EXISTS public.list_public_tenant_slugs();
DROP FUNCTION IF EXISTS public.resolve_public_tenant_id(text);

ALTER TABLE products
  DROP COLUMN IF EXISTS tag,
  DROP COLUMN IF EXISTS emoji;

COMMIT;
