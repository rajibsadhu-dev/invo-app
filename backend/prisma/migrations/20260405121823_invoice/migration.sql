-- AlterTable
ALTER TABLE `invoices` ADD COLUMN `transaction_number` VARCHAR(191) NULL,
    MODIFY `payment_method` ENUM('cash', 'bank', 'upi') NULL;
