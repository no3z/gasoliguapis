CREATE TABLE `station_confirmations` (
	`id` text PRIMARY KEY NOT NULL,
	`station_id` text NOT NULL,
	`user_id` text NOT NULL,
	`category` text NOT NULL,
	`status` text NOT NULL,
	`proximity_verified` integer DEFAULT false NOT NULL,
	`day_bucket` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`station_id`) REFERENCES `stations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_confirmations_user_station_category_day` ON `station_confirmations` (`station_id`,`user_id`,`category`,`day_bucket`);--> statement-breakpoint
CREATE INDEX `idx_confirmations_station_category_created` ON `station_confirmations` (`station_id`,`category`,`created_at`);