BEGIN;

ALTER TABLE tenant_profile_audit_events
  DROP CONSTRAINT tenant_profile_audit_events_action_check;
ALTER TABLE tenant_profile_audit_events
  ADD CONSTRAINT tenant_profile_audit_events_action_check
  CHECK (action IN ('tenant.profile.updated', 'tenant.fulfillment_mode.enabled', 'tenant.logo.updated'));

ALTER TABLE catalog_audit_events
  DROP CONSTRAINT catalog_audit_events_action_check;
ALTER TABLE catalog_audit_events
  ADD CONSTRAINT catalog_audit_events_action_check
  CHECK (action IN ('product.updated', 'product.image.updated'));

COMMIT;
