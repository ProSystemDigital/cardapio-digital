DELETE FROM tenant_profile_audit_events
 WHERE action = 'tenant.fulfillment_mode.enabled';

DELETE FROM catalog_audit_events
 WHERE entity_id = '32000000-0000-0000-0000-000000000005';

DELETE FROM product_fulfillment_modes
 WHERE mode = 'dine_in';

DELETE FROM tenant_fulfillment_modes
 WHERE mode = 'dine_in';

DELETE FROM product_fulfillment_modes
 WHERE product_id = '32000000-0000-0000-0000-000000000005';

DELETE FROM products
 WHERE id = '32000000-0000-0000-0000-000000000005';
