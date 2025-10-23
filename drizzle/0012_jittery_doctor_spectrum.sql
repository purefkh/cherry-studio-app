CREATE TABLE `app_state` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`description` text,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `preference` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text,
	`description` text,
	`created_at` integer,
	`updated_at` integer
);
