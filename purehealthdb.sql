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