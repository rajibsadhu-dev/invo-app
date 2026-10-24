-- AlterTable
ALTER TABLE `invoices` ADD COLUMN `verification_token` VARCHAR(64) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `invoices_verification_token_key` ON `invoices`(`verification_token`);
