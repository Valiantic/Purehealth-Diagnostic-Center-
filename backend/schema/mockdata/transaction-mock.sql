-- Mock Data for Testing Seasonal Forecasting (MySQL Compatible)
-- 50 transactions over 30 days with Expenses, ExpenseItems, and ReferrerRebates

-- Ensure user exists
INSERT IGNORE INTO `Users` (`userId`, `email`, `firstName`, `lastName`, `role`, `status`, `createdAt`, `updatedAt`)
VALUES (1, 'admin@purehealth.com', 'Admin', 'User', 'admin', 'active', NOW(), NOW());

-- Ensure Rebates category exists
INSERT IGNORE INTO `Category` (`categoryId`, `name`, `status`, `createdAt`, `updatedAt`)
VALUES (1, 'Rebates', 'active', NOW(), NOW());

-- ============================================

-- Transaction dates: from yesterday (2026-01-27) back 30 days
INSERT IGNORE INTO `Transactions` (
  `transactionId`, `mcNo`, `firstName`, `lastName`, `idType`, `idNumber`, 
  `referrerId`, `birthDate`, `sex`, `transactionDate`, 
  `totalAmount`, `totalDiscountAmount`, `totalCashAmount`, `totalGCashAmount`, `totalBalanceAmount`,
  `status`, `userId`, `createdAt`, `updatedAt`
) VALUES
('10001', '20001', 'Anna', 'Cruz', 'Regular', 'XXXX-XXXX', NULL, '1985-03-15', 'Female', '2026-01-27 09:30:00', 1800.00, 0.00, 1800.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10002', '20002', 'Mark', 'Santos', 'Senior', 'SC-12345', 2, '1958-07-22', 'Male', '2026-01-27 11:00:00', 1500.00, 300.00, 1200.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10003', '20003', 'Lisa', 'Reyes', 'Regular', 'XXXX-XXXX', 1, '1990-11-08', 'Female', '2026-01-26 10:15:00', 2800.00, 0.00, 2000.00, 800.00, 0.00, 'active', 1, NOW(), NOW()),
('10004', '20004', 'Jose', 'Garcia', 'Regular', 'XXXX-XXXX', NULL, '1982-05-30', 'Male', '2026-01-26 14:30:00', 2200.00, 0.00, 2200.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10005', '20005', 'Maria', 'Mendoza', 'PWD', 'PWD-98765', 3, '1975-09-12', 'Female', '2026-01-25 08:45:00', 4500.00, 900.00, 3600.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10006', '20006', 'Robert', 'Tan', 'Regular', 'XXXX-XXXX', NULL, '1988-02-28', 'Male', '2026-01-25 10:00:00', 3200.00, 0.00, 3200.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10007', '20007', 'Carmen', 'Lim', 'Regular', 'XXXX-XXXX', 4, '1992-06-17', 'Female', '2026-01-25 13:30:00', 2800.00, 0.00, 1500.00, 1300.00, 0.00, 'active', 1, NOW(), NOW()),
('10008', '20008', 'David', 'Chua', 'Regular', 'XXXX-XXXX', NULL, '1979-12-03', 'Male', '2026-01-24 09:00:00', 3500.00, 0.00, 3500.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10009', '20009', 'Helen', 'Villa', 'Senior', 'SC-54321', 5, '1955-04-20', 'Female', '2026-01-24 11:45:00', 2800.00, 560.00, 2240.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10010', '20010', 'Kevin', 'Robles', 'Regular', 'XXXX-XXXX', 6, '1987-08-11', 'Male', '2026-01-23 08:30:00', 4200.00, 0.00, 4200.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10011', '20011', 'Jenn', 'Aquino', 'Regular', 'XXXX-XXXX', NULL, '1994-01-25', 'Female', '2026-01-23 10:30:00', 3500.00, 0.00, 2000.00, 1500.00, 0.00, 'active', 1, NOW(), NOW()),
('10012', '20012', 'Michael', 'Baut', 'Regular', 'XXXX-XXXX', 7, '1983-10-07', 'Male', '2026-01-23 15:00:00', 2100.00, 0.00, 2100.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10013', '20013', 'Pat', 'Fernand', 'PWD', 'PWD-11111', NULL, '1970-06-30', 'Female', '2026-01-22 09:15:00', 3800.00, 760.00, 3040.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10014', '20014', 'Ant', 'Ramos', 'Regular', 'XXXX-XXXX', 8, '1991-03-18', 'Male', '2026-01-22 12:00:00', 2900.00, 0.00, 2900.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10015', '20015', 'Grace', 'Diaz', 'Regular', 'XXXX-XXXX', NULL, '1986-09-05', 'Female', '2026-01-21 08:00:00', 2500.00, 0.00, 2500.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10016', '20016', 'Will', 'Castro', 'Regular', 'XXXX-XXXX', 9, '1978-11-22', 'Male', '2026-01-21 14:30:00', 3200.00, 0.00, 1800.00, 1400.00, 0.00, 'active', 1, NOW(), NOW()),
('10017', '20017', 'Eli', 'Torres', 'Senior', 'SC-22222', NULL, '1950-02-14', 'Female', '2026-01-20 10:00:00', 1600.00, 320.00, 1280.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10018', '20018', 'Dan', 'Moral', 'Regular', 'XXXX-XXXX', 10, '1984-07-09', 'Male', '2026-01-19 11:30:00', 2600.00, 0.00, 2600.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10019', '20019', 'San', 'Rivera', 'Regular', 'XXXX-XXXX', NULL, '1989-04-03', 'Female', '2026-01-19 15:00:00', 2100.00, 0.00, 2100.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10020', '20020', 'Chris', 'Perez', 'Regular', 'XXXX-XXXX', 1, '1976-12-28', 'Male', '2026-01-18 09:00:00', 5200.00, 0.00, 5200.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10021', '20021', 'Mitch', 'Gonzal', 'PWD', 'PWD-33333', NULL, '1968-08-16', 'Female', '2026-01-18 11:00:00', 3800.00, 760.00, 3040.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10022', '20022', 'Brian', 'Flores', 'Regular', 'XXXX-XXXX', 2, '1993-05-21', 'Male', '2026-01-18 14:45:00', 2400.00, 0.00, 1200.00, 1200.00, 0.00, 'active', 1, NOW(), NOW()),
('10023', '20023', 'Dort', 'Cruz', 'Regular', 'XXXX-XXXX', NULL, '1981-10-30', 'Female', '2026-01-17 08:30:00', 3600.00, 0.00, 3600.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10024', '20024', 'Steve', 'Dela', 'Regular', 'XXXX-XXXX', 3, '1987-01-14', 'Male', '2026-01-17 13:15:00', 2900.00, 0.00, 2900.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10025', '20025', 'Ang', 'Mercad', 'Senior', 'SC-44444', 4, '1952-06-08', 'Female', '2026-01-16 09:30:00', 4800.00, 960.00, 3840.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10026', '20026', 'Ron', 'Hernan', 'Regular', 'XXXX-XXXX', NULL, '1990-03-25', 'Male', '2026-01-16 11:45:00', 3100.00, 0.00, 3100.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10027', '20027', 'Chris', 'Lopez', 'Regular', 'XXXX-XXXX', 5, '1985-11-17', 'Female', '2026-01-15 10:00:00', 3400.00, 0.00, 2400.00, 1000.00, 0.00, 'active', 1, NOW(), NOW()),
('10028', '20028', 'Jeff', 'Marti', 'Regular', 'XXXX-XXXX', NULL, '1979-08-02', 'Male', '2026-01-15 14:00:00', 2700.00, 0.00, 2700.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10029', '20029', 'Lau', 'Pascal', 'PWD', 'PWD-55555', 6, '1973-04-11', 'Female', '2026-01-14 08:45:00', 2800.00, 560.00, 2240.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10030', '20030', 'Ken', 'Sorian', 'Regular', 'XXXX-XXXX', NULL, '1988-09-29', 'Male', '2026-01-14 15:30:00', 2200.00, 0.00, 2200.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10031', '20031', 'Car', 'Ignac', 'Regular', 'XXXX-XXXX', 7, '1992-02-06', 'Female', '2026-01-13 10:30:00', 1900.00, 0.00, 1900.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10032', '20032', 'Ray', 'Navar', 'Senior', 'SC-66666', NULL, '1948-12-19', 'Male', '2026-01-12 11:00:00', 2400.00, 480.00, 1920.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10033', '20033', 'Vic', 'Salaz', 'Regular', 'XXXX-XXXX', 8, '1986-07-23', 'Female', '2026-01-11 09:15:00', 4600.00, 0.00, 4600.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10034', '20034', 'Ed', 'Franc', 'Regular', 'XXXX-XXXX', NULL, '1977-05-04', 'Male', '2026-01-11 12:30:00', 3300.00, 0.00, 1800.00, 1500.00, 0.00, 'active', 1, NOW(), NOW()),
('10035', '20035', 'Dia', 'Santia', 'Regular', 'XXXX-XXXX', 9, '1991-10-15', 'Female', '2026-01-10 08:00:00', 3700.00, 0.00, 3700.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10036', '20036', 'Greg', 'Valde', 'PWD', 'PWD-77777', NULL, '1965-03-08', 'Male', '2026-01-10 14:15:00', 2500.00, 500.00, 2000.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10037', '20037', 'Nic', 'Aguil', 'Regular', 'XXXX-XXXX', 10, '1989-06-27', 'Female', '2026-01-09 11:00:00', 1800.00, 0.00, 1800.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10038', '20038', 'Pat', 'Villa', 'Regular', 'XXXX-XXXX', NULL, '1983-01-30', 'Male', '2026-01-08 09:30:00', 3500.00, 0.00, 3500.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10039', '20039', 'Jack', 'Reyes', 'Senior', 'SC-88888', 1, '1954-08-12', 'Female', '2026-01-08 10:00:00', 2900.00, 580.00, 2320.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10040', '20040', 'Tim', 'Santos', 'Regular', 'XXXX-XXXX', NULL, '1980-04-05', 'Male', '2026-01-07 13:45:00', 2300.00, 0.00, 2300.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10041', '20041', 'Pam', 'Bautista', 'Regular', 'XXXX-XXXX', 2, '1995-11-23', 'Female', '2026-01-07 10:30:00', 1700.00, 0.00, 1700.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10042', '10042', 'Frank', 'Fern', 'Regular', 'XXXX-XXXX', NULL, '1978-09-16', 'Male', '2026-01-06 11:15:00', 2500.00, 0.00, 1500.00, 1000.00, 0.00, 'active', 1, NOW(), NOW()),
('10043', '10043', 'Deb', 'Ramos', 'PWD', 'PWD-99999', 3, '1971-02-19', 'Female', '2026-01-05 08:30:00', 4900.00, 980.00, 3920.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10044', '10044', 'Josh', 'Diaz', 'Regular', 'XXXX-XXXX', NULL, '1984-06-01', 'Male', '2026-01-05 12:00:00', 3600.00, 0.00, 3600.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10045', '10045', 'Reb', 'Castro', 'Regular', 'XXXX-XXXX', 4, '1990-12-08', 'Female', '2026-01-04 09:45:00', 3200.00, 0.00, 3200.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10046', '10046', 'Jerry', 'Torres', 'Regular', 'XXXX-XXXX', NULL, '1976-03-14', 'Male', '2026-01-03 11:30:00', 1500.00, 0.00, 1500.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10047', '10047', 'Kath', 'Moral', 'Senior', 'SC-10101', 5, '1949-10-22', 'Female', '2026-01-03 10:00:00', 3100.00, 620.00, 2480.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10048', '10048', 'Hen', 'Rivera', 'Regular', 'XXXX-XXXX', NULL, '1987-07-07', 'Male', '2026-01-02 08:15:00', 2700.00, 0.00, 2700.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10049', '10049', 'Mart', 'Perez', 'Regular', 'XXXX-XXXX', 6, '1993-05-18', 'Female', '2026-01-01 09:30:00', 1400.00, 0.00, 900.00, 500.00, 0.00, 'active', 1, NOW(), NOW()),
('10050', '10050', 'Art', 'Gonza', 'PWD', 'PWD-12121', NULL, '1969-01-26', 'Male', '2025-12-29 18:00:00', 2300.00, 460.00, 1840.00, 0.00, 0.00, 'active', 1, NOW(), NOW());

-- ============================================
-- TEST DETAILS
-- ============================================
INSERT IGNORE INTO `TestDetails` (
  `testDetailId`, `transactionId`, `testId`, `testName`, `departmentId`,
  `originalPrice`, `discountPercentage`, `discountedPrice`, 
  `cashAmount`, `gCashAmount`, `balanceAmount`, `status`, `createdAt`, `updatedAt`
) VALUES
('50001', '10001', 1, 'CBC', 1, 1800.00, 0, 1800.00, 1800.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50002', '10002', 2, 'X-Ray', 2, 1875.00, 20, 1500.00, 1200.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50003', '10003', 3, 'US', 2, 2800.00, 0, 2800.00, 2000.00, 800.00, 0.00, 'active', NOW(), NOW()),
('50004', '10004', 4, 'CT', 2, 2200.00, 0, 2200.00, 2200.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50005', '10005', 5, 'MRI', 2, 5625.00, 20, 4500.00, 3600.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50006', '10006', 6, 'ECG', 5, 3200.00, 0, 3200.00, 3200.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50007', '10007', 7, 'Echo', 5, 2800.00, 0, 2800.00, 1500.00, 1300.00, 0.00, 'active', NOW(), NOW()),
('50008', '10008', 8, 'Str', 5, 3500.00, 0, 3500.00, 3500.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50009', '10009', 9, 'Hol', 5, 3500.00, 20, 2800.00, 2240.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50010', '10010', 10, 'MRI', 5, 4200.00, 0, 4200.00, 4200.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50011', '10011', 11, 'Uri', 3, 3500.00, 0, 3500.00, 2000.00, 1500.00, 0.00, 'active', NOW(), NOW()),
('50012', '10012', 12, 'Spu', 3, 2100.00, 0, 2100.00, 2100.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50013', '10013', 13, 'Bio', 4, 4750.00, 20, 3800.00, 3040.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50014', '10014', 14, 'Bio', 4, 2900.00, 0, 2900.00, 2900.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50015', '10015', 15, 'Pap', 4, 2500.00, 0, 2500.00, 2500.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50016', '10016', 16, 'His', 4, 3200.00, 0, 3200.00, 1800.00, 1400.00, 0.00, 'active', NOW(), NOW()),
('50017', '10017', 17, 'CBC', 1, 2000.00, 20, 1600.00, 1280.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50018', '10018', 18, 'Hem', 1, 2600.00, 0, 2600.00, 2600.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50019', '10019', 19, 'Pla', 1, 2100.00, 0, 2100.00, 2100.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50020', '10020', 20, 'PT', 1, 5200.00, 0, 5200.00, 5200.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50021', '10021', 21, 'ESR', 1, 4750.00, 20, 3800.00, 3040.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50022', '10022', 22, 'Ret', 1, 2400.00, 0, 2400.00, 1200.00, 1200.00, 0.00, 'active', NOW(), NOW()),
('50023', '10023', 23, 'WBC', 1, 3600.00, 0, 3600.00, 3600.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50024', '10024', 24, 'Blo', 1, 2900.00, 0, 2900.00, 2900.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50025', '10025', 25, 'X-Ra', 2, 6000.00, 20, 4800.00, 3840.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50026', '10026', 26, 'Ult', 2, 3100.00, 0, 3100.00, 3100.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50027', '10027', 27, 'CT', 2, 3400.00, 0, 3400.00, 2400.00, 1000.00, 0.00, 'active', NOW(), NOW()),
('50028', '10028', 28, 'MRI', 2, 2700.00, 0, 2700.00, 2700.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50029', '10029', 29, 'Mam', 2, 3500.00, 20, 2800.00, 2240.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50030', '10030', 30, 'Bon', 2, 2200.00, 0, 2200.00, 2200.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50031', '10031', 31, 'Pel', 2, 1900.00, 0, 1900.00, 1900.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50032', '10032', 32, 'CTA', 2, 3000.00, 20, 2400.00, 1920.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50033', '10033', 33, 'Cul', 3, 4600.00, 0, 4600.00, 4600.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50034', '10034', 34, 'Cul', 3, 3300.00, 0, 3300.00, 1800.00, 1500.00, 0.00, 'active', NOW(), NOW()),
('50035', '10035', 35, 'Sto', 3, 3700.00, 0, 3700.00, 3700.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50036', '10036', 36, 'Blo', 3, 3125.00, 20, 2500.00, 2000.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50037', '10037', 37, 'Thr', 3, 1800.00, 0, 1800.00, 1800.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50038', '10038', 38, 'Wou', 3, 3500.00, 0, 3500.00, 3500.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50039', '10039', 39, 'AFB', 3, 3625.00, 20, 2900.00, 2320.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50040', '10040', 40, 'Gra', 3, 2300.00, 0, 2300.00, 2300.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50041', '10041', 41, 'Bio', 4, 1700.00, 0, 1700.00, 1700.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50042', '10042', 42, 'Bio', 4, 2500.00, 0, 2500.00, 1500.00, 1000.00, 0.00, 'active', NOW(), NOW()),
('50043', '10043', 43, 'Pap', 4, 6125.00, 20, 4900.00, 3920.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50044', '10044', 44, 'His', 4, 3600.00, 0, 3600.00, 3600.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50045', '10045', 45, 'Cyt', 4, 3200.00, 0, 3200.00, 3200.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50046', '10046', 46, 'Bon', 4, 1500.00, 0, 1500.00, 1500.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50047', '10047', 47, 'Fro', 4, 3875.00, 20, 3100.00, 2480.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50048', '10048', 48, 'IHC', 4, 2700.00, 0, 2700.00, 2700.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50049', '10049', 49, 'Cer', 4, 1400.00, 0, 1400.00, 900.00, 500.00, 0.00, 'active', NOW(), NOW()),
('50050', '10050', 50, 'End', 4, 2875.00, 20, 2300.00, 1840.00, 0.00, 0.00, 'active', NOW(), NOW());

-- ============================================
-- REFERRER REBATES & EXPENSES (1-to-1)
-- ============================================
-- We insert expenses first so we have the IDs for items
-- firstName='Pure', lastName='Health'
INSERT IGNORE INTO `Expenses` (`expenseId`, `firstName`, `lastName`, `departmentId`, `date`, `totalAmount`, `userId`, `status`, `createdAt`, `updatedAt`) VALUES
(1, 'Pure', 'Health', NULL, '2026-01-19', 300.00, 1, 'active', NOW(), NOW()),
(2, 'Pure', 'Health', NULL, '2026-01-18', 560.00, 1, 'active', NOW(), NOW()),
(3, 'Pure', 'Health', NULL, '2026-01-17', 900.00, 1, 'active', NOW(), NOW()),
(4, 'Pure', 'Health', NULL, '2026-01-16', 560.00, 1, 'active', NOW(), NOW()),
(5, 'Pure', 'Health', NULL, '2026-01-15', 840.00, 1, 'active', NOW(), NOW()),
(6, 'Pure', 'Health', NULL, '2026-01-14', 580.00, 1, 'active', NOW(), NOW());

INSERT IGNORE INTO `ExpenseItems` (`expenseItemId`, `expenseId`, `paidTo`, `purpose`, `categoryId`, `amount`, `status`, `createdAt`, `updatedAt`) VALUES
(1, 1, 'Dr. Joseph Tan', 'Referrer Rebate - 20%', 1, 300.00, 'pending', NOW(), NOW()),
(2, 2, 'Dr. Maria Santos', 'Referrer Rebate - 20%', 1, 560.00, 'pending', NOW(), NOW()),
(3, 3, 'Dr. Liza Dela Cruz', 'Referrer Rebate - 20%', 1, 900.00, 'pending', NOW(), NOW()),
(4, 4, 'Dr. Camille Mendoza', 'Referrer Rebate - 20%', 1, 560.00, 'pending', NOW(), NOW()),
(5, 5, 'Dr. Alvin Garcia', 'Referrer Rebate - 20%', 1, 840.00, 'pending', NOW(), NOW()),
(6, 6, 'Dr. Daniel Robles', 'Referrer Rebate - 20%', 1, 580.00, 'pending', NOW(), NOW());

INSERT IGNORE INTO `ReferrerRebates` (`rebateId`, `referrerId`, `firstName`, `lastName`, `rebateDate`, `totalRebateAmount`, `transactionCount`, `status`, `createdAt`, `updatedAt`) VALUES
(1, 2, 'Joseph', 'Tan', '2026-01-19', 300.00, 1, 'active', NOW(), NOW()),
(2, 1, 'Maria', 'Santos', '2026-01-18', 560.00, 1, 'active', NOW(), NOW()),
(3, 3, 'Liza', 'Dela Cruz', '2026-01-17', 900.00, 1, 'active', NOW(), NOW()),
(4, 5, 'Camille', 'Mendoza', '2026-01-16', 560.00, 1, 'active', NOW(), NOW()),
(5, 6, 'Alvin', 'Garcia', '2026-01-15', 840.00, 1, 'active', NOW(), NOW()),
(6, 8, 'Daniel', 'Robles', '2026-01-14', 580.00, 1, 'active', NOW(), NOW());