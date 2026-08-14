BEGIN;

DROP TABLE IF EXISTS catalog_audit_events;
ALTER TABLE products DROP COLUMN IF EXISTS version;

COMMIT;
