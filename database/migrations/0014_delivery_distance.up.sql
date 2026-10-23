BEGIN;

ALTER TABLE tenant_operations
  ADD COLUMN maximum_delivery_distance_in_meters integer NOT NULL DEFAULT 10000
  CHECK (maximum_delivery_distance_in_meters BETWEEN 500 AND 200000);

COMMIT;
