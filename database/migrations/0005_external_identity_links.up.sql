BEGIN;

CREATE TABLE external_identity_links (
  issuer text NOT NULL CHECK (char_length(issuer) BETWEEN 1 AND 2048),
  subject text NOT NULL CHECK (char_length(subject) BETWEEN 1 AND 255),
  principal_id uuid NOT NULL REFERENCES principals (id) ON DELETE RESTRICT,
  status text NOT NULL CHECK (status IN ('active', 'revoked')),
  linked_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  PRIMARY KEY (issuer, subject),
  CHECK ((status = 'revoked') = (revoked_at IS NOT NULL))
);

ALTER TABLE external_identity_links ENABLE ROW LEVEL SECURITY;

CREATE FUNCTION public.resolve_external_principal_id(
  requested_issuer text,
  requested_subject text
)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT link.principal_id
    FROM public.external_identity_links link
    JOIN public.principals principal ON principal.id = link.principal_id
   WHERE link.issuer = requested_issuer
     AND link.subject = requested_subject
     AND link.status = 'active'
     AND principal.status = 'active'
$$;

REVOKE ALL ON FUNCTION public.resolve_external_principal_id(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_external_principal_id(text, text) TO PUBLIC;

COMMIT;
