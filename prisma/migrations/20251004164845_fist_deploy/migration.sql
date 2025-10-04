-- AlterTable
ALTER TABLE `deliveries` ADD COLUMN `is_deleted` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `delivery_drivers` ADD COLUMN `isDeleted` BOOLEAN NOT NULL DEFAULT false;
