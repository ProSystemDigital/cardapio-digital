REVOKE UPDATE ON tenants FROM cardapio_runtime_test;
GRANT UPDATE (short_name, tagline, version, updated_at)
  ON tenants TO cardapio_runtime_test;

GRANT SELECT, INSERT ON tenant_profile_audit_events TO cardapio_runtime_test;
REVOKE UPDATE, DELETE ON tenant_profile_audit_events FROM cardapio_runtime_test;
