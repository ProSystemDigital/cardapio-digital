BEGIN;

DROP TABLE IF EXISTS category_audit_events;
ALTER TABLE categories DROP COLUMN IF EXISTS version;

COMMIT;
