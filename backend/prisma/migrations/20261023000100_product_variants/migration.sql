-- CreateTable: variant_attributes
CREATE TABLE `variant_attributes` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `organization_id` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `values` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `variant_attributes_organization_id_idx`(`organization_id`),
    UNIQUE INDEX `variant_attributes_organization_id_name_key`(`organization_id`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: product_variants
CREATE TABLE `product_variants` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `sku` VARCHAR(50) NULL,
    `name` VARCHAR(191) NOT NULL,
    `attributes` JSON NOT NULL,
    `selling_price` DECIMAL(12, 2) NULL,
    `purchase_price` DECIMAL(12, 2) NULL,
    `stock_quantity` DECIMAL(10, 3) NOT NULL DEFAULT 0,
    `low_stock_alert` DECIMAL(10, 3) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `product_variants_product_id_idx`(`product_id`),
    UNIQUE INDEX `product_variants_product_id_sku_key`(`product_id`, `sku`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable: invoice_items — add product_variant_id FK
ALTER TABLE `invoice_items` ADD COLUMN `product_variant_id` INTEGER NULL;
CREATE INDEX `invoice_items_product_variant_id_idx` ON `invoice_items`(`product_variant_id`);

-- AddForeignKey: variant_attributes → organizations
ALTER TABLE `variant_attributes` ADD CONSTRAINT `variant_attributes_organization_id_fkey`
    FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: product_variants → products
ALTER TABLE `product_variants` ADD CONSTRAINT `product_variants_product_id_fkey`
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: invoice_items.product_variant_id → product_variants
ALTER TABLE `invoice_items` ADD CONSTRAINT `invoice_items_product_variant_id_fkey`
    FOREIGN KEY (`product_variant_id`) REFERENCES `product_variants`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
