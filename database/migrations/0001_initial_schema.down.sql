BEGIN;

DROP TABLE IF EXISTS order_item_addons;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS addons;
DROP TABLE IF EXISTS addon_groups;
DROP TABLE IF EXISTS product_variations;
DROP TABLE IF EXISTS product_fulfillment_modes;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS business_hours;
DROP TABLE IF EXISTS tenant_fulfillment_modes;
DROP TABLE IF EXISTS tenant_operations;
DROP TABLE IF EXISTS tenant_branding;
DROP TABLE IF EXISTS tenants;

COMMIT;
