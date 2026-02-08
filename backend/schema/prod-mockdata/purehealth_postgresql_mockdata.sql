-- =============================================================================
-- PUREHEALTH DIAGNOSTIC CENTER - POSTGRESQL MOCK DATA
-- =============================================================================
-- SCOPE: Departments, Tests (real data), Roles, Permissions, RolePermissions
-- NO transactions, referrers, expenses, or other unrelated data.
-- =============================================================================

BEGIN;

-- =====================================================
-- 1. DEPARTMENTS
-- =====================================================
INSERT INTO "Departments" ("departmentId", "departmentName", "testQuantity", "status", "createdAt", "updatedAt")
VALUES
  (1, 'Laboratory',              20, 'active', NOW(), NOW()),
  (2, 'Ultrasound',              10, 'active', NOW(), NOW()),
  (3, 'ECG / 2D Echo',            5, 'active', NOW(), NOW()),
  (4, 'X-Ray',                    5, 'active', NOW(), NOW()),
  (5, 'COVID Tests',              3, 'active', NOW(), NOW()),
  (6, 'Pre-Employment Packages',  3, 'active', NOW(), NOW()),
  (7, 'Pre-Natal Packages',       2, 'active', NOW(), NOW()),
  (8, 'Blood Chemistry Packages', 2, 'active', NOW(), NOW())
ON CONFLICT ("departmentId") DO NOTHING;

SELECT setval(pg_get_serial_sequence('"Departments"', 'departmentId'), COALESCE((SELECT MAX("departmentId") FROM "Departments"), 1));

-- =====================================================
-- 2. TESTS (real data with correct prices)
-- =====================================================
INSERT INTO "tests" ("testId", "testName", "departmentId", "price", "status", "dateCreated", "createdAt", "updatedAt")
VALUES
-- LABORATORY (departmentId = 1)
( 1, 'CBC + Platelet Count',        1,   260.00, 'active', NOW(), NOW(), NOW()),
( 2, 'Blood Typing with RH Typing', 1,   320.00, 'active', NOW(), NOW(), NOW()),
( 3, 'ESR',                         1,   130.00, 'active', NOW(), NOW(), NOW()),
( 4, 'FBS',                         1,   150.00, 'active', NOW(), NOW(), NOW()),
( 5, 'BUN',                         1,   155.00, 'active', NOW(), NOW(), NOW()),
( 6, 'Creatinine',                  1,   155.00, 'active', NOW(), NOW(), NOW()),
( 7, 'Cholesterol',                 1,   155.00, 'active', NOW(), NOW(), NOW()),
( 8, 'Triglycerides',               1,   255.00, 'active', NOW(), NOW(), NOW()),
( 9, 'HDL',                         1,   255.00, 'active', NOW(), NOW(), NOW()),
(10, 'LDL',                         1,   255.00, 'active', NOW(), NOW(), NOW()),
(11, 'SGOT',                        1,   260.00, 'active', NOW(), NOW(), NOW()),
(12, 'SGPT',                        1,   260.00, 'active', NOW(), NOW(), NOW()),
(13, 'VDRL/RPR',                    1,   260.00, 'active', NOW(), NOW(), NOW()),
(14, 'Widal Test',                  1,   380.00, 'active', NOW(), NOW(), NOW()),
(15, 'Urinalysis',                  1,   105.00, 'active', NOW(), NOW(), NOW()),
(16, 'Fecalysis',                   1,   105.00, 'active', NOW(), NOW(), NOW()),
(17, 'Albumin',                     1,   410.00, 'active', NOW(), NOW(), NOW()),
(18, 'Pregnancy Test Urine',        1,   350.00, 'active', NOW(), NOW(), NOW()),
(19, 'TSH',                         1,   710.00, 'active', NOW(), NOW(), NOW()),
(20, 'HIV Test',                    1,   760.00, 'active', NOW(), NOW(), NOW()),

-- ULTRASOUND (departmentId = 2)
(21, 'Pelvic Ultrasound',                2,   470.00, 'active', NOW(), NOW(), NOW()),
(22, 'Biophysical Profile',              2,   810.00, 'active', NOW(), NOW(), NOW()),
(23, 'Transvaginal Non-Pregnant',        2,  1000.00, 'active', NOW(), NOW(), NOW()),
(24, 'Liver Ultrasound',                 2,   550.00, 'active', NOW(), NOW(), NOW()),
(25, 'Kidneys Ultrasound',               2,   650.00, 'active', NOW(), NOW(), NOW()),
(26, 'Prostate Ultrasound',              2,   900.00, 'active', NOW(), NOW(), NOW()),
(27, 'Thyroid Ultrasound',               2,  1550.00, 'active', NOW(), NOW(), NOW()),
(28, 'Neck Ultrasound',                  2,  1750.00, 'active', NOW(), NOW(), NOW()),
(29, 'Breast Ultrasound',                2,  1550.00, 'active', NOW(), NOW(), NOW()),
(30, 'Whole Abdomen Ultrasound',         2,  2250.00, 'active', NOW(), NOW(), NOW()),

-- ECG / 2D ECHO (departmentId = 3)
(31, 'ECG',                              3,   380.00, 'active', NOW(), NOW(), NOW()),
(32, 'ECG Pedia',                        3,   660.00, 'active', NOW(), NOW(), NOW()),
(33, '2D-Echo Plain',                    3,  2200.00, 'active', NOW(), NOW(), NOW()),
(34, '2D-Echo Colored Doppler Study',    3,  3500.00, 'active', NOW(), NOW(), NOW()),
(35, '2D-Echo Pedia',                    3,  4000.00, 'active', NOW(), NOW(), NOW()),

-- X-RAY (departmentId = 4)
(36, 'Chest PA X-Ray',                      4,   310.00, 'active', NOW(), NOW(), NOW()),
(37, 'Chest AP-Lateral Adult/Pedia X-Ray',  4,   510.00, 'active', NOW(), NOW(), NOW()),
(38, 'Shoulder X-Ray',                      4,   710.00, 'active', NOW(), NOW(), NOW()),
(39, 'Thoracolumbar Spine X-Ray',           4,  1310.00, 'active', NOW(), NOW(), NOW()),
(40, 'Skull X-Ray',                          4,   660.00, 'active', NOW(), NOW(), NOW()),

-- COVID TESTS (departmentId = 5)
(41, 'Rapid Antibody COVID Test',        5,   600.00, 'active', NOW(), NOW(), NOW()),
(42, 'Swab Antigen COVID Test',          5,   370.00, 'active', NOW(), NOW(), NOW()),
(43, 'RT-PCR COVID Test',                5,  2020.00, 'active', NOW(), NOW(), NOW()),

-- PRE-EMPLOYMENT PACKAGES (departmentId = 6)
(44, 'Pre-Employment Package 1',         6,   410.00, 'active', NOW(), NOW(), NOW()),
(45, 'Pre-Employment Package 2',         6,   510.00, 'active', NOW(), NOW(), NOW()),
(46, 'Pre-Employment Package 3',         6,   610.00, 'active', NOW(), NOW(), NOW()),

-- PRE-NATAL PACKAGES (departmentId = 7)
(47, 'Pre-Natal Package 1',              7,   820.00, 'active', NOW(), NOW(), NOW()),
(48, 'Pre-Natal Package 2',              7,  1100.00, 'active', NOW(), NOW(), NOW()),

-- BLOOD CHEMISTRY PACKAGES (departmentId = 8)
(49, 'Chem 5 Package',                   8,   620.00, 'active', NOW(), NOW(), NOW()),
(50, 'Chem 6 Package',                   8,   860.00, 'active', NOW(), NOW(), NOW())
ON CONFLICT ("testId") DO NOTHING;

SELECT setval(pg_get_serial_sequence('"tests"', 'testId'), COALESCE((SELECT MAX("testId") FROM "tests"), 1));

-- =====================================================
-- 3. RBAC - ROLES
-- =====================================================
INSERT INTO "Roles" ("roleId", "roleName", "displayName", "description", "isSystem", "status", "createdAt", "updatedAt")
VALUES
(1, 'admin',        'Administrator', 'Full system access with all permissions',                    TRUE,  'active', NOW(), NOW()),
(2, 'receptionist', 'Receptionist',  'Standard user with transaction and basic operations access', TRUE,  'active', NOW(), NOW())
ON CONFLICT ("roleId") DO NOTHING;

SELECT setval(pg_get_serial_sequence('"Roles"', 'roleId'), COALESCE((SELECT MAX("roleId") FROM "Roles"), 1));

-- =====================================================
-- 4. RBAC - PERMISSIONS
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
ON CONFLICT ("permissionKey") DO NOTHING;

-- =====================================================
-- 5. RBAC - ASSIGN PERMISSIONS TO ROLES
-- =====================================================

-- Admin gets ALL permissions
INSERT INTO "RolePermissions" ("roleId", "permissionId", "createdAt", "updatedAt")
SELECT 1, "permissionId", NOW(), NOW()
FROM "Permissions"
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

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
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- =====================================================
-- 6. UPDATE USERS WITH roleId
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

SELECT 'Mock Data Import Complete! (Departments, Tests, Roles, Permissions, RolePermissions)' AS status;
