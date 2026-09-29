CREATE TABLE IF NOT EXISTS "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"subscription" varchar(50) DEFAULT 'free' NOT NULL,
	"fcm_token" varchar(500),
	CONSTRAINT "accounts_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"severity" varchar(20) DEFAULT 'info' NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text,
	"metadata_json" jsonb,
	"acknowledged" boolean DEFAULT false NOT NULL,
	"acknowledged_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "app_usage_daily" (
	"id" bigserial NOT NULL,
	"child_id" uuid NOT NULL,
	"device_id" uuid NOT NULL,
	"package_name" varchar(255) NOT NULL,
	"app_name" varchar(100),
	"date" date NOT NULL,
	"total_foreground_ms" bigint NOT NULL,
	"launch_count" integer DEFAULT 0 NOT NULL,
	"first_used" timestamp with time zone,
	"last_used" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "app_usage_events" (
	"id" bigserial NOT NULL,
	"child_id" uuid NOT NULL,
	"device_id" uuid NOT NULL,
	"package_name" varchar(255) NOT NULL,
	"app_name" varchar(100),
	"event_type" varchar(20) NOT NULL,
	"recorded_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "call_logs" (
	"id" bigserial NOT NULL,
	"child_id" uuid NOT NULL,
	"device_id" uuid NOT NULL,
	"phone_number" varchar(20) NOT NULL,
	"contact_name" varchar(100),
	"call_type" varchar(10) NOT NULL,
	"duration_secs" integer,
	"recorded_at" timestamp with time zone NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_messages" (
	"id" bigserial NOT NULL,
	"child_id" uuid NOT NULL,
	"notification_id" bigint,
	"platform" varchar(50) NOT NULL,
	"conversation_id" varchar(255),
	"sender_name" varchar(100),
	"sender_number" varchar(20),
	"message_text" text,
	"media_type" varchar(20),
	"media_url" text,
	"direction" varchar(10),
	"risk_score" real,
	"risk_flags" varchar(50)[],
	"recorded_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "children" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"birth_date" date,
	"device_id" varchar(100),
	"fcm_token" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"last_seen_at" timestamp with time zone,
	CONSTRAINT "children_device_id_unique" UNIQUE("device_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "device_commands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_id" uuid NOT NULL,
	"command_type" varchar(50) NOT NULL,
	"payload_json" jsonb NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"delivered_at" timestamp with time zone,
	"executed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "device_health" (
	"id" bigserial NOT NULL,
	"child_id" uuid NOT NULL,
	"device_id" uuid NOT NULL,
	"battery_level" smallint,
	"battery_charging" boolean,
	"network_type" varchar(20),
	"wifi_ssid" varchar(100),
	"storage_free_mb" bigint,
	"memory_free_mb" bigint,
	"screen_on" boolean,
	"services_active_json" jsonb,
	"recorded_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_id" uuid NOT NULL,
	"device_token" varchar(500) NOT NULL,
	"model" varchar(100),
	"manufacturer" varchar(100),
	"android_version" varchar(20),
	"sdk_version" integer,
	"app_version" varchar(20),
	"oem" varchar(50),
	"battery_opt_exempt" boolean DEFAULT false,
	"admin_active" boolean DEFAULT false,
	"accessibility_active" boolean DEFAULT false,
	"notif_listener_active" boolean DEFAULT false,
	"vpn_active" boolean DEFAULT false,
	"last_heartbeat" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "devices_device_token_unique" UNIQUE("device_token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "geofence_events" (
	"id" bigserial NOT NULL,
	"child_id" uuid NOT NULL,
	"geofence_id" uuid NOT NULL,
	"event_type" varchar(10) NOT NULL,
	"recorded_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "geofences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" varchar(20) NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"radius_meters" real NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"alert_on_enter" boolean DEFAULT true NOT NULL,
	"alert_on_exit" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "locations" (
	"id" bigserial NOT NULL,
	"child_id" uuid NOT NULL,
	"device_id" uuid NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"altitude" double precision,
	"accuracy" real,
	"speed" real,
	"bearing" real,
	"provider" varchar(20),
	"battery_level" smallint,
	"recorded_at" timestamp with time zone NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "media_captures" (
	"id" bigserial NOT NULL,
	"child_id" uuid NOT NULL,
	"device_id" uuid NOT NULL,
	"capture_type" varchar(20) NOT NULL,
	"file_path" text,
	"storage_url" text,
	"thumbnail_url" text,
	"file_size_bytes" bigint,
	"mime_type" varchar(50),
	"risk_score" real,
	"risk_flags" varchar(50)[],
	"ocr_text" text,
	"recorded_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_logs" (
	"id" bigserial NOT NULL,
	"child_id" uuid NOT NULL,
	"device_id" uuid NOT NULL,
	"source_package" varchar(255) NOT NULL,
	"app_name" varchar(100),
	"title" text,
	"text_content" text,
	"category" varchar(50),
	"is_removed" boolean DEFAULT false,
	"extras_json" jsonb,
	"recorded_at" timestamp with time zone NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pairing_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"child_id" uuid,
	"code" varchar(6) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "screen_time_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_id" uuid NOT NULL,
	"day_of_week" smallint,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"max_duration_ms" bigint,
	"allowed_apps" jsonb,
	"action" varchar(20) DEFAULT 'block' NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "web_filter_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_id" uuid NOT NULL,
	"rule_type" varchar(20) NOT NULL,
	"pattern" varchar(255) NOT NULL,
	"category" varchar(50),
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "web_history" (
	"id" bigserial NOT NULL,
	"child_id" uuid NOT NULL,
	"device_id" uuid NOT NULL,
	"url" text NOT NULL,
	"domain" varchar(255) NOT NULL,
	"category" varchar(50),
	"blocked" boolean DEFAULT false NOT NULL,
	"block_reason" varchar(50),
	"recorded_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alerts_child_idx" ON "alerts" ("child_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alerts_unacked_idx" ON "alerts" ("child_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "app_usage_daily_unique" ON "app_usage_daily" ("child_id","package_name","date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "app_usage_child_time_idx" ON "app_usage_events" ("child_id","recorded_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "call_logs_child_time_idx" ON "call_logs" ("child_id","recorded_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_child_time_idx" ON "chat_messages" ("child_id","recorded_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "locations_pkey" ON "locations" ("child_id","recorded_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "locations_geom_idx" ON "locations" ("latitude","longitude");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "media_child_time_idx" ON "media_captures" ("child_id","recorded_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notif_child_time_idx" ON "notification_logs" ("child_id","recorded_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "web_child_time_idx" ON "web_history" ("child_id","recorded_at");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "alerts" ADD CONSTRAINT "alerts_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "app_usage_daily" ADD CONSTRAINT "app_usage_daily_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "app_usage_daily" ADD CONSTRAINT "app_usage_daily_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "app_usage_events" ADD CONSTRAINT "app_usage_events_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "app_usage_events" ADD CONSTRAINT "app_usage_events_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "call_logs" ADD CONSTRAINT "call_logs_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "call_logs" ADD CONSTRAINT "call_logs_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "children" ADD CONSTRAINT "children_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "device_commands" ADD CONSTRAINT "device_commands_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "device_health" ADD CONSTRAINT "device_health_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "device_health" ADD CONSTRAINT "device_health_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "devices" ADD CONSTRAINT "devices_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "geofence_events" ADD CONSTRAINT "geofence_events_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "geofence_events" ADD CONSTRAINT "geofence_events_geofence_id_geofences_id_fk" FOREIGN KEY ("geofence_id") REFERENCES "geofences"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "geofences" ADD CONSTRAINT "geofences_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "locations" ADD CONSTRAINT "locations_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "locations" ADD CONSTRAINT "locations_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "media_captures" ADD CONSTRAINT "media_captures_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "media_captures" ADD CONSTRAINT "media_captures_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pairing_codes" ADD CONSTRAINT "pairing_codes_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pairing_codes" ADD CONSTRAINT "pairing_codes_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "screen_time_rules" ADD CONSTRAINT "screen_time_rules_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "web_filter_rules" ADD CONSTRAINT "web_filter_rules_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "web_history" ADD CONSTRAINT "web_history_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "web_history" ADD CONSTRAINT "web_history_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
