-- Add referralFeePercentage column to Transactions table
ALTER TABLE `Transactions` 
ADD COLUMN `referralFeePercentage` DECIMAL(5, 2) NOT NULL DEFAULT 20.00
AFTER `userId`;

-- Verify the column was added
DESCRIBE `Transactions`;
