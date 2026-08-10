import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
};

export const dataSources = sqliteTable("data_sources", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  kind: text("kind", { enum: ["official", "community", "operator", "open_data"] }).notNull(),
  url: text("url"),
  attribution: text("attribution"),
  priority: integer("priority").notNull().default(0),
  ...timestamps,
});

export const stations = sqliteTable("stations", {
  id: text("id").primaryKey(),
  officialId: text("official_id"),
  name: text("name").notNull(),
  brand: text("brand"),
  operator: text("operator"),
  address: text("address"),
  municipality: text("municipality"),
  province: text("province"),
  postalCode: text("postal_code"),
  latE6: integer("lat_e6").notNull(),
  lngE6: integer("lng_e6").notNull(),
  geoCell: text("geo_cell"),
  status: text("status", { enum: ["active", "closed", "temporary", "duplicate"] }).notNull().default("active"),
  sourceUpdatedAt: integer("source_updated_at", { mode: "timestamp_ms" }),
  ...timestamps,
}, (table) => [
  uniqueIndex("idx_stations_official_id").on(table.officialId),
  index("idx_stations_geo_status").on(table.geoCell, table.status),
  index("idx_stations_bounds").on(table.latE6, table.lngE6),
]);

export const roads = sqliteTable("roads", {
  id: text("id").primaryKey(),
  code: text("code").notNull(),
  name: text("name"),
  roadClass: text("road_class", { enum: ["autopista", "autovia", "nacional", "other"] }).notNull(),
  ownershipScope: text("ownership_scope", { enum: ["state", "regional", "local", "unknown"] }).notNull().default("unknown"),
  tollType: text("toll_type", { enum: ["free", "toll", "mixed", "unknown"] }).notNull().default("unknown"),
  ...timestamps,
}, (table) => [uniqueIndex("idx_roads_code").on(table.code)]);

export const roadDirections = sqliteTable("road_directions", {
  id: text("id").primaryKey(),
  roadId: text("road_id").notNull().references(() => roads.id),
  code: text("code").notNull(),
  label: text("label").notNull(),
}, (table) => [uniqueIndex("idx_directions_road_code").on(table.roadId, table.code)]);

export const roadExits = sqliteTable("road_exits", {
  id: text("id").primaryKey(),
  roadId: text("road_id").notNull().references(() => roads.id),
  directionId: text("direction_id").references(() => roadDirections.id),
  exitNumber: text("exit_number"),
  kmMeters: integer("km_meters"),
  label: text("label"),
}, (table) => [index("idx_exits_road_direction_number").on(table.roadId, table.directionId, table.exitNumber)]);

export const stationAccess = sqliteTable("station_access", {
  id: text("id").primaryKey(),
  stationId: text("station_id").notNull().references(() => stations.id),
  roadId: text("road_id").notNull().references(() => roads.id),
  directionId: text("direction_id").references(() => roadDirections.id),
  exitId: text("exit_id").references(() => roadExits.id),
  kmMeters: integer("km_meters"),
  directAccess: integer("direct_access", { mode: "boolean" }).notNull().default(false),
  carriagewaySide: text("carriageway_side", { enum: ["left", "right", "both", "unknown"] }).notNull().default("unknown"),
  detourSeconds: integer("detour_seconds"),
  notes: text("notes"),
}, (table) => [index("idx_access_road_direction_km").on(table.roadId, table.directionId, table.kmMeters)]);

export const serviceTypes = sqliteTable("service_types", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  displayName: text("display_name").notNull(),
  category: text("category").notNull(),
});

export const stationServices = sqliteTable("station_services", {
  stationId: text("station_id").notNull().references(() => stations.id),
  serviceTypeId: text("service_type_id").notNull().references(() => serviceTypes.id),
  availability: text("availability", { enum: ["yes", "no", "unknown", "seasonal"] }).notNull().default("unknown"),
  accessCondition: text("access_condition"),
  sourceId: text("source_id").references(() => dataSources.id),
  observedAt: integer("observed_at", { mode: "timestamp_ms" }),
}, (table) => [primaryKey({ columns: [table.stationId, table.serviceTypeId] })]);

export const fuelTypes = sqliteTable("fuel_types", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  displayName: text("display_name").notNull(),
  unit: text("unit", { enum: ["litre", "kwh", "kg"] }).notNull(),
});

export const stationCurrentPrices = sqliteTable("station_current_prices", {
  stationId: text("station_id").notNull().references(() => stations.id),
  fuelTypeId: text("fuel_type_id").notNull().references(() => fuelTypes.id),
  priceMicros: integer("price_micros").notNull(),
  currency: text("currency").notNull().default("EUR"),
  sourceId: text("source_id").notNull().references(() => dataSources.id),
  observedAt: integer("observed_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [
  primaryKey({ columns: [table.stationId, table.fuelTypeId] }),
  index("idx_current_prices_fuel_price").on(table.fuelTypeId, table.priceMicros),
]);

export const priceObservations = sqliteTable("price_observations", {
  id: text("id").primaryKey(),
  stationId: text("station_id").notNull().references(() => stations.id),
  fuelTypeId: text("fuel_type_id").notNull().references(() => fuelTypes.id),
  sourceId: text("source_id").notNull().references(() => dataSources.id),
  priceMicros: integer("price_micros").notNull(),
  currency: text("currency").notNull().default("EUR"),
  observedAt: integer("observed_at", { mode: "timestamp_ms" }).notNull(),
  ingestedAt: integer("ingested_at", { mode: "timestamp_ms" }).notNull(),
  payloadHash: text("payload_hash"),
}, (table) => [
  uniqueIndex("idx_price_observation_dedupe").on(table.stationId, table.fuelTypeId, table.sourceId, table.observedAt),
  index("idx_price_history_station_fuel_time").on(table.stationId, table.fuelTypeId, table.observedAt),
]);

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  role: text("role", { enum: ["user", "moderator", "admin"] }).notNull().default("user"),
  status: text("status", { enum: ["active", "suspended", "deleted"] }).notNull().default("active"),
  trustScore: integer("trust_score").notNull().default(0),
  ...timestamps,
});

export const authIdentities = sqliteTable("auth_identities", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  provider: text("provider", { enum: ["google", "facebook", "chatgpt"] }).notNull(),
  providerSubject: text("provider_subject").notNull(),
  email: text("email"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [uniqueIndex("idx_auth_provider_subject").on(table.provider, table.providerSubject)]);

export const ratingDimensions = sqliteTable("rating_dimensions", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  displayName: text("display_name").notNull(),
  weightBps: integer("weight_bps").notNull(),
});

export const stationRatings = sqliteTable("station_ratings", {
  stationId: text("station_id").notNull().references(() => stations.id),
  userId: text("user_id").notNull().references(() => users.id),
  dimensionId: text("dimension_id").notNull().references(() => ratingDimensions.id),
  value: integer("value").notNull(),
  visitVerified: integer("visit_verified", { mode: "boolean" }).notNull().default(false),
  ...timestamps,
}, (table) => [
  primaryKey({ columns: [table.stationId, table.userId, table.dimensionId] }),
  index("idx_ratings_station_dimension").on(table.stationId, table.dimensionId),
]);

export const stationConfirmations = sqliteTable("station_confirmations", {
  id: text("id").primaryKey(),
  stationId: text("station_id").notNull().references(() => stations.id),
  userId: text("user_id").notNull().references(() => users.id),
  category: text("category", { enum: ["lpg_status", "adblue_status", "bathroom", "coffee", "restaurant", "cleanliness"] }).notNull(),
  status: text("status", { enum: ["working", "no_product", "broken", "open", "closed", "clean", "dirty", "good", "poor"] }).notNull(),
  proximityVerified: integer("proximity_verified", { mode: "boolean" }).notNull().default(false),
  dayBucket: integer("day_bucket").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [
  uniqueIndex("idx_confirmations_user_station_category_day").on(table.stationId, table.userId, table.category, table.dayBucket),
  index("idx_confirmations_station_category_created").on(table.stationId, table.category, table.createdAt),
]);

export const stationConfirmationSummaries = sqliteTable("station_confirmation_summaries", {
  stationId: text("station_id").notNull().references(() => stations.id),
  category: text("category", { enum: ["lpg_status", "adblue_status", "bathroom", "coffee", "restaurant", "cleanliness"] }).notNull(),
  latestStatus: text("latest_status", { enum: ["working", "no_product", "broken", "open", "closed", "clean", "dirty", "good", "poor"] }).notNull(),
  latestAt: integer("latest_at", { mode: "timestamp_ms" }).notNull(),
  latestProximityVerified: integer("latest_proximity_verified", { mode: "boolean" }).notNull().default(false),
}, (table) => [primaryKey({ columns: [table.stationId, table.category] })]);

export const reviews = sqliteTable("reviews", {
  id: text("id").primaryKey(),
  stationId: text("station_id").notNull().references(() => stations.id),
  userId: text("user_id").notNull().references(() => users.id),
  body: text("body").notNull(),
  visitDate: integer("visit_date", { mode: "timestamp_ms" }),
  visitVerified: integer("visit_verified", { mode: "boolean" }).notNull().default(false),
  status: text("status", { enum: ["pending", "published", "rejected", "hidden", "deleted"] }).notNull().default("pending"),
  editedAt: integer("edited_at", { mode: "timestamp_ms" }),
  ...timestamps,
}, (table) => [index("idx_reviews_station_status_created").on(table.stationId, table.status, table.createdAt)]);

export const reviewVotes = sqliteTable("review_votes", {
  reviewId: text("review_id").notNull().references(() => reviews.id),
  userId: text("user_id").notNull().references(() => users.id),
  value: integer("value").notNull().default(1),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [primaryKey({ columns: [table.reviewId, table.userId] })]);

export const photos = sqliteTable("photos", {
  id: text("id").primaryKey(),
  stationId: text("station_id").notNull().references(() => stations.id),
  reviewId: text("review_id").references(() => reviews.id),
  ownerUserId: text("owner_user_id").notNull().references(() => users.id),
  r2Key: text("r2_key").notNull().unique(),
  mimeType: text("mime_type").notNull(),
  byteSize: integer("byte_size").notNull(),
  width: integer("width"),
  height: integer("height"),
  sha256: text("sha256").notNull(),
  status: text("status", { enum: ["uploading", "pending", "published", "rejected", "deleted"] }).notNull().default("uploading"),
  moderationReason: text("moderation_reason"),
  ...timestamps,
}, (table) => [index("idx_photos_station_status").on(table.stationId, table.status)]);

export const reports = sqliteTable("reports", {
  id: text("id").primaryKey(),
  reporterUserId: text("reporter_user_id").notNull().references(() => users.id),
  targetType: text("target_type", { enum: ["review", "photo", "station", "user"] }).notNull(),
  targetId: text("target_id").notNull(),
  reason: text("reason").notNull(),
  detail: text("detail"),
  status: text("status", { enum: ["open", "reviewing", "resolved", "rejected"] }).notNull().default("open"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  resolvedAt: integer("resolved_at", { mode: "timestamp_ms" }),
}, (table) => [index("idx_reports_status_created").on(table.status, table.createdAt)]);

export const ingestRuns = sqliteTable("ingest_runs", {
  id: text("id").primaryKey(),
  sourceId: text("source_id").notNull().references(() => dataSources.id),
  kind: text("kind", { enum: ["stations", "prices", "services", "roads"] }).notNull(),
  status: text("status", { enum: ["running", "succeeded", "failed"] }).notNull(),
  rowsSeen: integer("rows_seen").notNull().default(0),
  rowsWritten: integer("rows_written").notNull().default(0),
  errorSummary: text("error_summary"),
  startedAt: integer("started_at", { mode: "timestamp_ms" }).notNull(),
  finishedAt: integer("finished_at", { mode: "timestamp_ms" }),
});
