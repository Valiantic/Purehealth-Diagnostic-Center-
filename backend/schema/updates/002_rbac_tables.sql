-- RBAC Schema Update
-- Purpose: Add Role-Based Access Control tables for dynamic role and permission management
-- Date: 2026-02-02

-- =====================================================
-- 1. CREATE ROLES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS `Roles` (
  `roleId` INT NOT NULL AUTO_INCREMENT,
  `roleName` VARCHAR(50) NOT NULL,
  `displayName` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `isSystem` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'System roles cannot be deleted',
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`roleId`),
  UNIQUE KEY `role_name_unique` (`roleName`),
  INDEX `role_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. CREATE PERMISSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS `Permissions` (
  `permissionId` INT NOT NULL AUTO_INCREMENT,
  `permissionKey` VARCHAR(100) NOT NULL COMMENT 'Format: category.action (e.g., transactions.view)',
  `displayName` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `category` VARCHAR(50) NOT NULL COMMENT 'Permission grouping for UI',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`permissionId`),
  UNIQUE KEY `permission_key_unique` (`permissionKey`),
  INDEX `permission_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. CREATE ROLE_PERMISSIONS JUNCTION TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS `RolePermissions` (
  `roleId` INT NOT NULL,
  `permissionId` INT NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`roleId`, `permissionId`),
  INDEX `role_permission_role` (`roleId`),
  INDEX `role_permission_permission` (`permissionId`),
  CONSTRAINT `fk_roleperm_role` FOREIGN KEY (`roleId`) REFERENCES `Roles` (`roleId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_roleperm_permission` FOREIGN KEY (`permissionId`) REFERENCES `Permissions` (`permissionId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. SEED DEFAULT SYSTEM ROLES (Admin & Receptionist only)
-- =====================================================
INSERT INTO `Roles` (`roleName`, `displayName`, `description`, `isSystem`, `status`, `createdAt`, `updatedAt`) VALUES
('admin', 'Administrator', 'Full system access with all permissions', 1, 'active', NOW(), NOW()),
('receptionist', 'Receptionist', 'Standard user with transaction and basic operations access', 1, 'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE `displayName` = VALUES(`displayName`);

-- =====================================================
-- 5. SEED DEFAULT PERMISSIONS
-- =====================================================
INSERT INTO `Permissions` (`permissionKey`, `displayName`, `description`, `category`, `createdAt`, `updatedAt`) VALUES
-- Dashboard
('dashboard.view', 'View Dashboard', 'Access to view the main dashboard', 'Dashboard', NOW(), NOW()),

-- Transactions
('transactions.view', 'View Transactions', 'View transaction records', 'Transactions', NOW(), NOW()),
('transactions.create', 'Create Transactions', 'Add new transactions', 'Transactions', NOW(), NOW()),
('transactions.edit', 'Edit Transactions', 'Modify existing transactions', 'Transactions', NOW(), NOW()),
('transactions.cancel', 'Cancel Transactions', 'Cancel pending transactions', 'Transactions', NOW(), NOW()),
('transactions.refund', 'Refund Transactions', 'Process transaction refunds', 'Transactions', NOW(), NOW()),
('transactions.export', 'Export Transactions', 'Export transaction data', 'Transactions', NOW(), NOW()),

-- Collectible Income
('collectible.view', 'View Collectible Income', 'View collectible income records', 'Collectible Income', NOW(), NOW()),
('collectible.create', 'Add Collectible Income', 'Add new collectible income entries', 'Collectible Income', NOW(), NOW()),
('collectible.edit', 'Edit Collectible Income', 'Modify collectible income entries', 'Collectible Income', NOW(), NOW()),

-- Expenses
('expenses.view', 'View Expenses', 'View expense records', 'Expenses', NOW(), NOW()),
('expenses.create', 'Add Expenses', 'Add new expense entries', 'Expenses', NOW(), NOW()),
('expenses.edit', 'Edit Expenses', 'Modify expense entries', 'Expenses', NOW(), NOW()),
('expenses.export', 'Export Expenses', 'Export expense data', 'Expenses', NOW(), NOW()),

-- Referrals
('referrals.view', 'View Referrals', 'View referral records', 'Referrals', NOW(), NOW()),
('referrals.export', 'Export Referrals', 'Export referral data', 'Referrals', NOW(), NOW()),

-- User Accounts & Administration
('accounts.manage', 'Manage User Accounts', 'View, create, edit, and archive user accounts', 'Administration', NOW(), NOW()),
('referrals.manage', 'Manage Referrers', 'Add, edit, and archive referrers', 'Administration', NOW(), NOW()),

-- Roles & Permissions
('roles.manage', 'Manage Roles', 'Create, edit, and delete roles and assign permissions', 'Administration', NOW(), NOW()),

-- Activity Logs
('activitylog.view', 'View Activity Logs', 'View system activity logs', 'Administration', NOW(), NOW()),

-- Department Management
('departments.manage', 'Manage Departments', 'Create, edit, and delete departments', 'Administration', NOW(), NOW()),

-- Test Management
('tests.manage', 'Manage Tests', 'Create, edit, and delete tests', 'Administration', NOW(), NOW())
ON DUPLICATE KEY UPDATE `displayName` = VALUES(`displayName`);

-- =====================================================
-- 6. ASSIGN DEFAULT PERMISSIONS TO SYSTEM ROLES
-- =====================================================

-- Get role IDs
SET @adminRoleId = (SELECT roleId FROM Roles WHERE roleName = 'admin');
SET @receptionistRoleId = (SELECT roleId FROM Roles WHERE roleName = 'receptionist');

-- Admin gets ALL permissions
INSERT INTO `RolePermissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT @adminRoleId, permissionId, NOW(), NOW() FROM Permissions
ON DUPLICATE KEY UPDATE `updatedAt` = NOW();

-- Receptionist gets standard permissions (no admin, roles, activity log, department/test management)
INSERT INTO `RolePermissions` (`roleId`, `permissionId`, `createdAt`, `updatedAt`)
SELECT @receptionistRoleId, p.permissionId, NOW(), NOW()
FROM Permissions p
WHERE p.permissionKey IN (
  'dashboard.view',
  'transactions.view', 'transactions.create', 'transactions.edit', 'transactions.export',
  'collectible.view', 'collectible.create', 'collectible.edit',
  'expenses.view', 'expenses.create', 'expenses.edit', 'expenses.export',
  'referrals.view', 'referrals.export'
)
ON DUPLICATE KEY UPDATE `updatedAt` = NOW();

-- =====================================================
-- 7. ADD roleId COLUMN TO USERS TABLE (if not exists)
-- =====================================================
-- Check if column exists and add it
SET @columnExists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'Users' 
  AND COLUMN_NAME = 'roleId'
);

-- Add roleId column if it doesn't exist
SET @addColumnSQL = IF(@columnExists = 0,
  'ALTER TABLE `Users` ADD COLUMN `roleId` INT NULL AFTER `role`',
  'SELECT "roleId column already exists"'
);
PREPARE stmt FROM @addColumnSQL;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- 8. MIGRATE EXISTING USER ROLES TO roleId
-- =====================================================
UPDATE `Users` u
SET u.roleId = (SELECT r.roleId FROM Roles r WHERE r.roleName = u.role)
WHERE u.roleId IS NULL AND u.role IS NOT NULL;

-- Set default roleId for any users without a role
UPDATE `Users` 
SET roleId = @receptionistRoleId 
WHERE roleId IS NULL;

-- =====================================================
-- 9. ADD FOREIGN KEY CONSTRAINT (after migration)
-- =====================================================
-- Note: Run this after confirming migration is complete
-- ALTER TABLE `Users` 
-- ADD CONSTRAINT `fk_user_role` FOREIGN KEY (`roleId`) REFERENCES `Roles` (`roleId`) ON UPDATE CASCADE;

-- ALTER TABLE `Users` MODIFY COLUMN `roleId` INT NOT NULL;
-- ALTER TABLE `Users` DROP COLUMN `role`;

SELECT 'RBAC Schema Update Complete!' AS Status;
