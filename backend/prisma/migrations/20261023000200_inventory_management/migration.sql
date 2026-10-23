-- Add stock fields to products (for non-variant products)
ALTER TABLE `products`
  ADD COLUMN `stock_quantity` DECIMAL(10, 3) NOT NULL DEFAULT 0 AFTER `gst_rate`,
  ADD COLUMN `low_stock_alert` DECIMAL(10, 3) NULL AFTER `stock_quantity`;

-- Add deduct_stock_on to organizations
ALTER TABLE `organizations`
  ADD COLUMN `deduct_stock_on` VARCHAR(10) NOT NULL DEFAULT 'sent' AFTER `next_invoice_number`;

-- Create stock_movements table
CREATE TABLE `stock_movements` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `organization_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `product_variant_id` INT NULL,
  `type` VARCHAR(20) NOT NULL,
  `quantity` DECIMAL(10, 3) NOT NULL,
  `reference_type` VARCHAR(30) NULL,
  `reference_id` INT NULL,
  `notes` TEXT NULL,
  `created_by` INT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `stock_movements_organization_id_product_id_idx` (`organization_id`, `product_id`),
  INDEX `stock_movements_organization_id_created_at_idx` (`organization_id`, `created_at`),
  INDEX `stock_movements_reference_type_reference_id_idx` (`reference_type`, `reference_id`),
  CONSTRAINT `stock_movements_organization_id_fkey`
    FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `stock_movements_product_id_fkey`
    FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `stock_movements_product_variant_id_fkey`
    FOREIGN KEY (`product_variant_id`) REFERENCES `product_variants` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `stock_movements_created_by_fkey`
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
