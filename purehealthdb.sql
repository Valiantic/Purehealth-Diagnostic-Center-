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