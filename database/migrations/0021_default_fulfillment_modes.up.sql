BEGIN;

CREATE TABLE tenant_default_fulfillment_mode_enrollments (
  tenant_id uuid NOT NULL REFERENCES tenants (id) ON DELETE RESTRICT,
  mode text NOT NULL CHECK (mode IN ('dine_in', 'pickup', 'delivery')),
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, mode)
);

ALTER TABLE tenant_default_fulfillment_mode_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_default_fulfillment_mode_enrollments FORCE ROW LEVEL SECURITY;
REVOKE ALL ON tenant_default_fulfillment_mode_enrollments FROM PUBLIC;

WITH required_modes(mode) AS (
  VALUES ('dine_in'::text), ('pickup'::text), ('delivery'::text)
)
INSERT INTO tenant_default_fulfillment_mode_enrollments (tenant_id, mode)
SELECT tenant.id, required_modes.mode
  FROM tenants AS tenant
 CROSS JOIN required_modes
  LEFT JOIN tenant_fulfillment_modes AS enabled
    ON enabled.tenant_id = tenant.id AND enabled.mode = required_modes.mode
 WHERE enabled.tenant_id IS NULL;

INSERT INTO tenant_fulfillment_modes (tenant_id, mode)
SELECT tenant_id, mode FROM tenant_default_fulfillment_mode_enrollments
ON CONFLICT DO NOTHING;

COMMIT;
