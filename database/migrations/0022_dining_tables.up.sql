BEGIN;

ALTER TABLE tenant_operations
  ADD COLUMN dining_table_labels text[] NOT NULL DEFAULT '{}'::text[],
  ADD CONSTRAINT tenant_operations_dining_table_count_check
    CHECK (cardinality(dining_table_labels) <= 100);

COMMIT;
