-- =============================================================================
-- PUREHEALTH DIAGNOSTIC CENTER
-- PostgreSQL Migration: Create RBAC Tables (Roles, Permissions, RolePermissions)
-- + Add roleId column to Users table
-- =============================================================================

BEGIN;

-- =====================================================
-- 1. CREATE Roles TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS "Roles" (
  "roleId"      SERIAL PRIMARY KEY,
  "roleName"    VARCHAR(50)  NOT NULL UNIQUE,
  "displayName" VARCHAR(100) NOT NULL,
  "description" TEXT,
  "isSystem"    BOOLEAN      NOT NULL DEFAULT FALSE,
  "status"      VARCHAR(50)  NOT NULL DEFAULT 'active'
                CHECK ("status" IN ('active', 'inactive')),
  "createdAt"   TIMESTAMP    NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "role_name_unique" ON "Roles" ("roleName");
CREATE INDEX IF NOT EXISTS "role_status" ON "Roles" ("status");

-- =====================================================
-- 2. CREATE Permissions TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS "Permissions" (
  "permissionId"  SERIAL PRIMARY KEY,
  "permissionKey" VARCHAR(100) NOT NULL UNIQUE,
  "displayName"   VARCHAR(100) NOT NULL,
  "description"   TEXT,
  "category"      VARCHAR(50)  NOT NULL,
  "createdAt"     TIMESTAMP    NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "permission_key_unique" ON "Permissions" ("permissionKey");
CREATE INDEX IF NOT EXISTS "permission_category" ON "Permissions" ("category");

-- =====================================================
-- 3. CREATE RolePermissions TABLE (composite PK)
-- =====================================================
CREATE TABLE IF NOT EXISTS "RolePermissions" (
  "roleId"       INTEGER   NOT NULL,
  "permissionId" INTEGER   NOT NULL,
  "createdAt"    TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"    TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("roleId", "permissionId"),
  FOREIGN KEY ("roleId")       REFERENCES "Roles" ("roleId")       ON DELETE CASCADE  ON UPDATE CASCADE,
  FOREIGN KEY ("permissionId") REFERENCES "Permissions" ("permissionId") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "role_permission_role" ON "RolePermissions" ("roleId");
CREATE INDEX IF NOT EXISTS "role_permission_permission" ON "RolePermissions" ("permissionId");

-- =====================================================
-- 4. ADD roleId COLUMN TO Users (if missing)
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Users' AND column_name = 'roleId'
  ) THEN
    ALTER TABLE "Users" ADD COLUMN "roleId" INTEGER;
    ALTER TABLE "Users" ADD CONSTRAINT "fk_users_role"
      FOREIGN KEY ("roleId") REFERENCES "Roles" ("roleId")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;

-- =====================================================
-- 5. SEED Roles
-- =====================================================
INSERT INTO "Roles" ("roleId", "roleName", "displayName", "description", "isSystem", "status", "createdAt", "updatedAt")
VALUES
  (1, 'admin',        'Administrator', 'Full system access with all permissions',                    TRUE,  'active', NOW(), NOW()),
  (2, 'receptionist', 'Receptionist',  'Standard user with transaction and basic operations access', TRUE,  'active', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- 6. SEED Permissions
-- =====================================================
INSERT INTO "Permissions" ("permissionKey", "displayName", "description", "category", "createdAt", "updatedAt")
VALUES
  -- Dashboard
  ('dashboard.view',      'View Dashboard',            'Access to view the main dashboard',                             'Dashboard',          NOW(), NOW()),
  -- Transactions
  ('transactions.view',   'View Transactions',         'View transaction records',                                      'Transactions',       NOW(), NOW()),
  ('transactions.create', 'Create Transactions',       'Add new transactions',                                          'Transactions',       NOW(), NOW()),
  ('transactions.edit',   'Edit Transactions',         'Modify existing transactions',                                  'Transactions',       NOW(), NOW()),
  ('transactions.cancel', 'Cancel Transactions',       'Cancel pending transactions',                                   'Transactions',       NOW(), NOW()),
  ('transactions.refund', 'Refund Transactions',       'Process transaction refunds',                                   'Transactions',       NOW(), NOW()),
  ('transactions.export', 'Export Transactions',       'Export transaction data',                                        'Transactions',       NOW(), NOW()),
  -- Collectible Income
  ('collectible.view',    'View Collectible Income',   'View collectible income records',                               'Collectible Income', NOW(), NOW()),
  ('collectible.create',  'Add Collectible Income',    'Add new collectible income entries',                             'Collectible Income', NOW(), NOW()),
  ('collectible.edit',    'Edit Collectible Income',   'Modify collectible income entries',                              'Collectible Income', NOW(), NOW()),
  -- Expenses
  ('expenses.view',       'View Expenses',             'View expense records',                                          'Expenses',           NOW(), NOW()),
  ('expenses.create',     'Add Expenses',              'Add new expense entries',                                        'Expenses',           NOW(), NOW()),
  ('expenses.edit',       'Edit Expenses',             'Modify expense entries',                                         'Expenses',           NOW(), NOW()),
  ('expenses.export',     'Export Expenses',           'Export expense data',                                            'Expenses',           NOW(), NOW()),
  -- Referrals
  ('referrals.view',      'View Referrals',            'View referral records',                                         'Referrals',          NOW(), NOW()),
  ('referrals.export',    'Export Referrals',          'Export referral data',                                           'Referrals',          NOW(), NOW()),
  -- Administration
  ('accounts.manage',     'Manage User Accounts',      'View, create, edit, and archive user accounts',                 'Administration',     NOW(), NOW()),
  ('referrals.manage',    'Manage Referrers',          'Add, edit, and archive referrers',                              'Administration',     NOW(), NOW()),
  ('roles.manage',        'Manage Roles',              'Create, edit, and delete roles and assign permissions',          'Administration',     NOW(), NOW()),
  ('activitylog.view',    'View Activity Logs',        'View system activity logs',                                     'Administration',     NOW(), NOW()),
  ('departments.manage',  'Manage Departments',        'Create, edit, and delete departments',                          'Administration',     NOW(), NOW()),
  ('tests.manage',        'Manage Tests',              'Create, edit, and delete tests',                                'Administration',     NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- 7. ASSIGN PERMISSIONS TO ROLES
-- =====================================================

-- Admin gets ALL permissions
INSERT INTO "RolePermissions" ("roleId", "permissionId", "createdAt", "updatedAt")
SELECT 1, "permissionId", NOW(), NOW()
FROM "Permissions"
ON CONFLICT DO NOTHING;

-- Receptionist gets standard permissions
INSERT INTO "RolePermissions" ("roleId", "permissionId", "createdAt", "updatedAt")
SELECT 2, p."permissionId", NOW(), NOW()
FROM "Permissions" p
WHERE p."permissionKey" IN (
  'dashboard.view',
  'transactions.view', 'transactions.create', 'transactions.edit', 'transactions.export',
  'collectible.view', 'collectible.create', 'collectible.edit',
  'expenses.view', 'expenses.create', 'expenses.edit', 'expenses.export',
  'referrals.view', 'referrals.export'
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 8. UPDATE EXISTING USERS WITH roleId
-- =====================================================
UPDATE "Users" u
SET "roleId" = r."roleId"
FROM "Roles" r
WHERE r."roleName" = u."role"
  AND u."roleId" IS NULL;

-- Default any remaining users without a role to receptionist
UPDATE "Users"
SET "roleId" = 2
WHERE "roleId" IS NULL;

COMMIT;

SELECT '✅ RBAC tables created and seeded (Roles, Permissions, RolePermissions + Users.roleId)' AS status;
