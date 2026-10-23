BEGIN;

ALTER TABLE tenant_operations
  DROP CONSTRAINT IF EXISTS tenant_operations_dining_table_count_check,
  DROP COLUMN IF EXISTS dining_table_labels;

COMMIT;
