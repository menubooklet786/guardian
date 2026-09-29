-- Guardian Database Initialization
-- TimescaleDB + PostGIS extensions

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Convert high-volume tables to hypertables
-- Note: These will be created by Drizzle schema push first,
-- then converted to hypertables here.

-- Locations hypertable (monthly partitions)
SELECT create_hypertable('locations', 'recorded_at',
    chunk_time_interval => INTERVAL '1 month',
    if_not_exists => TRUE);

-- App usage events hypertable
SELECT create_hypertable('app_usage_events', 'recorded_at',
    chunk_time_interval => INTERVAL '1 month',
    if_not_exists => TRUE);

-- Notification logs hypertable
SELECT create_hypertable('notification_logs', 'recorded_at',
    chunk_time_interval => INTERVAL '1 month',
    if_not_exists => TRUE);

-- Call logs hypertable
SELECT create_hypertable('call_logs', 'recorded_at',
    chunk_time_interval => INTERVAL '1 month',
    if_not_exists => TRUE);

-- Web history hypertable
SELECT create_hypertable('web_history', 'recorded_at',
    chunk_time_interval => INTERVAL '1 month',
    if_not_exists => TRUE);

-- Device health hypertable
SELECT create_hypertable('device_health', 'recorded_at',
    chunk_time_interval => INTERVAL '1 month',
    if_not_exists => TRUE);

-- Geofence events hypertable
SELECT create_hypertable('geofence_events', 'recorded_at',
    chunk_time_interval => INTERVAL '1 month',
    if_not_exists => TRUE);

-- Data retention policies (drop chunks older than N days)
SELECT add_retention_policy('locations', INTERVAL '90 days', if_not_exists => TRUE);
SELECT add_retention_policy('app_usage_events', INTERVAL '30 days', if_not_exists => TRUE);
SELECT add_retention_policy('notification_logs', INTERVAL '90 days', if_not_exists => TRUE);
SELECT add_retention_policy('call_logs', INTERVAL '365 days', if_not_exists => TRUE);
SELECT add_retention_policy('web_history', INTERVAL '90 days', if_not_exists => TRUE);
SELECT add_retention_policy('device_health', INTERVAL '30 days', if_not_exists => TRUE);
SELECT add_retention_policy('geofence_events', INTERVAL '90 days', if_not_exists => TRUE);
