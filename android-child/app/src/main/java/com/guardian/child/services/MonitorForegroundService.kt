package com.guardian.child.services

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import com.guardian.child.GuardianApp
import com.guardian.child.R
import com.guardian.child.data.local.*
import com.guardian.child.data.remote.*
import com.guardian.child.receivers.BootReceiver
import com.guardian.child.ui.main.MainActivity
import kotlinx.coroutines.*
import java.text.SimpleDateFormat
import java.util.*

class MonitorForegroundService : Service() {

    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private lateinit var db: AppDatabase
    private var api: ApiClient? = null
    private var wakeLock: PowerManager.WakeLock? = null
    private var syncJob: Job? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        val app = applicationContext as GuardianApp
        db = app.database
        api = app.apiClient
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = buildNotification()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }

        acquireWakeLock()
        startPeriodicSync()

        return START_STICKY
    }

    private fun buildNotification(): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this, 0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, GuardianApp.CHANNEL_ID)
            .setContentTitle(getString(R.string.notification_title))
            .setContentText(getString(R.string.notification_text))
            .setSmallIcon(android.R.drawable.ic_menu_compass)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun acquireWakeLock() {
        val pm = getSystemService(POWER_SERVICE) as PowerManager
        wakeLock = pm.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "guardian::fgs"
        ).apply {
            setReferenceCounted(false)
            acquire(24 * 60 * 60 * 1000L)
        }
    }

    private fun startPeriodicSync() {
        syncJob?.cancel()
        syncJob = scope.launch {
            while (isActive) {
                try {
                    if (api?.isPaired() == true) {
                        syncData()
                        api?.api?.heartbeat(mapOf("deviceId" to (api?.getDeviceId() ?: "")))
                    }
                } catch (e: Exception) {
                    android.util.Log.e("GuardianFGS", "Sync failed", e)
                }
                delay(SYNC_INTERVAL_MS)
            }
        }
    }

    private suspend fun syncData() {
        val deviceId = api?.getDeviceId() ?: return
        val dateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
        dateFormat.timeZone = TimeZone.getTimeZone("UTC")

        val locations = db.locationDao().getUnsynced(100)
        val appEvents = db.appUsageDao().getUnsynced(200)
        val notifications = db.notificationDao().getUnsynced(200)
        val calls = db.callLogDao().getUnsynced(100)
        val webHistory = db.webHistoryDao().getUnsynced(200)
        val health = db.deviceHealthDao().getUnsynced()

        if (locations.isEmpty() && appEvents.isEmpty() && notifications.isEmpty()
            && calls.isEmpty() && webHistory.isEmpty() && health == null) {
            return
        }

        val batch = SyncBatch(
            deviceId = deviceId,
            locations = locations.map {
                LocationPayload(
                    latitude = it.latitude,
                    longitude = it.longitude,
                    altitude = it.altitude,
                    accuracy = it.accuracy,
                    speed = it.speed,
                    bearing = it.bearing,
                    provider = it.provider,
                    batteryLevel = it.batteryLevel,
                    recordedAt = dateFormat.format(Date(it.recordedAt))
                )
            }.ifEmpty { null },
            appEvents = appEvents.map {
                AppUsagePayload(
                    packageName = it.packageName,
                    appName = it.appName,
                    eventType = it.eventType,
                    recordedAt = dateFormat.format(Date(it.recordedAt))
                )
            }.ifEmpty { null },
            notifications = notifications.map {
                NotificationPayload(
                    sourcePackage = it.sourcePackage,
                    appName = it.appName,
                    title = it.title,
                    textContent = it.textContent,
                    category = it.category,
                    recordedAt = dateFormat.format(Date(it.recordedAt))
                )
            }.ifEmpty { null },
            calls = calls.map {
                CallPayload(
                    phoneNumber = it.phoneNumber,
                    contactName = it.contactName,
                    callType = it.callType,
                    durationSecs = it.durationSecs,
                    recordedAt = dateFormat.format(Date(it.recordedAt))
                )
            }.ifEmpty { null },
            webHistory = webHistory.map {
                WebHistoryPayload(
                    url = it.url,
                    domain = it.domain,
                    category = it.category,
                    blocked = it.blocked,
                    blockReason = it.blockReason,
                    recordedAt = dateFormat.format(Date(it.recordedAt))
                )
            }.ifEmpty { null },
            health = health?.let {
                HealthPayload(
                    batteryLevel = it.batteryLevel,
                    batteryCharging = it.batteryCharging,
                    networkType = it.networkType,
                    wifiSsid = it.wifiSsid,
                    storageFreeMb = it.storageFreeMb,
                    memoryFreeMb = it.memoryFreeMb,
                    screenOn = it.screenOn,
                    recordedAt = dateFormat.format(Date(it.recordedAt))
                )
            }
        )

        val response = api?.api?.syncBatch(batch) ?: return
        if (response.success) {
            if (locations.isNotEmpty()) db.locationDao().markSyncedByIds(locations.map { it.id })
            if (appEvents.isNotEmpty()) db.appUsageDao().markSyncedByIds(appEvents.map { it.id })
            if (notifications.isNotEmpty()) db.notificationDao().markSyncedByIds(notifications.map { it.id })
            if (calls.isNotEmpty()) db.callLogDao().markSyncedByIds(calls.map { it.id })
            if (webHistory.isNotEmpty()) db.webHistoryDao().markSyncedByIds(webHistory.map { it.id })
            if (health != null) db.deviceHealthDao().markSynced(health.id)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        syncJob?.cancel()
        scope.cancel()
        wakeLock?.release()
        BootReceiver.scheduleRestart(this)
    }

    companion object {
        const val NOTIFICATION_ID = 1001
        const val SYNC_INTERVAL_MS = 15 * 60 * 1000L
    }
}
