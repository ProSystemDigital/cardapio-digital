BEGIN;

CREATE TABLE tenant_profile_images (
  tenant_id uuid PRIMARY KEY REFERENCES tenants (id) ON DELETE RESTRICT,
  storage_provider text NOT NULL CHECK (storage_provider IN ('vercel_blob')),
  object_key text NOT NULL CHECK (char_length(object_key) BETWEEN 1 AND 512),
  public_url text NOT NULL CHECK (
    char_length(public_url) BETWEEN 1 AND 2048
    AND public_url ~ '^https://'
  ),
  media_type text NOT NULL CHECK (media_type = 'image/webp'),
  width_pixels integer NOT NULL CHECK (width_pixels = 512),
  height_pixels integer NOT NULL CHECK (height_pixels = 512),
  byte_size integer NOT NULL CHECK (byte_size BETWEEN 1 AND 204800),
  content_sha256 text NOT NULL CHECK (content_sha256 ~ '^[0-9a-f]{64}$'),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (storage_provider, object_key)
);

CREATE TABLE product_catalog_images (
  tenant_id uuid NOT NULL,
  product_id uuid NOT NULL,
  storage_provider text NOT NULL CHECK (storage_provider IN ('vercel_blob')),
  object_key text NOT NULL CHECK (char_length(object_key) BETWEEN 1 AND 512),
  public_url text NOT NULL CHECK (
    char_length(public_url) BETWEEN 1 AND 2048
    AND public_url ~ '^https://'
  ),
  media_type text NOT NULL CHECK (media_type = 'image/webp'),
  width_pixels integer NOT NULL CHECK (width_pixels = 1200),
  height_pixels integer NOT NULL CHECK (height_pixels = 900),
  byte_size integer NOT NULL CHECK (byte_size BETWEEN 1 AND 358400),
  content_sha256 text NOT NULL CHECK (content_sha256 ~ '^[0-9a-f]{64}$'),
  alt_text text NOT NULL CHECK (char_length(btrim(alt_text)) BETWEEN 1 AND 160),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, product_id),
  UNIQUE (storage_provider, object_key),
  FOREIGN KEY (tenant_id, product_id)
    REFERENCES products (tenant_id, id) ON DELETE RESTRICT
);

ALTER TABLE tenant_profile_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_profile_images FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_profile_images_tenant_isolation ON tenant_profile_images
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

ALTER TABLE product_catalog_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_catalog_images FORCE ROW LEVEL SECURITY;
CREATE POLICY product_catalog_images_tenant_isolation ON product_catalog_images
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

REVOKE ALL ON tenant_profile_images FROM PUBLIC;
REVOKE ALL ON product_catalog_images FROM PUBLIC;

COMMIT;
