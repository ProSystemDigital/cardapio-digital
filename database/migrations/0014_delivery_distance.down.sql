BEGIN;

ALTER TABLE tenant_operations
  DROP COLUMN IF EXISTS maximum_delivery_distance_in_meters;

COMMIT;
