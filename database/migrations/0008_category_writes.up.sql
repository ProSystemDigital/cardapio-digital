BEGIN;

ALTER TABLE categories
  ADD COLUMN version bigint NOT NULL DEFAULT 1 CHECK (version > 0);

CREATE TABLE category_audit_events (
  tenant_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL,
  actor_id uuid NOT NULL REFERENCES principals (id) ON DELETE RESTRICT,
  actor_role text NOT NULL CHECK (actor_role IN ('owner', 'manager')),
  action text NOT NULL CHECK (action IN ('category.updated')),
  changes jsonb NOT NULL CHECK (jsonb_typeof(changes) = 'object'),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id),
  FOREIGN KEY (tenant_id, category_id)
    REFERENCES categories (tenant_id, id) ON DELETE RESTRICT
);

ALTER TABLE category_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_audit_events FORCE ROW LEVEL SECURITY;

CREATE POLICY category_audit_events_select ON category_audit_events
  FOR SELECT
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY category_audit_events_insert ON category_audit_events
  FOR INSERT
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

REVOKE ALL ON category_audit_events FROM PUBLIC;

COMMIT;
