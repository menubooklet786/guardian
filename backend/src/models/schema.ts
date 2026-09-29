import { pgTable, uuid, varchar, text, boolean, integer, bigint, bigserial, doublePrecision, real, smallint, jsonb, timestamp, date, time, uniqueIndex, index } from 'drizzle-orm/pg-core';

// ============================================================
// ACCOUNTS & DEVICES
// ============================================================

export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  subscription: varchar('subscription', { length: 50 }).default('free').notNull(),
  fcmToken: varchar('fcm_token', { length: 500 }),
});

export const children = pgTable('children', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  birthDate: date('birth_date'),
  deviceId: varchar('device_id', { length: 100 }).unique(),
  fcmToken: varchar('fcm_token', { length: 500 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  status: varchar('status', { length: 20 }).default('active').notNull(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
});

export const devices = pgTable('devices', {
  id: uuid('id').primaryKey().defaultRandom(),
  childId: uuid('child_id').notNull().references(() => children.id, { onDelete: 'cascade' }),
  deviceToken: varchar('device_token', { length: 500 }).unique().notNull(),
  model: varchar('model', { length: 100 }),
  manufacturer: varchar('manufacturer', { length: 100 }),
  androidVersion: varchar('android_version', { length: 20 }),
  sdkVersion: integer('sdk_version'),
  appVersion: varchar('app_version', { length: 20 }),
  oem: varchar('oem', { length: 50 }),
  batteryOptExempt: boolean('battery_opt_exempt').default(false),
  adminActive: boolean('admin_active').default(false),
  accessibilityActive: boolean('accessibility_active').default(false),
  notifListenerActive: boolean('notif_listener_active').default(false),
  vpnActive: boolean('vpn_active').default(false),
  lastHeartbeat: timestamp('last_heartbeat', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const pairingCodes = pgTable('pairing_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  childId: uuid('child_id').references(() => children.id, { onDelete: 'cascade' }),
  code: varchar('code', { length: 6 }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  used: boolean('used').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================
// LOCATION DATA
// ============================================================

export const locations = pgTable('locations', {
  id: bigserial('id', { mode: 'number' }),
  childId: uuid('child_id').notNull().references(() => children.id, { onDelete: 'cascade' }),
  deviceId: uuid('device_id').notNull().references(() => devices.id),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  altitude: doublePrecision('altitude'),
  accuracy: real('accuracy'),
  speed: real('speed'),
  bearing: real('bearing'),
  provider: varchar('provider', { length: 20 }),
  batteryLevel: smallint('battery_level'),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),
  syncedAt: timestamp('synced_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  locationsPkey: index('locations_pkey').on(table.childId, table.recordedAt),
  locationsGeomIdx: index('locations_geom_idx').on(table.latitude, table.longitude),
}));

// ============================================================
// GEOFENCES
// ============================================================

export const geofences = pgTable('geofences', {
  id: uuid('id').primaryKey().defaultRandom(),
  childId: uuid('child_id').notNull().references(() => children.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  radiusMeters: real('radius_meters').notNull(),
  active: boolean('active').default(true).notNull(),
  alertOnEnter: boolean('alert_on_enter').default(true).notNull(),
  alertOnExit: boolean('alert_on_exit').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const geofenceEvents = pgTable('geofence_events', {
  id: bigserial('id', { mode: 'number' }),
  childId: uuid('child_id').notNull().references(() => children.id, { onDelete: 'cascade' }),
  geofenceId: uuid('geofence_id').notNull().references(() => geofences.id),
  eventType: varchar('event_type', { length: 10 }).notNull(),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),
});

// ============================================================
// APP USAGE
// ============================================================

export const appUsageEvents = pgTable('app_usage_events', {
  id: bigserial('id', { mode: 'number' }),
  childId: uuid('child_id').notNull().references(() => children.id, { onDelete: 'cascade' }),
  deviceId: uuid('device_id').notNull().references(() => devices.id),
  packageName: varchar('package_name', { length: 255 }).notNull(),
  appName: varchar('app_name', { length: 100 }),
  eventType: varchar('event_type', { length: 20 }).notNull(),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),
}, (table) => ({
  appUsageChildTimeIdx: index('app_usage_child_time_idx').on(table.childId, table.recordedAt),
}));

export const appUsageDaily = pgTable('app_usage_daily', {
  id: bigserial('id', { mode: 'number' }),
  childId: uuid('child_id').notNull().references(() => children.id, { onDelete: 'cascade' }),
  deviceId: uuid('device_id').notNull().references(() => devices.id),
  packageName: varchar('package_name', { length: 255 }).notNull(),
  appName: varchar('app_name', { length: 100 }),
  date: date('date').notNull(),
  totalForegroundMs: bigint('total_foreground_ms', { mode: 'number' }).notNull(),
  launchCount: integer('launch_count').default(0).notNull(),
  firstUsed: timestamp('first_used', { withTimezone: true }),
  lastUsed: timestamp('last_used', { withTimezone: true }),
}, (table) => ({
  appUsageDailyUnique: uniqueIndex('app_usage_daily_unique').on(table.childId, table.packageName, table.date),
}));

// ============================================================
// NOTIFICATIONS / MESSAGES
// ============================================================

export const notificationLogs = pgTable('notification_logs', {
  id: bigserial('id', { mode: 'number' }),
  childId: uuid('child_id').notNull().references(() => children.id, { onDelete: 'cascade' }),
  deviceId: uuid('device_id').notNull().references(() => devices.id),
  sourcePackage: varchar('source_package', { length: 255 }).notNull(),
  appName: varchar('app_name', { length: 100 }),
  title: text('title'),
  textContent: text('text_content'),
  category: varchar('category', { length: 50 }),
  isRemoved: boolean('is_removed').default(false),
  extrasJson: jsonb('extras_json'),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),
  syncedAt: timestamp('synced_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  notifChildTimeIdx: index('notif_child_time_idx').on(table.childId, table.recordedAt),
}));

export const chatMessages = pgTable('chat_messages', {
  id: bigserial('id', { mode: 'number' }),
  childId: uuid('child_id').notNull().references(() => children.id, { onDelete: 'cascade' }),
  notificationId: bigint('notification_id', { mode: 'number' }),
  platform: varchar('platform', { length: 50 }).notNull(),
  conversationId: varchar('conversation_id', { length: 255 }),
  senderName: varchar('sender_name', { length: 100 }),
  senderNumber: varchar('sender_number', { length: 20 }),
  messageText: text('message_text'),
  mediaType: varchar('media_type', { length: 20 }),
  mediaUrl: text('media_url'),
  direction: varchar('direction', { length: 10 }),
  riskScore: real('risk_score'),
  riskFlags: varchar('risk_flags', { length: 50 }).array(),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),
}, (table) => ({
  chatChildTimeIdx: index('chat_child_time_idx').on(table.childId, table.recordedAt),
}));

// ============================================================
// CALL LOGS
// ============================================================

export const callLogs = pgTable('call_logs', {
  id: bigserial('id', { mode: 'number' }),
  childId: uuid('child_id').notNull().references(() => children.id, { onDelete: 'cascade' }),
  deviceId: uuid('device_id').notNull().references(() => devices.id),
  phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
  contactName: varchar('contact_name', { length: 100 }),
  callType: varchar('call_type', { length: 10 }).notNull(),
  durationSecs: integer('duration_secs'),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),
  syncedAt: timestamp('synced_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  callLogsChildTimeIdx: index('call_logs_child_time_idx').on(table.childId, table.recordedAt),
}));

// ============================================================
// WEB HISTORY
// ============================================================

export const webHistory = pgTable('web_history', {
  id: bigserial('id', { mode: 'number' }),
  childId: uuid('child_id').notNull().references(() => children.id, { onDelete: 'cascade' }),
  deviceId: uuid('device_id').notNull().references(() => devices.id),
  url: text('url').notNull(),
  domain: varchar('domain', { length: 255 }).notNull(),
  category: varchar('category', { length: 50 }),
  blocked: boolean('blocked').default(false).notNull(),
  blockReason: varchar('block_reason', { length: 50 }),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),
}, (table) => ({
  webChildTimeIdx: index('web_child_time_idx').on(table.childId, table.recordedAt),
}));

// ============================================================
// MEDIA CAPTURES
// ============================================================

export const mediaCaptures = pgTable('media_captures', {
  id: bigserial('id', { mode: 'number' }),
  childId: uuid('child_id').notNull().references(() => children.id, { onDelete: 'cascade' }),
  deviceId: uuid('device_id').notNull().references(() => devices.id),
  captureType: varchar('capture_type', { length: 20 }).notNull(),
  filePath: text('file_path'),
  storageUrl: text('storage_url'),
  thumbnailUrl: text('thumbnail_url'),
  fileSizeBytes: bigint('file_size_bytes', { mode: 'number' }),
  mimeType: varchar('mime_type', { length: 50 }),
  riskScore: real('risk_score'),
  riskFlags: varchar('risk_flags', { length: 50 }).array(),
  ocrText: text('ocr_text'),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),
}, (table) => ({
  mediaChildTimeIdx: index('media_child_time_idx').on(table.childId, table.recordedAt),
}));

// ============================================================
// ALERTS
// ============================================================

export const alerts = pgTable('alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  childId: uuid('child_id').notNull().references(() => children.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(),
  severity: varchar('severity', { length: 20 }).default('info').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body'),
  metadataJson: jsonb('metadata_json'),
  acknowledged: boolean('acknowledged').default(false).notNull(),
  acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  alertsChildIdx: index('alerts_child_idx').on(table.childId, table.createdAt),
  alertsUnackedIdx: index('alerts_unacked_idx').on(table.childId, table.createdAt),
}));

// ============================================================
// DEVICE HEALTH
// ============================================================

export const deviceHealth = pgTable('device_health', {
  id: bigserial('id', { mode: 'number' }),
  childId: uuid('child_id').notNull().references(() => children.id, { onDelete: 'cascade' }),
  deviceId: uuid('device_id').notNull().references(() => devices.id),
  batteryLevel: smallint('battery_level'),
  batteryCharging: boolean('battery_charging'),
  networkType: varchar('network_type', { length: 20 }),
  wifiSsid: varchar('wifi_ssid', { length: 100 }),
  storageFreeMb: bigint('storage_free_mb', { mode: 'number' }),
  memoryFreeMb: bigint('memory_free_mb', { mode: 'number' }),
  screenOn: boolean('screen_on'),
  servicesActiveJson: jsonb('services_active_json'),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),
});

// ============================================================
// DEVICE COMMANDS
// ============================================================

export const deviceCommands = pgTable('device_commands', {
  id: uuid('id').primaryKey().defaultRandom(),
  childId: uuid('child_id').notNull().references(() => children.id, { onDelete: 'cascade' }),
  commandType: varchar('command_type', { length: 50 }).notNull(),
  payloadJson: jsonb('payload_json').notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  executedAt: timestamp('executed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================
// SCREEN TIME RULES
// ============================================================

export const screenTimeRules = pgTable('screen_time_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  childId: uuid('child_id').notNull().references(() => children.id, { onDelete: 'cascade' }),
  dayOfWeek: smallint('day_of_week'),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  maxDurationMs: bigint('max_duration_ms', { mode: 'number' }),
  allowedApps: jsonb('allowed_apps'),
  action: varchar('action', { length: 20 }).default('block').notNull(),
  active: boolean('active').default(true).notNull(),
});

// ============================================================
// WEB FILTER RULES
// ============================================================

export const webFilterRules = pgTable('web_filter_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  childId: uuid('child_id').notNull().references(() => children.id, { onDelete: 'cascade' }),
  ruleType: varchar('rule_type', { length: 20 }).notNull(),
  pattern: varchar('pattern', { length: 255 }).notNull(),
  category: varchar('category', { length: 50 }),
  active: boolean('active').default(true).notNull(),
});
