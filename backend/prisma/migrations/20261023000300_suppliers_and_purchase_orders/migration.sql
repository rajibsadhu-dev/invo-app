-- Suppliers & Purchase Orders (Phase 5)

-- PO prefix + numbering on organizations
ALTER TABLE `organizations`
  ADD COLUMN `po_prefix` VARCHAR(10) NOT NULL DEFAULT 'PO' AFTER `deduct_stock_on`,
  ADD COLUMN `next_po_number` INTEGER NOT NULL DEFAULT 1 AFTER `po_prefix`;

-- Suppliers
CREATE TABLE `suppliers` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `organization_id` INTEGER NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NULL,
  `phone` VARCHAR(191) NULL,
  `address` TEXT NULL,
  `gst_number` VARCHAR(15) NULL,
  `state_code` VARCHAR(2) NULL,
  `contact_person` VARCHAR(191) NULL,
  `notes` TEXT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`),
  INDEX `idx_suppliers_org_name` (`organization_id`, `name`),
  CONSTRAINT `fk_suppliers_organization` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Purchase orders
CREATE TABLE `purchase_orders` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `organization_id` INTEGER NOT NULL,
  `supplier_id` INTEGER NOT NULL,
  `po_number` VARCHAR(191) NOT NULL,
  `po_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expected_date` DATETIME(3) NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'draft',
  `subtotal` DECIMAL(12, 2) NOT NULL,
  `tax_total` DECIMAL(12, 2) NOT NULL DEFAULT 0,
  `grand_total` DECIMAL(12, 2) NOT NULL,
  `notes` TEXT NULL,
  `deleted_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_purchase_orders_org_number` (`organization_id`, `po_number`),
  INDEX `idx_purchase_orders_org_status` (`organization_id`, `status`),
  INDEX `idx_purchase_orders_supplier` (`supplier_id`),
  CONSTRAINT `fk_purchase_orders_organization` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_purchase_orders_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Purchase order line items
CREATE TABLE `purchase_order_items` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `purchase_order_id` INTEGER NOT NULL,
  `product_id` INTEGER NOT NULL,
  `product_variant_id` INTEGER NULL,
  `description` VARCHAR(191) NOT NULL,
  `hsn_code` VARCHAR(8) NULL,
  `unit` VARCHAR(20) NULL,
  `quantity` DECIMAL(10, 3) NOT NULL,
  `received_quantity` DECIMAL(10, 3) NOT NULL DEFAULT 0,
  `rate` DECIMAL(12, 2) NOT NULL,
  `amount` DECIMAL(12, 2) NOT NULL,
  `gst_rate` DECIMAL(5, 2) NOT NULL DEFAULT 0,
  `gst_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,

  PRIMARY KEY (`id`),
  INDEX `idx_po_items_po` (`purchase_order_id`),
  INDEX `idx_po_items_product` (`product_id`),
  CONSTRAINT `fk_po_items_purchase_order` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_po_items_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_po_items_variant` FOREIGN KEY (`product_variant_id`) REFERENCES `product_variants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
