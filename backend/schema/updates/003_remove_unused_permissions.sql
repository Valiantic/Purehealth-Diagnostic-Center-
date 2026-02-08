-- =====================================================
-- Remove unused/deprecated permissions
-- Run this on your database to clean up
-- =====================================================

-- First remove any RolePermission assignments for these permissions
DELETE rp FROM `RolePermissions` rp
INNER JOIN `Permissions` p ON rp.permissionId = p.permissionId
WHERE p.permissionKey IN (
  'reports.export',
  'reports.monthly',
  'settings.edit',
  'settings.view',
  'expenses.archive',
  'collectible.export',
  'departments.view',
  'roles.view',
  'tests.view',
  'accounts.view',
  'accounts.create',
  'accounts.edit',
  'accounts.archive'
);

-- Then delete the permissions themselves
DELETE FROM `Permissions` WHERE permissionKey IN (
  'reports.export',
  'reports.monthly',
  'settings.edit',
  'settings.view',
  'expenses.archive',
  'collectible.export',
  'departments.view',
  'roles.view',
  'tests.view',
  'accounts.view',
  'accounts.create',
  'accounts.edit',
  'accounts.archive'
);
