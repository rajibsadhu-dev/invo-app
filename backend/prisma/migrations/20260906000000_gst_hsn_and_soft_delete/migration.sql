-- GST (HSN/SAC + CGST/SGST/IGST), invoice soft delete, and owner-delete protection.
--
-- NOT YET APPLIED. Review, back up, then run `npx prisma migrate deploy`.
--
-- Backfill policy (agreed 2026-09-06): existing invoices are treated as 0% GST and keep
-- their original flat `tax` value, so no historical total changes. New invoices compute
-- `tax` as the sum of per-line GST instead.

-- DropForeignKey
ALTER TABLE `organizations` DROP FOREIGN KEY `organizations_owner_id_fkey`;

-- AlterTable
ALTER TABLE `organizations` ADD COLUMN `state_code` VARCHAR(2) NULL;

-- AlterTable
ALTER TABLE `customers` ADD COLUMN `state_code` VARCHAR(2) NULL;

-- AlterTable
ALTER TABLE `invoices` ADD COLUMN `cgst_total` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `deleted_at` DATETIME(3) NULL,
    ADD COLUMN `igst_total` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `is_intra_state` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `place_of_supply` VARCHAR(2) NULL,
    ADD COLUMN `round_off` DECIMAL(6, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `sgst_total` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `taxable_value` DECIMAL(12, 2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `invoice_items` ADD COLUMN `cgst` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `discount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `gst_rate` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `hsn_code` VARCHAR(8) NULL,
    ADD COLUMN `igst` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `sgst` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `taxable_value` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    MODIFY `quantity` DECIMAL(10, 3) NOT NULL;

-- CreateIndex
CREATE INDEX `customers_organization_id_name_idx` ON `customers`(`organization_id`, `name`);

-- CreateIndex
CREATE INDEX `invoices_organization_id_status_invoice_date_idx` ON `invoices`(`organization_id`, `status`, `invoice_date`);

-- CreateIndex
CREATE INDEX `invoices_organization_id_deleted_at_idx` ON `invoices`(`organization_id`, `deleted_at`);

-- CreateIndex
CREATE INDEX `invoices_customer_id_idx` ON `invoices`(`customer_id`);

-- CreateIndex
CREATE INDEX `invoice_items_invoice_id_idx` ON `invoice_items`(`invoice_id`);

-- AddForeignKey
ALTER TABLE `organizations` ADD CONSTRAINT `organizations_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;


-- ─── Backfill: existing rows ─────────────────────────────────────────────────────────
-- Apportion each invoice's existing invoice-level discount across its lines pro rata.
--
-- Rounding each line independently leaves a residual (three lines sharing a 10.00 discount
-- round to 3.33 each = 9.99), so the last line of each invoice absorbs the difference.
-- Without this, SUM(invoice_items.taxable_value) does not equal invoices.taxable_value.
-- This mirrors src/helpers/gst.ts, which assigns the residual the same way.
CREATE TEMPORARY TABLE `_gst_line_discounts` AS
SELECT
    `x`.`id`,
    `x`.`share` + CASE WHEN `x`.`is_last` = 1 THEN `x`.`invoice_discount` - `x`.`total_share` ELSE 0 END AS `line_discount`
FROM (
    SELECT
        `it`.`id`,
        `v`.`discount` AS `invoice_discount`,
        CASE WHEN `v`.`subtotal` > 0
             THEN ROUND(`v`.`discount` * (`it`.`amount` / `v`.`subtotal`), 2)
             ELSE 0 END AS `share`,
        SUM(CASE WHEN `v`.`subtotal` > 0
                 THEN ROUND(`v`.`discount` * (`it`.`amount` / `v`.`subtotal`), 2)
                 ELSE 0 END) OVER (PARTITION BY `it`.`invoice_id`) AS `total_share`,
        CASE WHEN ROW_NUMBER() OVER (PARTITION BY `it`.`invoice_id` ORDER BY `it`.`id` DESC) = 1
             THEN 1 ELSE 0 END AS `is_last`
    FROM `invoice_items` `it`
    JOIN `invoices` `v` ON `v`.`id` = `it`.`invoice_id`
) `x`;

UPDATE `invoice_items` `it`
JOIN `_gst_line_discounts` `d` ON `d`.`id` = `it`.`id`
SET `it`.`discount` = `d`.`line_discount`,
    `it`.`taxable_value` = `it`.`amount` - `d`.`line_discount`;

DROP TEMPORARY TABLE `_gst_line_discounts`;

-- Taxable value is subtotal net of discount. grand_total is left untouched: for legacy
-- rows it already equals taxable_value + tax, which is the same invariant the new code
-- enforces (with round_off = 0).
UPDATE `invoices`
SET `taxable_value` = `subtotal` - `discount`
WHERE `taxable_value` = 0;
