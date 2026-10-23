BEGIN;

DROP TABLE IF EXISTS tenant_profile_audit_events;
ALTER TABLE tenants DROP COLUMN IF EXISTS version;

COMMIT;
