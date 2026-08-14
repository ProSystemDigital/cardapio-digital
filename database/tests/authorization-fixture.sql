INSERT INTO principals (id, status, disabled_at)
VALUES
  ('41000000-0000-4000-8000-000000000001', 'active', NULL),
  ('42000000-0000-4000-8000-000000000002', 'active', NULL),
  ('43000000-0000-4000-8000-000000000003', 'disabled', now()),
  ('44000000-0000-4000-8000-000000000004', 'active', NULL);

INSERT INTO tenant_memberships (
  tenant_id, principal_id, role, status, granted_by
)
VALUES
  (
    '30000000-0000-0000-0000-000000000003',
    '41000000-0000-4000-8000-000000000001',
    'owner', 'active', '41000000-0000-4000-8000-000000000001'
  ),
  (
    '30000000-0000-0000-0000-000000000003',
    '43000000-0000-4000-8000-000000000003',
    'manager', 'active', '41000000-0000-4000-8000-000000000001'
  );

INSERT INTO platform_role_assignments (
  principal_id, role, status, granted_by
)
VALUES (
  '42000000-0000-4000-8000-000000000002',
  'platform_admin', 'active', '44000000-0000-4000-8000-000000000004'
);
