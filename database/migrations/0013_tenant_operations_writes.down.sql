BEGIN;

DROP TABLE IF EXISTS tenant_operations_audit_events;
DROP TABLE IF EXISTS tenant_payment_methods;
ALTER TABLE tenant_operations
  DROP CONSTRAINT IF EXISTS tenant_operations_whatsapp_number_check,
  DROP COLUMN IF EXISTS whatsapp_number,
  DROP COLUMN IF EXISTS version;

COMMIT;
