BEGIN;

ALTER TABLE tenants
  ADD COLUMN version bigint NOT NULL DEFAULT 1 CHECK (version > 0);

CREATE TABLE tenant_profile_audit_events (
  tenant_id uuid NOT NULL REFERENCES tenants (id) ON DELETE RESTRICT,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES principals (id) ON DELETE RESTRICT,
  actor_role text NOT NULL CHECK (actor_role IN ('owner', 'manager')),
  action text NOT NULL CHECK (action IN ('tenant.profile.updated')),
  changes jsonb NOT NULL CHECK (jsonb_typeof(changes) = 'object'),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id)
);

ALTER TABLE tenant_profile_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_profile_audit_events FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_profile_audit_events_select ON tenant_profile_audit_events
  FOR SELECT
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY tenant_profile_audit_events_insert ON tenant_profile_audit_events
  FOR INSERT
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

REVOKE ALL ON tenant_profile_audit_events FROM PUBLIC;

COMMIT;
