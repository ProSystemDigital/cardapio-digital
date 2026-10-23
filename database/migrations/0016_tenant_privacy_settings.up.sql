BEGIN;

CREATE TABLE tenant_privacy_settings (
  tenant_id uuid PRIMARY KEY REFERENCES tenants (id) ON DELETE RESTRICT,
  controller_legal_name text NOT NULL CHECK (char_length(controller_legal_name) BETWEEN 2 AND 120),
  privacy_email text NOT NULL CHECK (char_length(privacy_email) <= 254 AND privacy_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  order_address_retention_days integer NOT NULL CHECK (order_address_retention_days BETWEEN 1 AND 3650),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tenant_privacy_audit_events (
  tenant_id uuid NOT NULL REFERENCES tenants (id) ON DELETE RESTRICT,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES principals (id) ON DELETE RESTRICT,
  actor_role text NOT NULL CHECK (actor_role IN ('owner', 'manager')),
  action text NOT NULL CHECK (action = 'tenant.privacy.updated'),
  changes jsonb NOT NULL CHECK (jsonb_typeof(changes) = 'object'),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id)
);

ALTER TABLE tenant_privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_privacy_settings FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_privacy_settings_tenant_isolation ON tenant_privacy_settings
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

ALTER TABLE tenant_privacy_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_privacy_audit_events FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_privacy_audit_events_tenant_isolation ON tenant_privacy_audit_events
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

REVOKE ALL ON tenant_privacy_settings, tenant_privacy_audit_events FROM PUBLIC;

COMMIT;
