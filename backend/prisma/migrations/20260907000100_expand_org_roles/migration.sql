-- Step 1: Convert existing "member" rows to "staff" before altering the enum
UPDATE `org_members` SET `role` = 'staff' WHERE `role` = 'member';
UPDATE `org_invites` SET `role` = 'staff' WHERE `role` = 'member';

-- Step 2: Alter the enum to the new set of values
ALTER TABLE `org_members` MODIFY COLUMN `role` ENUM('owner', 'admin', 'manager', 'staff', 'viewer') NOT NULL DEFAULT 'staff';
ALTER TABLE `org_invites` MODIFY COLUMN `role` ENUM('owner', 'admin', 'manager', 'staff', 'viewer') NOT NULL DEFAULT 'staff';
