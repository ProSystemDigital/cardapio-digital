BEGIN;

ALTER TABLE tenant_operations
  ADD COLUMN version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  ADD COLUMN whatsapp_number text,
  ADD CONSTRAINT tenant_operations_whatsapp_number_check
    CHECK (whatsapp_number IS NULL OR whatsapp_number ~ '^\+[1-9][0-9]{7,14}$');

CREATE TABLE tenant_payment_methods (
  tenant_id uuid NOT NULL REFERENCES tenants (id) ON DELETE RESTRICT,
  method text NOT NULL CHECK (method IN ('pix', 'cash', 'credit_card', 'debit_card')),
  PRIMARY KEY (tenant_id, method)
);

INSERT INTO tenant_payment_methods (tenant_id, method)
SELECT tenant_id, 'cash' FROM tenant_operations;

CREATE TABLE tenant_operations_audit_events (
  tenant_id uuid NOT NULL REFERENCES tenants (id) ON DELETE RESTRICT,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES principals (id) ON DELETE RESTRICT,
  actor_role text NOT NULL CHECK (actor_role IN ('owner', 'manager')),
  action text NOT NULL CHECK (action = 'tenant.operations.updated'),
  changes jsonb NOT NULL CHECK (jsonb_typeof(changes) = 'object'),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id)
);

ALTER TABLE tenant_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_payment_methods FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_payment_methods_tenant_isolation ON tenant_payment_methods
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

ALTER TABLE tenant_operations_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_operations_audit_events FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_operations_audit_events_tenant_isolation ON tenant_operations_audit_events
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

REVOKE ALL ON tenant_payment_methods, tenant_operations_audit_events FROM PUBLIC;

COMMIT;
