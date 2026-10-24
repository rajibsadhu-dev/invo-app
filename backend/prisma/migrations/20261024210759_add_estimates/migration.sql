-- AlterTable: add estimate fields to organizations
ALTER TABLE `organizations` ADD COLUMN `estimate_prefix` VARCHAR(10) NOT NULL DEFAULT 'EST',
                            ADD COLUMN `next_estimate_number` INTEGER NOT NULL DEFAULT 1;

-- CreateTable: estimates
CREATE TABLE `estimates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `organization_id` INTEGER NOT NULL,
    `customer_id` INTEGER NOT NULL,
    `created_by_id` INTEGER NULL,
    `estimate_number` VARCHAR(191) NOT NULL,
    `estimate_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `valid_until` DATETIME(3) NULL,
    `subtotal` DECIMAL(12, 2) NOT NULL,
    `tax` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `discount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `taxable_value` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `cgst_total` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `sgst_total` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `igst_total` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `round_off` DECIMAL(6, 2) NOT NULL DEFAULT 0,
    `place_of_supply` VARCHAR(2) NULL,
    `is_intra_state` BOOLEAN NOT NULL DEFAULT true,
    `grand_total` DECIMAL(12, 2) NOT NULL,
    `status` ENUM('draft', 'sent', 'accepted', 'rejected', 'expired', 'converted', 'cancelled') NOT NULL DEFAULT 'draft',
    `amount_in_words` VARCHAR(500) NULL,
    `challan_no` VARCHAR(191) NULL,
    `vehicle_no` VARCHAR(191) NULL,
    `site_location` VARCHAR(191) NULL,
    `billing_address` TEXT NULL,
    `reference_number` VARCHAR(191) NULL,
    `terms_and_conditions` TEXT NULL,
    `notes` TEXT NULL,
    `authorized_signatory` VARCHAR(191) NULL,
    `converted_to_invoice_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `estimates_converted_to_invoice_id_key`(`converted_to_invoice_id`),
    UNIQUE INDEX `estimates_organization_id_estimate_number_key`(`organization_id`, `estimate_number`),
    INDEX `estimates_organization_id_status_estimate_date_idx`(`organization_id`, `status`, `estimate_date`),
    INDEX `estimates_customer_id_idx`(`customer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: estimate_items
CREATE TABLE `estimate_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `estimate_id` INTEGER NOT NULL,
    `product_id` INTEGER NULL,
    `product_variant_id` INTEGER NULL,
    `description` VARCHAR(191) NOT NULL,
    `hsn_code` VARCHAR(8) NULL,
    `unit` VARCHAR(191) NULL,
    `quantity` DECIMAL(10, 3) NOT NULL,
    `rate` DECIMAL(12, 2) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `discount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `taxable_value` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `gst_rate` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `cgst` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `sgst` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `igst` DECIMAL(12, 2) NOT NULL DEFAULT 0,

    INDEX `estimate_items_estimate_id_idx`(`estimate_id`),
    INDEX `estimate_items_product_id_idx`(`product_id`),
    INDEX `estimate_items_product_variant_id_idx`(`product_variant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKeys
ALTER TABLE `estimates` ADD CONSTRAINT `estimates_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `estimates` ADD CONSTRAINT `estimates_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `estimates` ADD CONSTRAINT `estimates_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `estimates` ADD CONSTRAINT `estimates_converted_to_invoice_id_fkey` FOREIGN KEY (`converted_to_invoice_id`) REFERENCES `invoices`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `estimate_items` ADD CONSTRAINT `estimate_items_estimate_id_fkey` FOREIGN KEY (`estimate_id`) REFERENCES `estimates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `estimate_items` ADD CONSTRAINT `estimate_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `estimate_items` ADD CONSTRAINT `estimate_items_product_variant_id_fkey` FOREIGN KEY (`product_variant_id`) REFERENCES `product_variants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
