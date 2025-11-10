-- =============================================================================
-- PUREHEALTH DIAGNOSTIC CENTER DATABASE SCHEMA
-- =============================================================================
-- Database: purehealthdb
-- Version: 1.0
-- Description: Complete database schema for Purehealth Diagnostic Center
--              including user management, authentication, test management,
--              transactions, revenue tracking, and expense management
-- =============================================================================

-- =============================================================================
-- USER MANAGEMENT TABLES
-- =============================================================================

-- Users Table: Stores system users (admin and receptionist)
CREATE TABLE `Users` (
  `userId` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `firstName` varchar(255) NOT NULL,
  `middleName` varchar(255) DEFAULT NULL,
  `lastName` varchar(255) NOT NULL,
  `role` enum('admin','receptionist') NOT NULL DEFAULT 'receptionist',
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `currentChallenge` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`userId`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Authenticators Table: Stores WebAuthn authentication data for passwordless login
CREATE TABLE `Authenticators` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `credentialId` text NOT NULL,
  `credentialPublicKey` blob NOT NULL,
  `counter` int NOT NULL DEFAULT '0',
  `credentialDeviceType` varchar(255) NOT NULL,
  `credentialBackedUp` tinyint(1) NOT NULL DEFAULT '0',
  `transports` text,
  `isPrimary` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `Authenticators_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `Users` (`userId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =============================================================================
-- DEPARTMENT AND TEST MANAGEMENT TABLES
-- =============================================================================

-- Department Table: Stores medical departments/categories
CREATE TABLE `Department` (
  `departmentId` INT PRIMARY KEY AUTO_INCREMENT,
  `departmentName` VARCHAR(255) NOT NULL UNIQUE,
  `testQuantity` INT DEFAULT 0,
  `status` ENUM('active', 'inactive') DEFAULT 'active',
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tests Table: Stores medical tests offered by the diagnostic center
CREATE TABLE `tests` (
  `testId` INT AUTO_INCREMENT PRIMARY KEY,
  `testName` VARCHAR(255) NOT NULL,
  `departmentId` INT NOT NULL,
  `price` DECIMAL(10, 2) NOT NULL,
  `status` ENUM('active', 'inactive') DEFAULT 'active',
  `dateCreated` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`departmentId`) REFERENCES `Department`(`departmentId`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =============================================================================
-- REFERRER MANAGEMENT TABLES
-- =============================================================================

-- Referrers Table: Stores doctors/clinics that refer patients
CREATE TABLE `referrers` (
    `referrerId` INT PRIMARY KEY AUTO_INCREMENT,
    `firstName` VARCHAR(255) NOT NULL,
    `lastName` VARCHAR(255) NOT NULL,
    `birthday` DATE,
    `sex` ENUM('Male', 'Female') NOT NULL,
    `clinicName` VARCHAR(255),
    `clinicAddress` TEXT,
    `contactNo` VARCHAR(20),
    `status` ENUM('active', 'inactive') DEFAULT 'active',
    `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =============================================================================
-- ACTIVITY LOGGING TABLES
-- =============================================================================

-- Activity Logs Table: Tracks all user actions for audit purposes
CREATE TABLE `ActivityLogs` (
  `logId` int NOT NULL AUTO_INCREMENT,
  `userId` int DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `resourceType` varchar(255) NOT NULL,
  `resourceId` int DEFAULT NULL,
  `details` text,
  `ipAddress` varchar(45) DEFAULT NULL,
  `userInfo` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`logId`),
  KEY `activity_log_user_id` (`userId`),
  KEY `activity_log_action` (`action`),
  KEY `activity_log_resource_type` (`resourceType`),
  KEY `activity_log_created_at` (`createdAt`),
  CONSTRAINT `activitylogs_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `Users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =============================================================================
-- TRANSACTION AND TEST DETAILS TABLES
-- =============================================================================

-- Transactions Table: Stores patient transaction records
CREATE TABLE `Transactions` (
  `transactionId` VARCHAR(5) PRIMARY KEY,
  `mcNo` VARCHAR(10) NOT NULL,
  `firstName` VARCHAR(255) NOT NULL,
  `lastName` VARCHAR(255) NOT NULL,
  `idType` VARCHAR(255) NOT NULL DEFAULT 'Regular',
  `idNumber` VARCHAR(255) NOT NULL DEFAULT 'XXXX-XXXX',
  `referrerId` INT,
  `birthDate` DATE,
  `sex` VARCHAR(255) NOT NULL DEFAULT 'Male',
  `transactionDate` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `totalAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `totalDiscountAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `totalCashAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `totalGCashAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `totalBalanceAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `status` VARCHAR(255) NOT NULL DEFAULT 'active',
  `userId` INT NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`referrerId`) REFERENCES `referrers`(`referrerId`) ON DELETE SET NULL,
  FOREIGN KEY (`userId`) REFERENCES `Users`(`userId`) ON DELETE RESTRICT,
  INDEX `idx_referrer` (`referrerId`),
  INDEX `idx_user` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- Test Details Table: Stores individual test details for each transaction
CREATE TABLE `TestDetails` (
  `testDetailId` VARCHAR(5) PRIMARY KEY,
  `transactionId` VARCHAR(5) NOT NULL,
  `testId` INT NOT NULL,
  `testName` VARCHAR(255) NOT NULL,
  `departmentId` INT NOT NULL,
  `originalPrice` DECIMAL(10, 2) NOT NULL,
  `discountPercentage` INTEGER NOT NULL DEFAULT 0,
  `discountedPrice` DECIMAL(10, 2) NOT NULL,
  `cashAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `gCashAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `balanceAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `status` VARCHAR(255) NOT NULL DEFAULT 'active',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`transactionId`) REFERENCES `Transactions`(`transactionId`) ON DELETE CASCADE,
  FOREIGN KEY (`testId`) REFERENCES `tests`(`testId`) ON DELETE RESTRICT,
  FOREIGN KEY (`departmentId`) REFERENCES `Department`(`departmentId`) ON DELETE RESTRICT,
  INDEX `idx_transaction` (`transactionId`),
  INDEX `idx_test` (`testId`),
  INDEX `idx_department` (`departmentId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- =============================================================================
-- REVENUE TRACKING TABLES
-- =============================================================================

-- Department Revenues Table: Tracks revenue generated by each department
CREATE TABLE `DepartmentRevenues` (
  `revenueId` INT PRIMARY KEY AUTO_INCREMENT,
  `departmentId` INT NOT NULL,
  `transactionId` VARCHAR(5) NOT NULL,
  `testDetailId` VARCHAR(5) NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `revenueDate` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`departmentId`) REFERENCES `Department`(`departmentId`) ON DELETE RESTRICT,
  FOREIGN KEY (`transactionId`) REFERENCES `Transactions`(`transactionId`) ON DELETE CASCADE,
  FOREIGN KEY (`testDetailId`) REFERENCES `TestDetails`(`testDetailId`) ON DELETE CASCADE,
  INDEX `idx_dept_revenue` (`departmentId`),
  INDEX `idx_trans_revenue` (`transactionId`),
  INDEX `idx_testdetail_revenue` (`testDetailId`),
  INDEX `idx_revenue_date` (`revenueDate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =============================================================================
-- EXPENSE MANAGEMENT TABLES
-- =============================================================================

-- Categories Table: Stores expense categories for better organization
CREATE TABLE `Category` (
    `categoryId` INT PRIMARY KEY AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL UNIQUE,
    `status` ENUM('active', 'inactive') DEFAULT 'active',
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_category_name` (`name`),
    INDEX `idx_category_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Expenses Table: Stores expense records with person and department information
CREATE TABLE `Expenses` (
  `expenseId` INT NOT NULL AUTO_INCREMENT,
  `firstName` VARCHAR(255) NOT NULL,
  `lastName` VARCHAR(255) NOT NULL,
  `departmentId` INT,
  `date` DATE NOT NULL DEFAULT (CURRENT_DATE),
  `totalAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `userId` INT NOT NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'active',
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`expenseId`),
  INDEX `idx_expense_department` (`departmentId`),
  INDEX `idx_expense_user` (`userId`),
  CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `Users` (`userId`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `expenses_ibfk_2` FOREIGN KEY (`departmentId`) REFERENCES `Department` (`departmentId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Expense Items Table: Stores individual expense line items
CREATE TABLE `ExpenseItems` (
  `expenseItemId` INT NOT NULL AUTO_INCREMENT,
  `expenseId` INT NOT NULL,
  `paidTo` VARCHAR(255) NOT NULL,
  `categoryId` INT,
  `purpose` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `status` enum('pending', 'reimbursed','paid','refunded') NOT NULL DEFAULT 'pending',
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`expenseItemId`),
  INDEX `idx_expense_item_expense` (`expenseId`),
  INDEX `idx_expense_item_category` (`categoryId`),
  CONSTRAINT `expenseitems_ibfk_1` FOREIGN KEY (`expenseId`) REFERENCES `Expenses` (`expenseId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_expense_item_category` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`categoryId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =============================================================================
-- COLLECTIBLE INCOME TABLES
-- =============================================================================

-- Collectible Income Table: Tracks income from external companies/partners
CREATE TABLE `CollectibleIncome` (
  `companyId` INTEGER NOT NULL AUTO_INCREMENT,
  `companyName` VARCHAR(255) NOT NULL,
  `coordinatorName` VARCHAR(255) NOT NULL,
  `totalIncome` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `dateConducted` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`companyId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci; 

-- =============================================================================
-- REFERRERE REBATES TABLES
-- =============================================================================

-- Referrer Rebates Table: Stores rebate records for referrers
CREATE TABLE `ReferrerRebates` (
  `rebateId` INT PRIMARY KEY AUTO_INCREMENT,
  `referrerId` INT NOT NULL,
  `firstName` VARCHAR(255) NOT NULL,
  `lastName` VARCHAR(255) NOT NULL,
  `rebateDate` DATE NOT NULL,
  `totalRebateAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `transactionCount` INT NOT NULL DEFAULT 0,
  `status` ENUM('active', 'inactive') DEFAULT 'active',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`referrerId`) REFERENCES `referrers`(`referrerId`) ON DELETE CASCADE,
  UNIQUE KEY `unique_referrer_date` (`referrerId`, `rebateDate`),
  INDEX `idx_rebate_date` (`rebateDate`),
  INDEX `idx_rebate_referrer` (`referrerId`)
);

-- =============================================================================
-- HISTORICAL DATA MIGRATION NOTES
-- =============================================================================

-- Note: The following commented sections were used for schema migrations
-- and data updates during development. They are kept for reference.

/*
-- mcNo/OrNo Bug fix - already applied in main table definition

-- ALTER TABLE Transactions MODIFY COLUMN mcNo VARCHAR(10) NOT NULL;

-- Expense table name field split - already applied in main table definition

-- ALTER TABLE Expenses ADD COLUMN firstName VARCHAR(255) AFTER name;
-- ALTER TABLE Expenses ADD COLUMN lastName VARCHAR(255) AFTER firstName;
-- UPDATE Expenses SET firstName = TRIM(SUBSTRING_INDEX(name, ' ', 1)), 
--                   lastName = TRIM(SUBSTRING_INDEX(name, ' ', -1)) 
-- WHERE name IS NOT NULL AND name != '';
-- ALTER TABLE Expenses DROP COLUMN name;

-- Category field addition to ExpenseItems - already applied in main table definition

-- ALTER TABLE ExpenseItems ADD COLUMN categoryId INT AFTER paidTo;
-- ALTER TABLE ExpenseItems ADD INDEX idx_expense_item_category (categoryId);
-- ALTER TABLE ExpenseItems ADD CONSTRAINT fk_expense_item_category 
-- FOREIGN KEY (categoryId) REFERENCES Category(categoryId) ON DELETE SET NULL ON UPDATE CASCADE;

-- CollectibleIncome dateConducted field - already applied in main table definition

-- ALTER TABLE CollectibleIncome ADD COLUMN dateConducted DATETIME NOT NULL DEFAULT NOW() AFTER totalIncome;
-- UPDATE CollectibleIncome SET dateConducted = createdAt;

-- Categories table rename - handled in main table definition as Category

-- ALTER TABLE Categories RENAME TO Category;
*/