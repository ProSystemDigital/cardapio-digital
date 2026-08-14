BEGIN;

DROP TABLE IF EXISTS access_audit_events;
DROP TABLE IF EXISTS platform_role_assignments;
DROP TABLE IF EXISTS tenant_memberships;
DROP TABLE IF EXISTS principals;

COMMIT;
