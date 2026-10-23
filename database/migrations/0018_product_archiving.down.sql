BEGIN;

DELETE FROM catalog_audit_events WHERE action = 'product.archived';

ALTER TABLE catalog_audit_events
  DROP CONSTRAINT catalog_audit_events_action_check;

ALTER TABLE catalog_audit_events
  ADD CONSTRAINT catalog_audit_events_action_check
  CHECK (action IN ('product.updated', 'product.image.updated', 'product.created'));

COMMIT;
