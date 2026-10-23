REVOKE UPDATE ON categories FROM cardapio_runtime_test;
GRANT INSERT ON categories TO cardapio_runtime_test;
GRANT UPDATE (name, sort_order, version, updated_at)
  ON categories TO cardapio_runtime_test;

GRANT SELECT, INSERT ON category_audit_events TO cardapio_runtime_test;
REVOKE UPDATE, DELETE ON category_audit_events FROM cardapio_runtime_test;
