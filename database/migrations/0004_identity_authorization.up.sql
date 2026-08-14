BEGIN;

CREATE TABLE principals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL CHECK (status IN ('active', 'disabled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  disabled_at timestamptz,
  CHECK ((status = 'disabled') = (disabled_at IS NOT NULL))
);

CREATE TABLE tenant_memberships (
  tenant_id uuid NOT NULL REFERENCES tenants (id) ON DELETE RESTRICT,
  principal_id uuid NOT NULL REFERENCES principals (id) ON DELETE RESTRICT,
  role text NOT NULL CHECK (role IN ('owner', 'manager')),
  status text NOT NULL CHECK (status IN ('active', 'revoked')),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  granted_by uuid NOT NULL REFERENCES principals (id) ON DELETE RESTRICT,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_by uuid REFERENCES principals (id) ON DELETE RESTRICT,
  revoked_at timestamptz,
  PRIMARY KEY (tenant_id, principal_id),
  CHECK ((status = 'revoked') = (revoked_at IS NOT NULL)),
  CHECK ((status = 'revoked') = (revoked_by IS NOT NULL))
);

CREATE TABLE platform_role_assignments (
  principal_id uuid PRIMARY KEY REFERENCES principals (id) ON DELETE RESTRICT,
  role text NOT NULL CHECK (role IN ('platform_admin')),
  status text NOT NULL CHECK (status IN ('active', 'revoked')),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  granted_by uuid NOT NULL REFERENCES principals (id) ON DELETE RESTRICT,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_by uuid REFERENCES principals (id) ON DELETE RESTRICT,
  revoked_at timestamptz,
  CHECK ((status = 'revoked') = (revoked_at IS NOT NULL)),
  CHECK ((status = 'revoked') = (revoked_by IS NOT NULL))
);

CREATE TABLE access_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_principal_id uuid NOT NULL REFERENCES principals (id) ON DELETE RESTRICT,
  subject_principal_id uuid NOT NULL REFERENCES principals (id) ON DELETE RESTRICT,
  tenant_id uuid REFERENCES tenants (id) ON DELETE RESTRICT,
  action text NOT NULL CHECK (action IN (
    'tenant_membership.granted',
    'tenant_membership.role_changed',
    'tenant_membership.revoked',
    'platform_role.granted',
    'platform_role.revoked',
    'support_access.requested'
  )),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  occurred_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE principals ENABLE ROW LEVEL SECURITY;
ALTER TABLE principals FORCE ROW LEVEL SECURITY;
CREATE POLICY principals_select_self ON principals
  FOR SELECT
  USING (id = nullif(current_setting('app.principal_id', true), '')::uuid);

ALTER TABLE tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_memberships FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_memberships_select_self ON tenant_memberships
  FOR SELECT
  USING (principal_id = nullif(current_setting('app.principal_id', true), '')::uuid);

ALTER TABLE platform_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_role_assignments FORCE ROW LEVEL SECURITY;
CREATE POLICY platform_role_assignments_select_self ON platform_role_assignments
  FOR SELECT
  USING (principal_id = nullif(current_setting('app.principal_id', true), '')::uuid);

ALTER TABLE access_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_audit_events FORCE ROW LEVEL SECURITY;
CREATE POLICY access_audit_events_select_self ON access_audit_events
  FOR SELECT
  USING (
    actor_principal_id = nullif(current_setting('app.principal_id', true), '')::uuid
    OR subject_principal_id = nullif(current_setting('app.principal_id', true), '')::uuid
  );

COMMIT;
