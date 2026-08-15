BEGIN;

CREATE FUNCTION public.list_principal_tenant_access(requested_principal_id uuid)
RETURNS TABLE (tenant_id uuid, role text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT membership.tenant_id, membership.role
    FROM public.tenant_memberships membership
    JOIN public.principals principal ON principal.id = membership.principal_id
   WHERE membership.principal_id = requested_principal_id
     AND membership.status = 'active'
     AND principal.status = 'active'
   ORDER BY membership.tenant_id
$$;

REVOKE ALL ON FUNCTION public.list_principal_tenant_access(uuid) FROM PUBLIC;

COMMIT;
