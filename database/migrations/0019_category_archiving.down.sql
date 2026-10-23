BEGIN;

DELETE FROM category_audit_events WHERE action = 'category.archived';

ALTER TABLE category_audit_events
  DROP CONSTRAINT category_audit_events_action_check;

ALTER TABLE category_audit_events
  ADD CONSTRAINT category_audit_events_action_check
  CHECK (action IN ('category.updated', 'category.created'));

COMMIT;
