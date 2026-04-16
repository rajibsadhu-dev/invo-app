SET NAMES utf8mb4;
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

-- 1. Prisma migrations table
DROP TABLE IF EXISTS `_prisma_migrations`;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `_prisma_migrations` VALUES
('713ee029-cb8b-4de1-a5a4-4920505e044f','6dc7e199920aae2a4561a5368ee910e43255b9b604b57a2e78059a698ac96fda','2026-04-05 12:18:23.932','20260405121823_invoice',NULL,NULL,'2026-04-05 12:18:23.909',1),
('a4941315-d88e-4c92-abad-67d38752398b','c5f913bda299d8f36c8f9e49552740ea3ddbfbf142ff4aa16d8b0490fea2487e','2026-04-04 17:53:27.057','20260404175326_start',NULL,NULL,'2026-04-04 17:53:26.694',1),
('b6166de7-b14e-4e6a-ad31-0bcd274a626a','6c3e4710b66d01a21a4d0314866ab899b321bf18f4a0fe4f8afe9c01df0306bd','2026-04-05 10:44:52.266','20260405104452_invoice_v2_fields',NULL,NULL,'2026-04-05 10:44:52.228',1);

-- 2. Users (no dependencies)
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('superadmin','user') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `users` VALUES
(1,'Super Admin','admin@example.com','$2b$12$IqQQW.7/vrjJXXJ6Eu/xW.HTogx0490o7JD8w.ttk7i3TYRHb.dwC',NULL,'superadmin','2026-04-04 21:02:54.061','2026-04-04 21:02:54.061'),
(2,'Rajib Sadhu','rajib@example.com','$2b$12$HKcrP8gu5q/4jFXlXcv6te/VkDmyhcQ3NMvrVdhs37Ip4ifKuClau','987654321','user','2026-04-04 21:17:46.415','2026-04-04 21:27:49.288'),
(3,'Rajesh Sadhu','rajesh@example.com','$2b$12$kAwz1c/e.2UEoKJECtgVsObkjuZP9Bq.6GrTtwf2pydlUmpnDWyh6','9876543210','user','2026-04-16 16:16:52.431','2026-04-16 16:16:52.431');

-- 3. Refresh tokens (depends on: users)
DROP TABLE IF EXISTS `refresh_tokens`;
CREATE TABLE `refresh_tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `token` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime(3) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `refresh_tokens_token_key` (`token`),
  KEY `refresh_tokens_expires_at_idx` (`expires_at`),
  KEY `refresh_tokens_user_id_fkey` (`user_id`),
  CONSTRAINT `refresh_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Organizations (depends on: users)
DROP TABLE IF EXISTS `organizations`;
CREATE TABLE `organizations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner_id` int NOT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `register_number` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gst_number` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invoice_prefix` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INV',
  `next_invoice_number` int NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `organizations_owner_id_fkey` (`owner_id`),
  CONSTRAINT `organizations_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `organizations` VALUES
(1,'Shajabo',1,'Choto Jirakpur','9876543210','rsgamer264@gmail.com',NULL,'111122',NULL,'INV',1,'2026-04-04 21:42:48.924','2026-04-04 21:45:06.809'),
(2,'MS Traders',2,NULL,NULL,NULL,NULL,NULL,NULL,'INV',4,'2026-04-04 21:47:19.544','2026-04-05 12:26:02.438'),
(3,'Shajabo',2,NULL,NULL,NULL,NULL,NULL,NULL,'INV',1,'2026-04-05 09:49:32.147','2026-04-05 09:49:32.147'),
(4,'Digineo',1,'Jadabpur, Kolkata','9876543210','admin@digine.c.in',NULL,NULL,NULL,'INV',2,'2026-04-07 13:22:22.280','2026-04-07 13:23:49.289'),
(5,'Rajesh Sadhu',3,'College Para, Basirhat, North 24 Parganas','9434055660',NULL,NULL,NULL,NULL,'INV',2,'2026-04-16 16:18:15.508','2026-04-16 16:21:23.621');

-- 5. Customers (depends on: organizations)
DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `organization_id` int NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `gst_number` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `customers_organization_id_fkey` (`organization_id`),
  CONSTRAINT `customers_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `customers` VALUES
(1,2,'GLS Reality Pvt Ltd',NULL,NULL,NULL,NULL,'2026-04-04 22:00:22.429','2026-04-04 22:00:22.429'),
(2,2,'Pintu Adak',NULL,NULL,'Howrah',NULL,'2026-04-05 12:24:53.836','2026-04-05 12:24:53.836'),
(3,4,'WBHSC','hsc@email.com','1234567890','Karunamoyee, Kolkata',NULL,'2026-04-07 13:23:05.045','2026-04-07 13:23:05.045'),
(4,5,'GLS Reality Pvt Ltd',NULL,NULL,'Newtown, Kolkata',NULL,'2026-04-16 16:19:06.914','2026-04-16 16:19:06.914');

-- 6. Invoices (depends on: organizations, customers)
DROP TABLE IF EXISTS `invoices`;
CREATE TABLE `invoices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `organization_id` int NOT NULL,
  `customer_id` int NOT NULL,
  `invoice_number` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  `tax` decimal(12,2) NOT NULL DEFAULT '0.00',
  `discount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `grand_total` decimal(12,2) NOT NULL,
  `status` enum('draft','sent','paid','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `amount_in_words` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `authorized_signatory` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_account` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_ifsc` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `billing_address` text COLLATE utf8mb4_unicode_ci,
  `challan_no` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invoice_date` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `notes` text COLLATE utf8mb4_unicode_ci,
  `payment_method` enum('cash','bank','upi') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `received_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `reference_number` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `site_location` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `terms_and_conditions` text COLLATE utf8mb4_unicode_ci,
  `vehicle_no` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transaction_number` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoices_organization_id_invoice_number_key` (`organization_id`,`invoice_number`),
  KEY `invoices_customer_id_fkey` (`customer_id`),
  CONSTRAINT `invoices_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `invoices_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `invoices` VALUES
(1,2,1,'INV-0001',53000.00,0.00,0.00,53000.00,'sent','Fifty Three Thousand Only','2026-04-05 09:45:10.293','2026-04-05 09:45:23.308',NULL,NULL,NULL,NULL,NULL,NULL,'2026-04-05 10:44:52.245',NULL,NULL,0.00,NULL,NULL,NULL,NULL,NULL),
(2,2,1,'INV-0002',55000.00,0.00,0.00,55000.00,'draft','Fifty Five Thousand Only','2026-04-05 12:05:53.306','2026-04-05 12:18:39.791','Rajib Sadhu',NULL,NULL,NULL,NULL,'200','2026-04-05 00:00:00.000',NULL,'upi',0.00,NULL,'Sonar Tori',NULL,'WB26C2088',NULL),
(3,2,2,'INV-0003',33250.00,0.00,0.00,33250.00,'draft','Thirty Three Thousand Two Hundred Fifty Only','2026-04-05 12:26:02.435','2026-04-05 13:57:22.356',NULL,NULL,NULL,NULL,NULL,'201','2026-04-05 00:00:00.000',NULL,NULL,0.00,NULL,'Dankuni',NULL,'WB55C0888',NULL),
(4,4,3,'INV-0001',10000.00,0.00,0.00,10000.00,'draft','Ten Thousand Only','2026-04-07 13:23:49.281','2026-04-07 13:23:49.281',NULL,NULL,NULL,NULL,NULL,NULL,'2026-04-07 00:00:00.000',NULL,NULL,20000.00,NULL,NULL,NULL,NULL,NULL),
(5,5,4,'INV-0001',53000.00,0.00,0.00,53000.00,'draft','Fifty Three Thousand Only','2026-04-16 16:21:23.617','2026-04-16 16:48:40.631',NULL,NULL,NULL,NULL,NULL,'200','2026-04-16 00:00:00.000',NULL,NULL,0.00,NULL,'Sonar Tori',NULL,'WB26C2088',NULL);

-- 7. Invoice items (depends on: invoices)
DROP TABLE IF EXISTS `invoice_items`;
CREATE TABLE `invoice_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invoice_id` int NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `rate` decimal(12,2) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `unit` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `invoice_items_invoice_id_fkey` (`invoice_id`),
  CONSTRAINT `invoice_items_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `invoice_items` VALUES
(1,1,'1st Class Bricks',5000.00,10.60,53000.00,NULL),
(4,2,'1st Class Bricks',5000.00,11.00,55000.00,''),
(6,3,'2nd Class Bricks',3500.00,9.50,33250.00,''),
(7,4,'Software',1.00,10000.00,10000.00,''),
(8,5,'1st Class Bricks',5000.00,10.60,53000.00,'pcs');

SET foreign_key_checks = 1;
