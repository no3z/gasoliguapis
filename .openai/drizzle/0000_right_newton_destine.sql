CREATE TABLE `auth_identities` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider` text NOT NULL,
	`provider_subject` text NOT NULL,
	`email` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_auth_provider_subject` ON `auth_identities` (`provider`,`provider_subject`);--> statement-breakpoint
CREATE TABLE `data_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`url` text,
	`attribution` text,
	`priority` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `fuel_types` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`display_name` text NOT NULL,
	`unit` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `fuel_types_code_unique` ON `fuel_types` (`code`);--> statement-breakpoint
CREATE TABLE `ingest_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`kind` text NOT NULL,
	`status` text NOT NULL,
	`rows_seen` integer DEFAULT 0 NOT NULL,
	`rows_written` integer DEFAULT 0 NOT NULL,
	`error_summary` text,
	`started_at` integer NOT NULL,
	`finished_at` integer,
	FOREIGN KEY (`source_id`) REFERENCES `data_sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `photos` (
	`id` text PRIMARY KEY NOT NULL,
	`station_id` text NOT NULL,
	`review_id` text,
	`owner_user_id` text NOT NULL,
	`r2_key` text NOT NULL,
	`mime_type` text NOT NULL,
	`byte_size` integer NOT NULL,
	`width` integer,
	`height` integer,
	`sha256` text NOT NULL,
	`status` text DEFAULT 'uploading' NOT NULL,
	`moderation_reason` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`station_id`) REFERENCES `stations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`review_id`) REFERENCES `reviews`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `photos_r2_key_unique` ON `photos` (`r2_key`);--> statement-breakpoint
CREATE INDEX `idx_photos_station_status` ON `photos` (`station_id`,`status`);--> statement-breakpoint
CREATE TABLE `price_observations` (
	`id` text PRIMARY KEY NOT NULL,
	`station_id` text NOT NULL,
	`fuel_type_id` text NOT NULL,
	`source_id` text NOT NULL,
	`price_micros` integer NOT NULL,
	`currency` text DEFAULT 'EUR' NOT NULL,
	`observed_at` integer NOT NULL,
	`ingested_at` integer NOT NULL,
	`payload_hash` text,
	FOREIGN KEY (`station_id`) REFERENCES `stations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`fuel_type_id`) REFERENCES `fuel_types`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_id`) REFERENCES `data_sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_price_observation_dedupe` ON `price_observations` (`station_id`,`fuel_type_id`,`source_id`,`observed_at`);--> statement-breakpoint
CREATE INDEX `idx_price_history_station_fuel_time` ON `price_observations` (`station_id`,`fuel_type_id`,`observed_at`);--> statement-breakpoint
CREATE TABLE `rating_dimensions` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`display_name` text NOT NULL,
	`weight_bps` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rating_dimensions_code_unique` ON `rating_dimensions` (`code`);--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`reporter_user_id` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`reason` text NOT NULL,
	`detail` text,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` integer NOT NULL,
	`resolved_at` integer,
	FOREIGN KEY (`reporter_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_reports_status_created` ON `reports` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `review_votes` (
	`review_id` text NOT NULL,
	`user_id` text NOT NULL,
	`value` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`review_id`, `user_id`),
	FOREIGN KEY (`review_id`) REFERENCES `reviews`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`station_id` text NOT NULL,
	`user_id` text NOT NULL,
	`body` text NOT NULL,
	`visit_date` integer,
	`visit_verified` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`edited_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`station_id`) REFERENCES `stations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_reviews_station_status_created` ON `reviews` (`station_id`,`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `road_directions` (
	`id` text PRIMARY KEY NOT NULL,
	`road_id` text NOT NULL,
	`code` text NOT NULL,
	`label` text NOT NULL,
	FOREIGN KEY (`road_id`) REFERENCES `roads`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_directions_road_code` ON `road_directions` (`road_id`,`code`);--> statement-breakpoint
CREATE TABLE `road_exits` (
	`id` text PRIMARY KEY NOT NULL,
	`road_id` text NOT NULL,
	`direction_id` text,
	`exit_number` text,
	`km_meters` integer,
	`label` text,
	FOREIGN KEY (`road_id`) REFERENCES `roads`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`direction_id`) REFERENCES `road_directions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_exits_road_direction_number` ON `road_exits` (`road_id`,`direction_id`,`exit_number`);--> statement-breakpoint
CREATE TABLE `roads` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text,
	`road_class` text NOT NULL,
	`ownership_scope` text DEFAULT 'unknown' NOT NULL,
	`toll_type` text DEFAULT 'unknown' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_roads_code` ON `roads` (`code`);--> statement-breakpoint
CREATE TABLE `service_types` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`display_name` text NOT NULL,
	`category` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `service_types_code_unique` ON `service_types` (`code`);--> statement-breakpoint
CREATE TABLE `station_access` (
	`id` text PRIMARY KEY NOT NULL,
	`station_id` text NOT NULL,
	`road_id` text NOT NULL,
	`direction_id` text,
	`exit_id` text,
	`km_meters` integer,
	`direct_access` integer DEFAULT false NOT NULL,
	`carriageway_side` text DEFAULT 'unknown' NOT NULL,
	`detour_seconds` integer,
	`notes` text,
	FOREIGN KEY (`station_id`) REFERENCES `stations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`road_id`) REFERENCES `roads`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`direction_id`) REFERENCES `road_directions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`exit_id`) REFERENCES `road_exits`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_access_road_direction_km` ON `station_access` (`road_id`,`direction_id`,`km_meters`);--> statement-breakpoint
CREATE TABLE `station_current_prices` (
	`station_id` text NOT NULL,
	`fuel_type_id` text NOT NULL,
	`price_micros` integer NOT NULL,
	`currency` text DEFAULT 'EUR' NOT NULL,
	`source_id` text NOT NULL,
	`observed_at` integer NOT NULL,
	PRIMARY KEY(`station_id`, `fuel_type_id`),
	FOREIGN KEY (`station_id`) REFERENCES `stations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`fuel_type_id`) REFERENCES `fuel_types`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_id`) REFERENCES `data_sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_current_prices_fuel_price` ON `station_current_prices` (`fuel_type_id`,`price_micros`);--> statement-breakpoint
CREATE TABLE `station_ratings` (
	`station_id` text NOT NULL,
	`user_id` text NOT NULL,
	`dimension_id` text NOT NULL,
	`value` integer NOT NULL,
	`visit_verified` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`station_id`, `user_id`, `dimension_id`),
	FOREIGN KEY (`station_id`) REFERENCES `stations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`dimension_id`) REFERENCES `rating_dimensions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_ratings_station_dimension` ON `station_ratings` (`station_id`,`dimension_id`);--> statement-breakpoint
CREATE TABLE `station_services` (
	`station_id` text NOT NULL,
	`service_type_id` text NOT NULL,
	`availability` text DEFAULT 'unknown' NOT NULL,
	`access_condition` text,
	`source_id` text,
	`observed_at` integer,
	PRIMARY KEY(`station_id`, `service_type_id`),
	FOREIGN KEY (`station_id`) REFERENCES `stations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`service_type_id`) REFERENCES `service_types`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_id`) REFERENCES `data_sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `stations` (
	`id` text PRIMARY KEY NOT NULL,
	`official_id` text,
	`name` text NOT NULL,
	`brand` text,
	`operator` text,
	`address` text,
	`municipality` text,
	`province` text,
	`postal_code` text,
	`lat_e6` integer NOT NULL,
	`lng_e6` integer NOT NULL,
	`geo_cell` text,
	`status` text DEFAULT 'active' NOT NULL,
	`source_updated_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_stations_official_id` ON `stations` (`official_id`);--> statement-breakpoint
CREATE INDEX `idx_stations_geo_status` ON `stations` (`geo_cell`,`status`);--> statement-breakpoint
CREATE INDEX `idx_stations_bounds` ON `stations` (`lat_e6`,`lng_e6`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`trust_score` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
