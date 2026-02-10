-- =============================================================================
-- COMBINED FIX: All PostgreSQL schema issues for deployed database
-- Run this script on the deployed Render PostgreSQL database to fix all bugs.
-- =============================================================================
-- Fixes:
-- 1. Transactions: Add missing referralFeePercentage column
-- 2. DepartmentRevenues: Add missing status and metadata columns
-- 3. ExpenseItems: Fix status CHECK constraint (add 'reimbursed', 'cancelled')
-- 4. CollectibleIncomeItems: Create missing table
-- 5. Reset all SERIAL sequences to match existing data (prevents duplicate PK)
-- =============================================================================

-- 1. Add referralFeePercentage column to Transactions
ALTER TABLE "Transactions" 
  ADD COLUMN IF NOT EXISTS "referralFeePercentage" DECIMAL(5, 2) NOT NULL DEFAULT 20.00;

-- 2. Add missing columns to DepartmentRevenues
ALTER TABLE "DepartmentRevenues" 
  ADD COLUMN IF NOT EXISTS "status" VARCHAR(255) NOT NULL DEFAULT 'active';

ALTER TABLE "DepartmentRevenues" 
  ADD COLUMN IF NOT EXISTS "metadata" JSONB DEFAULT '{}';

-- 3. Fix ExpenseItems status CHECK constraint
ALTER TABLE "ExpenseItems" DROP CONSTRAINT IF EXISTS "ExpenseItems_status_check";
ALTER TABLE "ExpenseItems" ADD CONSTRAINT "ExpenseItems_status_check" 
  CHECK (status IN ('pending', 'paid', 'reimbursed', 'cancelled'));

-- Update any existing 'refunded' values to 'reimbursed'
UPDATE "ExpenseItems" SET status = 'reimbursed' WHERE status = 'refunded';

-- 4. Create missing CollectibleIncomeItems table
CREATE TABLE IF NOT EXISTS "CollectibleIncomeItems" (
  "itemId" SERIAL PRIMARY KEY,
  "companyId" INTEGER NOT NULL,
  "testName" VARCHAR(255) NOT NULL,
  "unitPrice" DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("companyId") REFERENCES "CollectibleIncome"("companyId") ON DELETE CASCADE
);

-- 5. Reset all SERIAL sequences to match existing data
-- When rows are inserted with explicit IDs (e.g. via migrations/SQL), the
-- PostgreSQL sequence doesn't advance. The next INSERT with DEFAULT then
-- generates a value that already exists, causing "duplicate key" errors.
SELECT setval('"Roles_roleId_seq"',        COALESCE((SELECT MAX("roleId")        FROM "Roles"), 0) + 1, false);
SELECT setval('"Permissions_permissionId_seq"', COALESCE((SELECT MAX("permissionId") FROM "Permissions"), 0) + 1, false);
SELECT setval('"Users_userId_seq"',         COALESCE((SELECT MAX("userId")         FROM "Users"), 0) + 1, false);
SELECT setval('"Department_departmentId_seq"',  COALESCE((SELECT MAX("departmentId")  FROM "Department"), 0) + 1, false);
SELECT setval('"Tests_testId_seq"',         COALESCE((SELECT MAX("testId")         FROM "Tests"), 0) + 1, false);
SELECT setval('"Referrers_referrerId_seq"', COALESCE((SELECT MAX("referrerId")     FROM "Referrers"), 0) + 1, false);
SELECT setval('"Category_categoryId_seq"',  COALESCE((SELECT MAX("categoryId")     FROM "Category"), 0) + 1, false);
SELECT setval('"Expenses_expenseId_seq"',   COALESCE((SELECT MAX("expenseId")      FROM "Expenses"), 0) + 1, false);
SELECT setval('"ExpenseItems_expenseItemId_seq"', COALESCE((SELECT MAX("expenseItemId") FROM "ExpenseItems"), 0) + 1, false);
SELECT setval('"DepartmentRevenues_revenueId_seq"', COALESCE((SELECT MAX("revenueId") FROM "DepartmentRevenues"), 0) + 1, false);
SELECT setval('"CollectibleIncome_companyId_seq"', COALESCE((SELECT MAX("companyId")  FROM "CollectibleIncome"), 0) + 1, false);
SELECT setval('"ActivityLogs_logId_seq"',   COALESCE((SELECT MAX("logId")          FROM "ActivityLogs"), 0) + 1, false);
