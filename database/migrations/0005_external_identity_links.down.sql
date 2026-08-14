BEGIN;

DROP FUNCTION IF EXISTS public.resolve_external_principal_id(text, text);
DROP TABLE IF EXISTS external_identity_links;

COMMIT;
