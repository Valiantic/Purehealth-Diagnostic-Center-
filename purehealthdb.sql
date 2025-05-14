-- Users Table
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
);

-- Authenticators Table
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
);

CREATE TABLE Department (
  departmentId INT PRIMARY KEY AUTO_INCREMENT,
  departmentName VARCHAR(255) NOT NULL UNIQUE,
  testQuantity INT DEFAULT 0,
  status ENUM('active', 'inactive') DEFAULT 'active',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

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

CREATE TABLE `tests` (
  `testId` INT AUTO_INCREMENT PRIMARY KEY,
  `testName` VARCHAR(255) NOT NULL,
  `departmentId` INT NOT NULL,
  `price` DECIMAL(10, 2) NOT NULL,
  `status` ENUM('active', 'inactive') DEFAULT 'active',
  `dateCreated` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`departmentId`) REFERENCES `Departments`(`departmentId`) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create Transactions table
CREATE TABLE "Transactions" (
  "transactionId" VARCHAR(5) PRIMARY KEY,
  "mcNo" VARCHAR(5) NOT NULL CHECK ("mcNo" ~ '^[0-9]{5}$'),
  "firstName" VARCHAR(255) NOT NULL,
  "lastName" VARCHAR(255) NOT NULL,
  "idType" VARCHAR(255) NOT NULL DEFAULT 'Regular',
  "idNumber" VARCHAR(255) NOT NULL DEFAULT 'XXXX-XXXX',
  "referrerId" UUID,
  "birthDate" DATE,
  "sex" VARCHAR(255) NOT NULL DEFAULT 'Male',
  "transactionDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "totalAmount" DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  "totalDiscountAmount" DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  "totalCashAmount" DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  "totalGCashAmount" DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  "totalBalanceAmount" DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  "status" VARCHAR(255) NOT NULL DEFAULT 'active',
  "userId" UUID NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX "idx_referrer" ON "Transactions" ("referrerId");
CREATE INDEX "idx_user" ON "Transactions" ("userId");


-- Create TestDetails table
CREATE TABLE "TestDetails" (
  "testDetailId" VARCHAR(5) PRIMARY KEY,
  "transactionId" VARCHAR(5) NOT NULL,
  "testId" UUID NOT NULL,
  "testName" VARCHAR(255) NOT NULL,
  "departmentId" UUID NOT NULL,
  "originalPrice" DECIMAL(10, 2) NOT NULL,
  "discountPercentage" INTEGER NOT NULL DEFAULT 0,
  "discountedPrice" DECIMAL(10, 2) NOT NULL,
  "cashAmount" DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  "gCashAmount" DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  "balanceAmount" DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  "status" VARCHAR(255) NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX "idx_transaction" ON "TestDetails" ("transactionId");
CREATE INDEX "idx_test" ON "TestDetails" ("testId");
CREATE INDEX "idx_department" ON "TestDetails" ("departmentId");


-- Create DepartmentRevenues table
CREATE TABLE "DepartmentRevenues" (
  "revenueId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "departmentId" UUID NOT NULL,
  "transactionId" VARCHAR(5) NOT NULL,
  "testDetailId" VARCHAR(5) NOT NULL,
  "amount" DECIMAL(10, 2) NOT NULL,
  "revenueDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX "idx_dept_revenue" ON "DepartmentRevenues" ("departmentId");
CREATE INDEX "idx_trans_revenue" ON "DepartmentRevenues" ("transactionId");
CREATE INDEX "idx_testdetail_revenue" ON "DepartmentRevenues" ("testDetailId");
CREATE INDEX "idx_revenue_date" ON "DepartmentRevenues" ("revenueDate");

-- Create Expenses table
CREATE TABLE `Expenses` (
  `expenseId` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `departmentId` INT,
  `date` DATE NOT NULL DEFAULT CURRENT_DATE,
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
);

-- Create ExpenseItems table
CREATE TABLE `ExpenseItems` (
  `expenseItemId` INT NOT NULL AUTO_INCREMENT,
  `expenseId` INT NOT NULL,
  `paidTo` VARCHAR(255) NOT NULL,
  `purpose` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`expenseItemId`),
  INDEX `idx_expense_item_expense` (`expenseId`),
  CONSTRAINT `expenseitems_ibfk_1` FOREIGN KEY (`expenseId`) REFERENCES `Expenses` (`expenseId`) ON DELETE CASCADE ON UPDATE CASCADE
);