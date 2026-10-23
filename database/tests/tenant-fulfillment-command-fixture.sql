GRANT INSERT ON tenant_fulfillment_modes TO cardapio_runtime_test;
GRANT SELECT, INSERT ON product_fulfillment_modes TO cardapio_runtime_test;
GRANT UPDATE (version, updated_at) ON products TO cardapio_runtime_test;
GRANT SELECT, INSERT ON catalog_audit_events TO cardapio_runtime_test;
GRANT SELECT, INSERT ON tenant_profile_audit_events TO cardapio_runtime_test;
REVOKE UPDATE, DELETE ON tenant_profile_audit_events FROM cardapio_runtime_test;
