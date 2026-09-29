package com.guardian.child.data.local

import androidx.room.*

@Dao
interface LocationDao {
    @Insert
    suspend fun insert(location: LocationEntity): Long

    @Query("SELECT * FROM locations WHERE synced = 0 ORDER BY recordedAt ASC LIMIT :limit")
    suspend fun getUnsynced(limit: Int = 100): List<LocationEntity>

    @Update
    suspend fun markSynced(locations: List<LocationEntity>)

    @Query("UPDATE locations SET synced = 1 WHERE id IN (:ids)")
    suspend fun markSyncedByIds(ids: List<Long>)

    @Query("DELETE FROM locations WHERE synced = 1 AND recordedAt < :before")
    suspend fun deleteSyncedOlderThan(before: Long)
}

@Dao
interface AppUsageDao {
    @Insert
    suspend fun insert(event: AppUsageEntity): Long

    @Query("SELECT * FROM app_usage_events WHERE synced = 0 ORDER BY recordedAt ASC LIMIT :limit")
    suspend fun getUnsynced(limit: Int = 200): List<AppUsageEntity>

    @Query("UPDATE app_usage_events SET synced = 1 WHERE id IN (:ids)")
    suspend fun markSyncedByIds(ids: List<Long>)
}

@Dao
interface NotificationDao {
    @Insert
    suspend fun insert(notification: NotificationEntity): Long

    @Query("SELECT * FROM notification_logs WHERE synced = 0 ORDER BY recordedAt ASC LIMIT :limit")
    suspend fun getUnsynced(limit: Int = 200): List<NotificationEntity>

    @Query("UPDATE notification_logs SET synced = 1 WHERE id IN (:ids)")
    suspend fun markSyncedByIds(ids: List<Long>)
}

@Dao
interface CallLogDao {
    @Insert
    suspend fun insert(call: CallLogEntity): Long

    @Query("SELECT * FROM call_logs WHERE synced = 0 ORDER BY recordedAt ASC LIMIT :limit")
    suspend fun getUnsynced(limit: Int = 100): List<CallLogEntity>

    @Query("UPDATE call_logs SET synced = 1 WHERE id IN (:ids)")
    suspend fun markSyncedByIds(ids: List<Long>)
}

@Dao
interface WebHistoryDao {
    @Insert
    suspend fun insert(entry: WebHistoryEntity): Long

    @Query("SELECT * FROM web_history WHERE synced = 0 ORDER BY recordedAt ASC LIMIT :limit")
    suspend fun getUnsynced(limit: Int = 200): List<WebHistoryEntity>

    @Query("UPDATE web_history SET synced = 1 WHERE id IN (:ids)")
    suspend fun markSyncedByIds(ids: List<Long>)
}

@Dao
interface DeviceHealthDao {
    @Insert
    suspend fun insert(health: DeviceHealthEntity): Long

    @Query("SELECT * FROM device_health WHERE synced = 0 ORDER BY recordedAt ASC LIMIT 1")
    suspend fun getUnsynced(): DeviceHealthEntity?

    @Query("UPDATE device_health SET synced = 1 WHERE id = :id")
    suspend fun markSynced(id: Long)
}
