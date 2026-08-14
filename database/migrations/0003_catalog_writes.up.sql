BEGIN;

ALTER TABLE products
  ADD COLUMN version bigint NOT NULL DEFAULT 1 CHECK (version > 0);

CREATE TABLE catalog_audit_events (
  tenant_id uuid NOT NULL REFERENCES tenants (id) ON DELETE RESTRICT,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  actor_role text NOT NULL CHECK (actor_role IN ('owner', 'manager', 'platform_admin')),
  action text NOT NULL CHECK (action IN ('product.updated')),
  entity_type text NOT NULL CHECK (entity_type IN ('product')),
  entity_id uuid NOT NULL,
  changes jsonb NOT NULL CHECK (jsonb_typeof(changes) = 'object'),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id),
  FOREIGN KEY (tenant_id, entity_id)
    REFERENCES products (tenant_id, id) ON DELETE RESTRICT
);

ALTER TABLE catalog_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_audit_events FORCE ROW LEVEL SECURITY;
CREATE POLICY catalog_audit_events_select ON catalog_audit_events
  FOR SELECT
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY catalog_audit_events_insert ON catalog_audit_events
  FOR INSERT
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

COMMIT;
