BEGIN;

ALTER TABLE products
  ADD COLUMN emoji text NOT NULL DEFAULT '🍽️',
  ADD COLUMN tag text;

CREATE FUNCTION public.resolve_public_tenant_id(requested_slug text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT id
  FROM public.tenants
  WHERE slug = requested_slug
    AND archived_at IS NULL
$$;

CREATE FUNCTION public.list_public_tenant_slugs()
RETURNS SETOF text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT slug
  FROM public.tenants
  WHERE archived_at IS NULL
  ORDER BY slug
$$;

REVOKE ALL ON FUNCTION public.resolve_public_tenant_id(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_public_tenant_slugs() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_public_tenant_id(text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_public_tenant_slugs() TO PUBLIC;

COMMIT;
