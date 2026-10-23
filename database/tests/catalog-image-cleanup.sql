\set ON_ERROR_STOP on

-- Remove somente os eventos produzidos pelo teste descartável antes de
-- restaurar as restrições de ações anteriores à migration 0012.
DELETE FROM tenant_profile_audit_events
 WHERE action = 'tenant.logo.updated';

DELETE FROM catalog_audit_events
 WHERE action = 'product.image.updated';
