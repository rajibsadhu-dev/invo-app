-- AlterTable
ALTER TABLE `invoice_items` ADD COLUMN `unit` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `invoices` ADD COLUMN `authorized_signatory` VARCHAR(191) NULL,
    ADD COLUMN `bank_account` VARCHAR(191) NULL,
    ADD COLUMN `bank_ifsc` VARCHAR(191) NULL,
    ADD COLUMN `bank_name` VARCHAR(191) NULL,
    ADD COLUMN `billing_address` TEXT NULL,
    ADD COLUMN `challan_no` VARCHAR(191) NULL,
    ADD COLUMN `invoice_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `notes` TEXT NULL,
    ADD COLUMN `payment_method` ENUM('cash', 'bank') NULL,
    ADD COLUMN `received_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `reference_number` VARCHAR(191) NULL,
    ADD COLUMN `site_location` VARCHAR(191) NULL,
    ADD COLUMN `terms_and_conditions` TEXT NULL,
    ADD COLUMN `vehicle_no` VARCHAR(191) NULL;
