-- =============================================================================
-- PUREHEALTH DIAGNOSTIC CENTER - TRANSACTION MOCK DATA (Pure MySQL)
-- 50 transactions spanning 30 days back from NOW()
-- Includes: TestDetails, Expenses, ExpenseItems, ReferrerRebates
-- =============================================================================

USE `devpurehealthdb`;

SET FOREIGN_KEY_CHECKS = 0;

-- Ensure user exists
INSERT IGNORE INTO `Users` (`userId`, `email`, `firstName`, `lastName`, `role`, `status`, `createdAt`, `updatedAt`)
VALUES (1, 'admin@purehealth.com', 'Admin', 'User', 'admin', 'active', NOW(), NOW());

-- Ensure Rebates category exists
INSERT IGNORE INTO `Category` (`categoryId`, `name`, `status`, `createdAt`, `updatedAt`)
VALUES (1, 'Rebates', 'active', NOW(), NOW());

-- ============================================
-- TRANSACTIONS (50 records, 30 days back from NOW)
-- ============================================
INSERT IGNORE INTO `Transactions` (
  `transactionId`, `mcNo`, `firstName`, `lastName`, `idType`, `idNumber`,
  `referrerId`, `birthDate`, `sex`, `transactionDate`,
  `totalAmount`, `totalDiscountAmount`, `totalCashAmount`, `totalGCashAmount`, `totalBalanceAmount`,
  `status`, `userId`, `createdAt`, `updatedAt`
) VALUES
('10001', '20001', 'Anna',    'Cruz',     'Regular', 'XXXX-XXXX', NULL, '1985-03-15', 'Female', NOW() - INTERVAL 0 DAY + INTERVAL 9 HOUR + INTERVAL 30 MINUTE,  1800.00, 0.00, 1800.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10002', '20002', 'Mark',    'Santos',   'Senior',  'SC-12345',  2,    '1958-07-22', 'Male',   NOW() - INTERVAL 0 DAY + INTERVAL 11 HOUR,                      1500.00, 300.00, 1200.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10003', '20003', 'Lisa',    'Reyes',    'Regular', 'XXXX-XXXX', 1,    '1990-11-08', 'Female', NOW() - INTERVAL 1 DAY + INTERVAL 10 HOUR + INTERVAL 15 MINUTE, 2800.00, 0.00, 2000.00, 800.00, 0.00, 'active', 1, NOW(), NOW()),
('10004', '20004', 'Jose',    'Garcia',   'Regular', 'XXXX-XXXX', NULL, '1982-05-30', 'Male',   NOW() - INTERVAL 1 DAY + INTERVAL 14 HOUR + INTERVAL 30 MINUTE, 2200.00, 0.00, 2200.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10005', '20005', 'Maria',   'Mendoza',  'PWD',     'PWD-98765', 3,    '1975-09-12', 'Female', NOW() - INTERVAL 2 DAY + INTERVAL 8 HOUR + INTERVAL 45 MINUTE,  4500.00, 900.00, 3600.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10006', '20006', 'Robert',  'Tan',      'Regular', 'XXXX-XXXX', NULL, '1988-02-28', 'Male',   NOW() - INTERVAL 2 DAY + INTERVAL 10 HOUR,                     3200.00, 0.00, 3200.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10007', '20007', 'Carmen',  'Lim',      'Regular', 'XXXX-XXXX', 4,    '1992-06-17', 'Female', NOW() - INTERVAL 2 DAY + INTERVAL 13 HOUR + INTERVAL 30 MINUTE, 2800.00, 0.00, 1500.00, 1300.00, 0.00, 'active', 1, NOW(), NOW()),
('10008', '20008', 'David',   'Chua',     'Regular', 'XXXX-XXXX', NULL, '1979-12-03', 'Male',   NOW() - INTERVAL 3 DAY + INTERVAL 9 HOUR,                      3500.00, 0.00, 3500.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10009', '20009', 'Helen',   'Villa',    'Senior',  'SC-54321',  5,    '1955-04-20', 'Female', NOW() - INTERVAL 3 DAY + INTERVAL 11 HOUR + INTERVAL 45 MINUTE, 2800.00, 560.00, 2240.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10010', '20010', 'Kevin',   'Robles',   'Regular', 'XXXX-XXXX', 6,    '1987-08-11', 'Male',   NOW() - INTERVAL 4 DAY + INTERVAL 8 HOUR + INTERVAL 30 MINUTE,  4200.00, 0.00, 4200.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10011', '20011', 'Jenn',    'Aquino',   'Regular', 'XXXX-XXXX', NULL, '1994-01-25', 'Female', NOW() - INTERVAL 4 DAY + INTERVAL 10 HOUR + INTERVAL 30 MINUTE, 3500.00, 0.00, 2000.00, 1500.00, 0.00, 'active', 1, NOW(), NOW()),
('10012', '20012', 'Michael', 'Baut',     'Regular', 'XXXX-XXXX', 7,    '1983-10-07', 'Male',   NOW() - INTERVAL 4 DAY + INTERVAL 15 HOUR,                     2100.00, 0.00, 2100.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10013', '20013', 'Pat',     'Fernand',  'PWD',     'PWD-11111', NULL, '1970-06-30', 'Female', NOW() - INTERVAL 5 DAY + INTERVAL 9 HOUR + INTERVAL 15 MINUTE,  3800.00, 760.00, 3040.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10014', '20014', 'Ant',     'Ramos',    'Regular', 'XXXX-XXXX', 8,    '1991-03-18', 'Male',   NOW() - INTERVAL 5 DAY + INTERVAL 12 HOUR,                     2900.00, 0.00, 2900.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10015', '20015', 'Grace',   'Diaz',     'Regular', 'XXXX-XXXX', NULL, '1986-09-05', 'Female', NOW() - INTERVAL 6 DAY + INTERVAL 8 HOUR,                      2500.00, 0.00, 2500.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10016', '20016', 'Will',    'Castro',   'Regular', 'XXXX-XXXX', 9,    '1978-11-22', 'Male',   NOW() - INTERVAL 6 DAY + INTERVAL 14 HOUR + INTERVAL 30 MINUTE, 3200.00, 0.00, 1800.00, 1400.00, 0.00, 'active', 1, NOW(), NOW()),
('10017', '20017', 'Eli',     'Torres',   'Senior',  'SC-22222',  NULL, '1950-02-14', 'Female', NOW() - INTERVAL 7 DAY + INTERVAL 10 HOUR,                     1600.00, 320.00, 1280.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10018', '20018', 'Dan',     'Moral',    'Regular', 'XXXX-XXXX', 10,   '1984-07-09', 'Male',   NOW() - INTERVAL 8 DAY + INTERVAL 11 HOUR + INTERVAL 30 MINUTE, 2600.00, 0.00, 2600.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10019', '20019', 'San',     'Rivera',   'Regular', 'XXXX-XXXX', NULL, '1989-04-03', 'Female', NOW() - INTERVAL 8 DAY + INTERVAL 15 HOUR,                     2100.00, 0.00, 2100.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10020', '20020', 'Chris',   'Perez',    'Regular', 'XXXX-XXXX', 1,    '1976-12-28', 'Male',   NOW() - INTERVAL 9 DAY + INTERVAL 9 HOUR,                      5200.00, 0.00, 5200.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10021', '20021', 'Mitch',   'Gonzal',   'PWD',     'PWD-33333', NULL, '1968-08-16', 'Female', NOW() - INTERVAL 9 DAY + INTERVAL 11 HOUR,                     3800.00, 760.00, 3040.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10022', '20022', 'Brian',   'Flores',   'Regular', 'XXXX-XXXX', 2,    '1993-05-21', 'Male',   NOW() - INTERVAL 9 DAY + INTERVAL 14 HOUR + INTERVAL 45 MINUTE, 2400.00, 0.00, 1200.00, 1200.00, 0.00, 'active', 1, NOW(), NOW()),
('10023', '20023', 'Dort',    'Cruz',     'Regular', 'XXXX-XXXX', NULL, '1981-10-30', 'Female', NOW() - INTERVAL 10 DAY + INTERVAL 8 HOUR + INTERVAL 30 MINUTE, 3600.00, 0.00, 3600.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10024', '20024', 'Steve',   'Dela',     'Regular', 'XXXX-XXXX', 3,    '1987-01-14', 'Male',   NOW() - INTERVAL 10 DAY + INTERVAL 13 HOUR + INTERVAL 15 MINUTE, 2900.00, 0.00, 2900.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10025', '20025', 'Ang',     'Mercad',   'Senior',  'SC-44444',  4,    '1952-06-08', 'Female', NOW() - INTERVAL 11 DAY + INTERVAL 9 HOUR + INTERVAL 30 MINUTE,  4800.00, 960.00, 3840.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10026', '20026', 'Ron',     'Hernan',   'Regular', 'XXXX-XXXX', NULL, '1990-03-25', 'Male',   NOW() - INTERVAL 11 DAY + INTERVAL 11 HOUR + INTERVAL 45 MINUTE, 3100.00, 0.00, 3100.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10027', '20027', 'Chris',   'Lopez',    'Regular', 'XXXX-XXXX', 5,    '1985-11-17', 'Female', NOW() - INTERVAL 12 DAY + INTERVAL 10 HOUR,                     3400.00, 0.00, 2400.00, 1000.00, 0.00, 'active', 1, NOW(), NOW()),
('10028', '20028', 'Jeff',    'Marti',    'Regular', 'XXXX-XXXX', NULL, '1979-08-02', 'Male',   NOW() - INTERVAL 12 DAY + INTERVAL 14 HOUR,                     2700.00, 0.00, 2700.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10029', '20029', 'Lau',     'Pascal',   'PWD',     'PWD-55555', 6,    '1973-04-11', 'Female', NOW() - INTERVAL 13 DAY + INTERVAL 8 HOUR + INTERVAL 45 MINUTE,  2800.00, 560.00, 2240.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10030', '20030', 'Ken',     'Sorian',   'Regular', 'XXXX-XXXX', NULL, '1988-09-29', 'Male',   NOW() - INTERVAL 13 DAY + INTERVAL 15 HOUR + INTERVAL 30 MINUTE, 2200.00, 0.00, 2200.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10031', '20031', 'Car',     'Ignac',    'Regular', 'XXXX-XXXX', 7,    '1992-02-06', 'Female', NOW() - INTERVAL 14 DAY + INTERVAL 10 HOUR + INTERVAL 30 MINUTE, 1900.00, 0.00, 1900.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10032', '20032', 'Ray',     'Navar',    'Senior',  'SC-66666',  NULL, '1948-12-19', 'Male',   NOW() - INTERVAL 15 DAY + INTERVAL 11 HOUR,                     2400.00, 480.00, 1920.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10033', '20033', 'Vic',     'Salaz',    'Regular', 'XXXX-XXXX', 8,    '1986-07-23', 'Female', NOW() - INTERVAL 16 DAY + INTERVAL 9 HOUR + INTERVAL 15 MINUTE,  4600.00, 0.00, 4600.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10034', '20034', 'Ed',      'Franc',    'Regular', 'XXXX-XXXX', NULL, '1977-05-04', 'Male',   NOW() - INTERVAL 16 DAY + INTERVAL 12 HOUR + INTERVAL 30 MINUTE, 3300.00, 0.00, 1800.00, 1500.00, 0.00, 'active', 1, NOW(), NOW()),
('10035', '20035', 'Dia',     'Santia',   'Regular', 'XXXX-XXXX', 9,    '1991-10-15', 'Female', NOW() - INTERVAL 17 DAY + INTERVAL 8 HOUR,                      3700.00, 0.00, 3700.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10036', '20036', 'Greg',    'Valde',    'PWD',     'PWD-77777', NULL, '1965-03-08', 'Male',   NOW() - INTERVAL 17 DAY + INTERVAL 14 HOUR + INTERVAL 15 MINUTE, 2500.00, 500.00, 2000.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10037', '20037', 'Nic',     'Aguil',    'Regular', 'XXXX-XXXX', 10,   '1989-06-27', 'Female', NOW() - INTERVAL 18 DAY + INTERVAL 11 HOUR,                     1800.00, 0.00, 1800.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10038', '20038', 'Pat',     'Villa',    'Regular', 'XXXX-XXXX', NULL, '1983-01-30', 'Male',   NOW() - INTERVAL 19 DAY + INTERVAL 9 HOUR + INTERVAL 30 MINUTE,  3500.00, 0.00, 3500.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10039', '20039', 'Jack',    'Reyes',    'Senior',  'SC-88888',  1,    '1954-08-12', 'Female', NOW() - INTERVAL 19 DAY + INTERVAL 10 HOUR,                     2900.00, 580.00, 2320.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10040', '20040', 'Tim',     'Santos',   'Regular', 'XXXX-XXXX', NULL, '1980-04-05', 'Male',   NOW() - INTERVAL 20 DAY + INTERVAL 13 HOUR + INTERVAL 45 MINUTE, 2300.00, 0.00, 2300.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10041', '20041', 'Pam',     'Bautista', 'Regular', 'XXXX-XXXX', 2,    '1995-11-23', 'Female', NOW() - INTERVAL 20 DAY + INTERVAL 10 HOUR + INTERVAL 30 MINUTE, 1700.00, 0.00, 1700.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10042', '10042', 'Frank',   'Fern',     'Regular', 'XXXX-XXXX', NULL, '1978-09-16', 'Male',   NOW() - INTERVAL 21 DAY + INTERVAL 11 HOUR + INTERVAL 15 MINUTE, 2500.00, 0.00, 1500.00, 1000.00, 0.00, 'active', 1, NOW(), NOW()),
('10043', '10043', 'Deb',     'Ramos',    'PWD',     'PWD-99999', 3,    '1971-02-19', 'Female', NOW() - INTERVAL 22 DAY + INTERVAL 8 HOUR + INTERVAL 30 MINUTE,  4900.00, 980.00, 3920.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10044', '10044', 'Josh',    'Diaz',     'Regular', 'XXXX-XXXX', NULL, '1984-06-01', 'Male',   NOW() - INTERVAL 22 DAY + INTERVAL 12 HOUR,                     3600.00, 0.00, 3600.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10045', '10045', 'Reb',     'Castro',   'Regular', 'XXXX-XXXX', 4,    '1990-12-08', 'Female', NOW() - INTERVAL 23 DAY + INTERVAL 9 HOUR + INTERVAL 45 MINUTE,  3200.00, 0.00, 3200.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10046', '10046', 'Jerry',   'Torres',   'Regular', 'XXXX-XXXX', NULL, '1976-03-14', 'Male',   NOW() - INTERVAL 24 DAY + INTERVAL 11 HOUR + INTERVAL 30 MINUTE, 1500.00, 0.00, 1500.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10047', '10047', 'Kath',    'Moral',    'Senior',  'SC-10101',  5,    '1949-10-22', 'Female', NOW() - INTERVAL 24 DAY + INTERVAL 10 HOUR,                     3100.00, 620.00, 2480.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10048', '10048', 'Hen',     'Rivera',   'Regular', 'XXXX-XXXX', NULL, '1987-07-07', 'Male',   NOW() - INTERVAL 26 DAY + INTERVAL 8 HOUR + INTERVAL 15 MINUTE,  2700.00, 0.00, 2700.00, 0.00, 0.00, 'active', 1, NOW(), NOW()),
('10049', '10049', 'Mart',    'Perez',    'Regular', 'XXXX-XXXX', 6,    '1993-05-18', 'Female', NOW() - INTERVAL 28 DAY + INTERVAL 9 HOUR + INTERVAL 30 MINUTE,  1400.00, 0.00, 900.00, 500.00, 0.00, 'active', 1, NOW(), NOW()),
('10050', '10050', 'Art',     'Gonza',    'PWD',     'PWD-12121', NULL, '1969-01-26', 'Male',   NOW() - INTERVAL 30 DAY + INTERVAL 18 HOUR,                     2300.00, 460.00, 1840.00, 0.00, 0.00, 'active', 1, NOW(), NOW());

-- ============================================
-- TEST DETAILS
-- ============================================
INSERT IGNORE INTO `TestDetails` (
  `testDetailId`, `transactionId`, `testId`, `testName`, `departmentId`,
  `originalPrice`, `discountPercentage`, `discountedPrice`,
  `cashAmount`, `gCashAmount`, `balanceAmount`, `status`, `createdAt`, `updatedAt`
) VALUES
('50001', '10001', 1,  'CBC + Platelet Count',        1, 1800.00, 0,  1800.00, 1800.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50002', '10002', 2,  'Blood Typing with RH Typing', 1, 1875.00, 20, 1500.00, 1200.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50003', '10003', 21, 'Pelvic Ultrasound',           2, 2800.00, 0,  2800.00, 2000.00, 800.00, 0.00, 'active', NOW(), NOW()),
('50004', '10004', 24, 'Liver Ultrasound',             2, 2200.00, 0,  2200.00, 2200.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50005', '10005', 30, 'Whole Abdomen Ultrasound',     2, 5625.00, 20, 4500.00, 3600.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50006', '10006', 31, 'ECG',                          3, 3200.00, 0,  3200.00, 3200.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50007', '10007', 33, '2D-Echo Plain',                3, 2800.00, 0,  2800.00, 1500.00, 1300.00, 0.00, 'active', NOW(), NOW()),
('50008', '10008', 34, '2D-Echo Colored Doppler Study',3, 3500.00, 0,  3500.00, 3500.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50009', '10009', 32, 'ECG Pedia',                    3, 3500.00, 20, 2800.00, 2240.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50010', '10010', 36, 'Chest PA X-Ray',               4, 4200.00, 0,  4200.00, 4200.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50011', '10011', 15, 'Urinalysis',                   1, 3500.00, 0,  3500.00, 2000.00, 1500.00, 0.00, 'active', NOW(), NOW()),
('50012', '10012', 16, 'Fecalysis',                    1, 2100.00, 0,  2100.00, 2100.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50013', '10013', 37, 'Chest AP-Lateral Adult/Pedia X-Ray', 4, 4750.00, 20, 3800.00, 3040.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50014', '10014', 38, 'Shoulder X-Ray',               4, 2900.00, 0,  2900.00, 2900.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50015', '10015', 39, 'Thoracolumbar Spine X-Ray',    4, 2500.00, 0,  2500.00, 2500.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50016', '10016', 40, 'Skull X-Ray',                  4, 3200.00, 0,  3200.00, 1800.00, 1400.00, 0.00, 'active', NOW(), NOW()),
('50017', '10017', 1,  'CBC + Platelet Count',         1, 2000.00, 20, 1600.00, 1280.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50018', '10018', 3,  'ESR',                          1, 2600.00, 0,  2600.00, 2600.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50019', '10019', 4,  'FBS',                          1, 2100.00, 0,  2100.00, 2100.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50020', '10020', 19, 'TSH',                          1, 5200.00, 0,  5200.00, 5200.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50021', '10021', 3,  'ESR',                          1, 4750.00, 20, 3800.00, 3040.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50022', '10022', 7,  'Cholesterol',                  1, 2400.00, 0,  2400.00, 1200.00, 1200.00, 0.00, 'active', NOW(), NOW()),
('50023', '10023', 8,  'Triglycerides',                1, 3600.00, 0,  3600.00, 3600.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50024', '10024', 2,  'Blood Typing with RH Typing',  1, 2900.00, 0,  2900.00, 2900.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50025', '10025', 36, 'Chest PA X-Ray',               4, 6000.00, 20, 4800.00, 3840.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50026', '10026', 25, 'Kidneys Ultrasound',           2, 3100.00, 0,  3100.00, 3100.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50027', '10027', 27, 'Thyroid Ultrasound',           2, 3400.00, 0,  3400.00, 2400.00, 1000.00, 0.00, 'active', NOW(), NOW()),
('50028', '10028', 26, 'Prostate Ultrasound',          2, 2700.00, 0,  2700.00, 2700.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50029', '10029', 29, 'Breast Ultrasound',            2, 3500.00, 20, 2800.00, 2240.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50030', '10030', 22, 'Biophysical Profile',          2, 2200.00, 0,  2200.00, 2200.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50031', '10031', 21, 'Pelvic Ultrasound',            2, 1900.00, 0,  1900.00, 1900.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50032', '10032', 23, 'Transvaginal Non-Pregnant',    2, 3000.00, 20, 2400.00, 1920.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50033', '10033', 41, 'Rapid Antibody COVID Test',    5, 4600.00, 0,  4600.00, 4600.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50034', '10034', 42, 'Swab Antigen COVID Test',      5, 3300.00, 0,  3300.00, 1800.00, 1500.00, 0.00, 'active', NOW(), NOW()),
('50035', '10035', 43, 'RT-PCR COVID Test',            5, 3700.00, 0,  3700.00, 3700.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50036', '10036', 9,  'HDL',                          1, 3125.00, 20, 2500.00, 2000.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50037', '10037', 10, 'LDL',                          1, 1800.00, 0,  1800.00, 1800.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50038', '10038', 11, 'SGOT',                         1, 3500.00, 0,  3500.00, 3500.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50039', '10039', 12, 'SGPT',                         1, 3625.00, 20, 2900.00, 2320.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50040', '10040', 13, 'VDRL/RPR',                     1, 2300.00, 0,  2300.00, 2300.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50041', '10041', 44, 'Pre-Employment Package 1',     6, 1700.00, 0,  1700.00, 1700.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50042', '10042', 45, 'Pre-Employment Package 2',     6, 2500.00, 0,  2500.00, 1500.00, 1000.00, 0.00, 'active', NOW(), NOW()),
('50043', '10043', 47, 'Pre-Natal Package 1',          7, 6125.00, 20, 4900.00, 3920.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50044', '10044', 48, 'Pre-Natal Package 2',          7, 3600.00, 0,  3600.00, 3600.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50045', '10045', 49, 'Chem 5 Package',               8, 3200.00, 0,  3200.00, 3200.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50046', '10046', 50, 'Chem 6 Package',               8, 1500.00, 0,  1500.00, 1500.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50047', '10047', 35, '2D-Echo Pedia',                3, 3875.00, 20, 3100.00, 2480.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50048', '10048', 20, 'HIV Test',                     1, 2700.00, 0,  2700.00, 2700.00, 0.00, 0.00, 'active', NOW(), NOW()),
('50049', '10049', 14, 'Widal Test',                   1, 1400.00, 0,  1400.00, 900.00, 500.00, 0.00, 'active', NOW(), NOW()),
('50050', '10050', 17, 'Albumin',                      1, 2875.00, 20, 2300.00, 1840.00, 0.00, 0.00, 'active', NOW(), NOW());

-- ============================================
-- EXPENSES (Referrer Rebates)
-- ============================================
INSERT IGNORE INTO `Expenses` (`expenseId`, `firstName`, `lastName`, `departmentId`, `date`, `totalAmount`, `userId`, `status`, `createdAt`, `updatedAt`) VALUES
(1, 'Pure', 'Health', NULL, DATE(NOW() - INTERVAL 8 DAY),  300.00, 1, 'active', NOW(), NOW()),
(2, 'Pure', 'Health', NULL, DATE(NOW() - INTERVAL 9 DAY),  560.00, 1, 'active', NOW(), NOW()),
(3, 'Pure', 'Health', NULL, DATE(NOW() - INTERVAL 10 DAY), 900.00, 1, 'active', NOW(), NOW()),
(4, 'Pure', 'Health', NULL, DATE(NOW() - INTERVAL 11 DAY), 560.00, 1, 'active', NOW(), NOW()),
(5, 'Pure', 'Health', NULL, DATE(NOW() - INTERVAL 12 DAY), 840.00, 1, 'active', NOW(), NOW()),
(6, 'Pure', 'Health', NULL, DATE(NOW() - INTERVAL 13 DAY), 580.00, 1, 'active', NOW(), NOW());

-- ============================================
-- EXPENSE ITEMS
-- ============================================
INSERT IGNORE INTO `ExpenseItems` (`expenseItemId`, `expenseId`, `paidTo`, `purpose`, `categoryId`, `amount`, `status`, `createdAt`, `updatedAt`) VALUES
(1, 1, 'Dr. Joseph Tan',       'Referrer Rebate - 20%', 1, 300.00, 'pending', NOW(), NOW()),
(2, 2, 'Dr. Maria Santos',     'Referrer Rebate - 20%', 1, 560.00, 'pending', NOW(), NOW()),
(3, 3, 'Dr. Liza Dela Cruz',   'Referrer Rebate - 20%', 1, 900.00, 'pending', NOW(), NOW()),
(4, 4, 'Dr. Camille Mendoza',  'Referrer Rebate - 20%', 1, 560.00, 'pending', NOW(), NOW()),
(5, 5, 'Dr. Alvin Garcia',     'Referrer Rebate - 20%', 1, 840.00, 'pending', NOW(), NOW()),
(6, 6, 'Dr. Daniel Robles',    'Referrer Rebate - 20%', 1, 580.00, 'pending', NOW(), NOW());

-- ============================================
-- REFERRER REBATES
-- ============================================
INSERT IGNORE INTO `ReferrerRebates` (`rebateId`, `referrerId`, `firstName`, `lastName`, `rebateDate`, `totalRebateAmount`, `transactionCount`, `status`, `createdAt`, `updatedAt`) VALUES
(1, 2, 'Joseph',  'Tan',       DATE(NOW() - INTERVAL 8 DAY),  300.00, 1, 'active', NOW(), NOW()),
(2, 1, 'Maria',   'Santos',    DATE(NOW() - INTERVAL 9 DAY),  560.00, 1, 'active', NOW(), NOW()),
(3, 3, 'Liza',    'Dela Cruz', DATE(NOW() - INTERVAL 10 DAY), 900.00, 1, 'active', NOW(), NOW()),
(4, 5, 'Camille', 'Mendoza',   DATE(NOW() - INTERVAL 11 DAY), 560.00, 1, 'active', NOW(), NOW()),
(5, 6, 'Alvin',   'Garcia',    DATE(NOW() - INTERVAL 12 DAY), 840.00, 1, 'active', NOW(), NOW()),
(6, 8, 'Daniel',  'Robles',    DATE(NOW() - INTERVAL 13 DAY), 580.00, 1, 'active', NOW(), NOW());

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Transaction mock data imported successfully! (50 transactions over 30 days from NOW)' AS status;