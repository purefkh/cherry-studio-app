ALTER TABLE `topics` RENAME COLUMN "pinned" TO "isLoading";--> statement-breakpoint
DROP TABLE `backup_providers`;--> statement-breakpoint
ALTER TABLE `topics` DROP COLUMN `prompt`;--> statement-breakpoint
ALTER TABLE `topics` DROP COLUMN `is_name_manually_edited`;