package com.guardian.child.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(
    entities = [
        LocationEntity::class,
        AppUsageEntity::class,
        NotificationEntity::class,
        CallLogEntity::class,
        WebHistoryEntity::class,
        DeviceHealthEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun locationDao(): LocationDao
    abstract fun appUsageDao(): AppUsageDao
    abstract fun notificationDao(): NotificationDao
    abstract fun callLogDao(): CallLogDao
    abstract fun webHistoryDao(): WebHistoryDao
    abstract fun deviceHealthDao(): DeviceHealthDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "guardian.db"
                ).fallbackToDestructiveMigration().build()
                INSTANCE = instance
                instance
            }
        }
    }
}
