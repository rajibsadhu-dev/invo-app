-- Product catalogue: business type on the organization, nested product categories,
-- products, and a nullable link from invoice lines back to the product they came from.
--
-- The invoice_items link is deliberately nullable with ON DELETE SET NULL: a line keeps
-- its own copy of description/HSN/unit/rate/GST, so losing the product reference never
-- alters an issued invoice.

-- AlterTable
ALTER TABLE `invoice_items` ADD COLUMN `product_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `organizations` ADD COLUMN `business_type` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `product_categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `organization_id` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `parent_id` INTEGER NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `product_categories_organization_id_idx`(`organization_id`),
    INDEX `product_categories_parent_id_idx`(`parent_id`),
    UNIQUE INDEX `product_categories_organization_id_name_parent_id_key`(`organization_id`, `name`, `parent_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `organization_id` INTEGER NOT NULL,
    `category_id` INTEGER NULL,
    `name` VARCHAR(191) NOT NULL,
    `sku` VARCHAR(50) NULL,
    `description` TEXT NULL,
    `hsn_code` VARCHAR(8) NULL,
    `unit` VARCHAR(20) NULL,
    `selling_price` DECIMAL(12, 2) NOT NULL,
    `purchase_price` DECIMAL(12, 2) NULL,
    `gst_rate` DECIMAL(5, 2) NOT NULL DEFAULT 18,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `has_variants` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `products_organization_id_category_id_idx`(`organization_id`, `category_id`),
    INDEX `products_organization_id_name_idx`(`organization_id`, `name`),
    UNIQUE INDEX `products_organization_id_sku_key`(`organization_id`, `sku`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `invoice_items_product_id_idx` ON `invoice_items`(`product_id`);

-- AddForeignKey
ALTER TABLE `product_categories` ADD CONSTRAINT `product_categories_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_categories` ADD CONSTRAINT `product_categories_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `product_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `product_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice_items` ADD CONSTRAINT `invoice_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

