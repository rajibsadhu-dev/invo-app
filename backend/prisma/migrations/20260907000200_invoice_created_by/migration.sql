-- Add created_by_id to invoices for staff-scoped access
ALTER TABLE `invoices` ADD COLUMN `created_by_id` INT NULL AFTER `customer_id`;

-- Backfill: set created_by_id to the org owner for existing invoices
UPDATE `invoices` i
  JOIN `organizations` o ON o.`id` = i.`organization_id`
  SET i.`created_by_id` = o.`owner_id`;

-- Add foreign key with SET NULL on delete (user deletion shouldn't cascade to invoices)
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_created_by_id_fkey`
  FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Index for staff-scoped queries
CREATE INDEX `invoices_created_by_id_idx` ON `invoices`(`created_by_id`);
