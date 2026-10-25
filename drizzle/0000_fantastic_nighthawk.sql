CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`at` text NOT NULL,
	`data` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `locks` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `metadata` (
	`key` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `records` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `runs` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL
);
