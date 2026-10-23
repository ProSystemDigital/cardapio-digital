BEGIN;

CREATE TABLE tenant_delivery_origins (
  tenant_id uuid PRIMARY KEY REFERENCES tenants (id) ON DELETE RESTRICT,
  label text NOT NULL CHECK (char_length(label) BETWEEN 1 AND 80),
  postal_code text NOT NULL CHECK (postal_code ~ '^[0-9]{8}$'),
  street text NOT NULL CHECK (char_length(street) BETWEEN 1 AND 120),
  number text NOT NULL CHECK (char_length(number) BETWEEN 1 AND 20),
  complement text CHECK (complement IS NULL OR char_length(complement) BETWEEN 1 AND 80),
  neighborhood text NOT NULL CHECK (char_length(neighborhood) BETWEEN 1 AND 80),
  city text NOT NULL CHECK (char_length(city) BETWEEN 1 AND 80),
  state text NOT NULL CHECK (state IN ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO')),
  country text NOT NULL DEFAULT 'BR' CHECK (country = 'BR'),
  latitude numeric(9,6) CHECK (latitude BETWEEN -90 AND 90),
  longitude numeric(9,6) CHECK (longitude BETWEEN -180 AND 180),
  geocoding_status text NOT NULL DEFAULT 'pending' CHECK (geocoding_status IN ('pending', 'verified', 'failed')),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((latitude IS NULL) = (longitude IS NULL)),
  CHECK ((geocoding_status = 'verified') = (latitude IS NOT NULL))
);

CREATE TABLE tenant_delivery_origin_audit_events (
  tenant_id uuid NOT NULL REFERENCES tenants (id) ON DELETE RESTRICT,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES principals (id) ON DELETE RESTRICT,
  actor_role text NOT NULL CHECK (actor_role IN ('owner', 'manager')),
  action text NOT NULL CHECK (action IN ('tenant.delivery_origin.saved', 'tenant.delivery_origin.geocoded')),
  changes jsonb NOT NULL CHECK (jsonb_typeof(changes) = 'object'),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id)
);

ALTER TABLE tenant_delivery_origins ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_delivery_origins FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_delivery_origins_tenant_isolation ON tenant_delivery_origins
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

ALTER TABLE tenant_delivery_origin_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_delivery_origin_audit_events FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_delivery_origin_audit_events_tenant_isolation ON tenant_delivery_origin_audit_events
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

REVOKE ALL ON tenant_delivery_origins, tenant_delivery_origin_audit_events FROM PUBLIC;

COMMIT;
