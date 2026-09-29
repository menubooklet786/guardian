package com.guardian.child

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import com.guardian.child.data.local.AppDatabase
import com.guardian.child.data.remote.ApiClient

class GuardianApp : Application() {

    lateinit var database: AppDatabase
        private set

    var apiClient: ApiClient? = null
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this
        try {
            android.util.Log.d("GuardianDebug", "Initializing database...")
            database = AppDatabase.getInstance(this)
            android.util.Log.d("GuardianDebug", "Database initialized, creating ApiClient...")
            apiClient = ApiClient(this)
            android.util.Log.d("GuardianDebug", "ApiClient created, creating notification channel...")
            createNotificationChannel()
            android.util.Log.d("GuardianDebug", "Initialization complete")
        } catch (e: Exception) {
            android.util.Log.e("GuardianDebug", "Initialization failed", e)
            e.printStackTrace()
        }
    }

    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            CHANNEL_ID,
            getString(R.string.notification_channel_name),
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = getString(R.string.notification_channel_desc)
        }
        val manager = getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(channel)
    }

    companion object {
        const val CHANNEL_ID = "guardian_service"
        lateinit var instance: GuardianApp
            private set
    }
}
