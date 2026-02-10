-- =============================================================================
-- FIX: Create missing CollectibleIncomeItems table
-- This table was missing from the original PostgreSQL schema but is required
-- by the CollectibleIncomeItems Sequelize model and the association with
-- CollectibleIncome (hasMany/belongsTo via companyId).
-- =============================================================================

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
