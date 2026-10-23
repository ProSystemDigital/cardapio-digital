\set ON_ERROR_STOP on

GRANT SELECT, INSERT, UPDATE ON tenant_profile_images TO cardapio_runtime_test;
GRANT SELECT, INSERT, UPDATE ON product_catalog_images TO cardapio_runtime_test;
REVOKE DELETE ON tenant_profile_images, product_catalog_images FROM cardapio_runtime_test;

GRANT SELECT, INSERT ON tenant_profile_audit_events, catalog_audit_events TO cardapio_runtime_test;
REVOKE UPDATE, DELETE ON tenant_profile_audit_events, catalog_audit_events FROM cardapio_runtime_test;
