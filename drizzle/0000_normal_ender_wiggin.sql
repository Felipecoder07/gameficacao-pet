CREATE TABLE `activities` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`task_id` text NOT NULL,
	`month_id` text NOT NULL,
	`activity_date` text NOT NULL,
	`description` text NOT NULL,
	`proof` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`points_granted` real,
	`difficulty_snapshot` text,
	`validator_id` text,
	`validated_at` text,
	`reason` text,
	`repeat_key` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`month_id`) REFERENCES `months`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `appeals` (
	`id` text PRIMARY KEY NOT NULL,
	`activity_id` text NOT NULL,
	`member_id` text NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`reviewer_id` text,
	`decision` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `appeals_activity_id_unique` ON `appeals` (`activity_id`);--> statement-breakpoint
CREATE TABLE `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text NOT NULL,
	`action` text NOT NULL,
	`target_id` text NOT NULL,
	`detail` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`auth_id` text,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `members_auth_id_unique` ON `members` (`auth_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `members_email_unique` ON `members` (`email`);--> statement-breakpoint
CREATE TABLE `months` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'test' NOT NULL,
	`validation_deadline` text,
	`closed_at` text,
	`winner_ids` text
);
--> statement-breakpoint
CREATE TABLE `participations` (
	`id` text PRIMARY KEY NOT NULL,
	`activity_id` text NOT NULL,
	`member_id` text NOT NULL,
	`role` text NOT NULL,
	`share` real NOT NULL,
	`own_deliverable` text NOT NULL,
	FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `participation_unique` ON `participations` (`activity_id`,`member_id`);--> statement-breakpoint
CREATE TABLE `task_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`deliverable` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`family_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`difficulty` text NOT NULL,
	`points` integer NOT NULL,
	`deliverable` text NOT NULL,
	`proof_type` text DEFAULT 'link' NOT NULL,
	`repeat_type` text DEFAULT 'none' NOT NULL,
	`repeat_limit` integer DEFAULT 1 NOT NULL,
	`group_allowed` integer DEFAULT false NOT NULL,
	`effective_month` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL
);
