-- =============================================================================
-- PUREHEALTH DIAGNOSTIC CENTER DATABASE SCHEMA (PostgreSQL Version)
-- =============================================================================

-- =============================================================================
-- USER MANAGEMENT TABLES
-- =============================================================================

CREATE TABLE Users (
  userId SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  firstName VARCHAR(255) NOT NULL,
  middleName VARCHAR(255),
  lastName VARCHAR(255) NOT NULL,
  role VARCHAR(50) CHECK (role IN ('admin','receptionist')) DEFAULT 'receptionist',
  status VARCHAR(50) CHECK (status IN ('active','inactive')) DEFAULT 'active',
  currentChallenge VARCHAR(255),
  createdAt TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP NOT NULL
);

CREATE TABLE Authenticators (
  id SERIAL PRIMARY KEY,
  userId INTEGER NOT NULL,
  credentialId TEXT NOT NULL,
  credentialPublicKey BYTEA NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  credentialDeviceType VARCHAR(255) NOT NULL,
  credentialBackedUp BOOLEAN NOT NULL DEFAULT FALSE,
  transports TEXT,
  isPrimary BOOLEAN NOT NULL DEFAULT TRUE,
  createdAt TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP NOT NULL,
  FOREIGN KEY (userId) REFERENCES Users(userId) ON DELETE CASCADE
);

-- =============================================================================
-- DEPARTMENT AND TEST MANAGEMENT TABLES
-- =============================================================================

CREATE TABLE Department (
  departmentId SERIAL PRIMARY KEY,
  departmentName VARCHAR(255) NOT NULL UNIQUE,
  testQuantity INTEGER DEFAULT 0,
  status VARCHAR(50) CHECK (status IN ('active','inactive')) DEFAULT 'active',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Tests (
  testId SERIAL PRIMARY KEY,
  testName VARCHAR(255) NOT NULL,
  departmentId INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) CHECK (status IN ('active','inactive')) DEFAULT 'active',
  dateCreated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (departmentId) REFERENCES Department(departmentId) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- =============================================================================
-- REFERRER MANAGEMENT TABLES
-- =============================================================================

CREATE TABLE Referrers (
  referrerId SERIAL PRIMARY KEY,
  firstName VARCHAR(255) NOT NULL,
  lastName VARCHAR(255) NOT NULL,
  birthday DATE,
  sex VARCHAR(10) CHECK (sex IN ('Male','Female')) NOT NULL,
  clinicName VARCHAR(255),
  clinicAddress TEXT,
  contactNo VARCHAR(20),
  status VARCHAR(50) CHECK (status IN ('active','inactive')) DEFAULT 'active',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- ACTIVITY LOGGING TABLES
-- =============================================================================

CREATE TABLE ActivityLogs (
  logId SERIAL PRIMARY KEY,
  userId INTEGER,
  action VARCHAR(255) NOT NULL,
  resourceType VARCHAR(255) NOT NULL,
  resourceId INTEGER,
  details TEXT,
  ipAddress VARCHAR(45),
  userInfo TEXT,
  createdAt TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP NOT NULL,
  FOREIGN KEY (userId) REFERENCES Users(userId) ON DELETE SET NULL ON UPDATE CASCADE
);

-- =============================================================================
-- TRANSACTION AND TEST DETAILS TABLES
-- =============================================================================

CREATE TABLE Transactions (
  transactionId VARCHAR(5) PRIMARY KEY,
  mcNo VARCHAR(10) NOT NULL,
  firstName VARCHAR(255) NOT NULL,
  lastName VARCHAR(255) NOT NULL,
  idType VARCHAR(255) NOT NULL DEFAULT 'Regular',
  idNumber VARCHAR(255) NOT NULL DEFAULT 'XXXX-XXXX',
  referrerId INTEGER,
  birthDate DATE,
  sex VARCHAR(50) DEFAULT 'Male',
  transactionDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  totalAmount DECIMAL(10, 2) DEFAULT 0.00,
  totalDiscountAmount DECIMAL(10, 2) DEFAULT 0.00,
  totalCashAmount DECIMAL(10, 2) DEFAULT 0.00,
  totalGCashAmount DECIMAL(10, 2) DEFAULT 0.00,
  totalBalanceAmount DECIMAL(10, 2) DEFAULT 0.00,
  status VARCHAR(255) NOT NULL DEFAULT 'active',
  userId INTEGER NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (referrerId) REFERENCES Referrers(referrerId) ON DELETE SET NULL,
  FOREIGN KEY (userId) REFERENCES Users(userId) ON DELETE RESTRICT
);

CREATE TABLE TestDetails (
  testDetailId VARCHAR(5) PRIMARY KEY,
  transactionId VARCHAR(5) NOT NULL,
  testId INTEGER NOT NULL,
  testName VARCHAR(255) NOT NULL,
  departmentId INTEGER NOT NULL,
  originalPrice DECIMAL(10, 2) NOT NULL,
  discountPercentage INTEGER NOT NULL DEFAULT 0,
  discountedPrice DECIMAL(10, 2) NOT NULL,
  cashAmount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  gCashAmount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  balanceAmount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  status VARCHAR(255) NOT NULL DEFAULT 'active',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (transactionId) REFERENCES Transactions(transactionId) ON DELETE CASCADE,
  FOREIGN KEY (testId) REFERENCES Tests(testId) ON DELETE RESTRICT,
  FOREIGN KEY (departmentId) REFERENCES Department(departmentId) ON DELETE RESTRICT
);

-- =============================================================================
-- REVENUE TRACKING TABLES
-- =============================================================================

CREATE TABLE DepartmentRevenues (
  revenueId SERIAL PRIMARY KEY,
  departmentId INTEGER NOT NULL,
  transactionId VARCHAR(5) NOT NULL,
  testDetailId VARCHAR(5) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  revenueDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (departmentId) REFERENCES Department(departmentId) ON DELETE RESTRICT,
  FOREIGN KEY (transactionId) REFERENCES Transactions(transactionId) ON DELETE CASCADE,
  FOREIGN KEY (testDetailId) REFERENCES TestDetails(testDetailId) ON DELETE CASCADE
);

-- =============================================================================
-- EXPENSE MANAGEMENT TABLES
-- =============================================================================

CREATE TABLE Category (
  categoryId SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) CHECK (status IN ('active','inactive')) DEFAULT 'active',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Expenses (
  expenseId SERIAL PRIMARY KEY,
  firstName VARCHAR(255) NOT NULL,
  lastName VARCHAR(255) NOT NULL,
  departmentId INTEGER,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  totalAmount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  userId INTEGER NOT NULL,
  status VARCHAR(255) NOT NULL DEFAULT 'active',
  createdAt TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP NOT NULL,
  FOREIGN KEY (userId) REFERENCES Users(userId) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (departmentId) REFERENCES Department(departmentId) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE ExpenseItems (
  expenseItemId SERIAL PRIMARY KEY,
  expenseId INTEGER NOT NULL,
  paidTo VARCHAR(255) NOT NULL,
  categoryId INTEGER,
  purpose VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) CHECK (status IN ('pending','paid','refunded')) DEFAULT 'pending',
  createdAt TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP NOT NULL,
  FOREIGN KEY (expenseId) REFERENCES Expenses(expenseId) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (categoryId) REFERENCES Category(categoryId) ON DELETE SET NULL ON UPDATE CASCADE
);

-- =============================================================================
-- COLLECTIBLE INCOME TABLES
-- =============================================================================

CREATE TABLE CollectibleIncome (
  companyId SERIAL PRIMARY KEY,
  companyName VARCHAR(255) NOT NULL,
  coordinatorName VARCHAR(255) NOT NULL,
  totalIncome DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  dateConducted TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  createdAt TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP NOT NULL
);
