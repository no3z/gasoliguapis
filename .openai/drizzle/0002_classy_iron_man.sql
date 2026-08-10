CREATE TABLE `station_confirmation_summaries` (
	`station_id` text NOT NULL,
	`category` text NOT NULL,
	`latest_status` text NOT NULL,
	`latest_at` integer NOT NULL,
	`latest_proximity_verified` integer DEFAULT false NOT NULL,
	PRIMARY KEY(`station_id`, `category`),
	FOREIGN KEY (`station_id`) REFERENCES `stations`(`id`) ON UPDATE no action ON DELETE no action
);
