-- =============================================================================
-- FIX: ExpenseItems status CHECK constraint
-- The original schema only allowed ('pending','paid','refunded') but the
-- Sequelize model uses ('pending','reimbursed','paid','cancelled').
-- This script updates the constraint to match the model.
-- =============================================================================

-- Drop the old CHECK constraint
ALTER TABLE "ExpenseItems" DROP CONSTRAINT IF EXISTS "ExpenseItems_status_check";

-- Add the corrected CHECK constraint
ALTER TABLE "ExpenseItems" ADD CONSTRAINT "ExpenseItems_status_check" 
  CHECK (status IN ('pending', 'paid', 'reimbursed', 'cancelled'));

-- Update any existing 'refunded' values to 'reimbursed' (if any exist)
UPDATE "ExpenseItems" SET status = 'reimbursed' WHERE status = 'refunded';
