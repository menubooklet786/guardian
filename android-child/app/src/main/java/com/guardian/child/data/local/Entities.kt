package com.guardian.child.data.local

import androidx.room.*

@Entity(tableName = "locations")
data class LocationEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val latitude: Double,
    val longitude: Double,
    val altitude: Double? = null,
    val accuracy: Float? = null,
    val speed: Float? = null,
    val bearing: Float? = null,
    val provider: String? = null,
    val batteryLevel: Int? = null,
    val recordedAt: Long,
    val synced: Boolean = false
)

@Entity(tableName = "app_usage_events")
data class AppUsageEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val packageName: String,
    val appName: String? = null,
    val eventType: String,
    val recordedAt: Long,
    val synced: Boolean = false
)

@Entity(tableName = "notification_logs")
data class NotificationEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val sourcePackage: String,
    val appName: String? = null,
    val title: String? = null,
    val textContent: String? = null,
    val category: String? = null,
    val recordedAt: Long,
    val synced: Boolean = false
)

@Entity(tableName = "call_logs")
data class CallLogEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val phoneNumber: String,
    val contactName: String? = null,
    val callType: String,
    val durationSecs: Int? = null,
    val recordedAt: Long,
    val synced: Boolean = false
)

@Entity(tableName = "web_history")
data class WebHistoryEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val url: String,
    val domain: String,
    val category: String? = null,
    val blocked: Boolean = false,
    val blockReason: String? = null,
    val recordedAt: Long,
    val synced: Boolean = false
)

@Entity(tableName = "device_health")
data class DeviceHealthEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val batteryLevel: Int? = null,
    val batteryCharging: Boolean? = null,
    val networkType: String? = null,
    val wifiSsid: String? = null,
    val storageFreeMb: Long? = null,
    val memoryFreeMb: Long? = null,
    val screenOn: Boolean? = null,
    val recordedAt: Long,
    val synced: Boolean = false
)
