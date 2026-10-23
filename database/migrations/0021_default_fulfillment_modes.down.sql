BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM tenant_default_fulfillment_mode_enrollments AS enrollment
      JOIN product_fulfillment_modes AS product_mode
        ON product_mode.tenant_id = enrollment.tenant_id
       AND product_mode.mode = enrollment.mode
  ) THEN
    RAISE EXCEPTION 'default fulfillment modes are already used by products';
  END IF;
END;
$$;

DELETE FROM tenant_fulfillment_modes AS enabled
USING tenant_default_fulfillment_mode_enrollments AS enrollment
WHERE enabled.tenant_id = enrollment.tenant_id
  AND enabled.mode = enrollment.mode;

DROP TABLE tenant_default_fulfillment_mode_enrollments;

COMMIT;
