-- =============================================================================
-- CLEANUP: Remove all mock data that was incorrectly inserted
-- Run this FIRST before re-importing the corrected mock data.
-- =============================================================================

BEGIN;

-- Delete in reverse dependency order

-- RolePermissions (depends on Roles & Permissions)
DELETE FROM "RolePermissions";

-- Permissions
DELETE FROM "Permissions";

-- Roles
DELETE FROM "Roles";

-- Reset roleId on Users (undo the UPDATE we did)
UPDATE "Users" SET "roleId" = NULL;

-- ExpenseItems (depends on Expenses)
DELETE FROM "ExpenseItems";

-- Expenses
DELETE FROM "Expenses";

-- ReferrerRebates
DELETE FROM "ReferrerRebates";

-- TestDetails (depends on Transactions & tests)
DELETE FROM "TestDetails";

-- Transactions
DELETE FROM "Transactions";

-- Category
DELETE FROM "Category";

-- referrers
DELETE FROM "referrers";

-- tests
DELETE FROM "tests";

-- Departments
DELETE FROM "Departments";

-- Reset all sequences
SELECT setval(pg_get_serial_sequence('"Departments"', 'departmentId'), 1, false);
SELECT setval(pg_get_serial_sequence('"tests"', 'testId'), 1, false);
SELECT setval(pg_get_serial_sequence('"referrers"', 'referrerId'), 1, false);
SELECT setval(pg_get_serial_sequence('"Category"', 'categoryId'), 1, false);
SELECT setval(pg_get_serial_sequence('"Expenses"', 'expenseId'), 1, false);
SELECT setval(pg_get_serial_sequence('"ExpenseItems"', 'expenseItemId'), 1, false);
SELECT setval(pg_get_serial_sequence('"ReferrerRebates"', 'rebateId'), 1, false);
SELECT setval(pg_get_serial_sequence('"Roles"', 'roleId'), 1, false);
SELECT setval(pg_get_serial_sequence('"Permissions"', 'permissionId'), 1, false);

COMMIT;

SELECT 'Cleanup complete! All mock data removed.' AS status;
