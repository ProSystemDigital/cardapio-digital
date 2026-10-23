DELETE FROM category_audit_events
WHERE action = 'category.created';

DELETE FROM categories
WHERE slug LIKE 'category-%';
