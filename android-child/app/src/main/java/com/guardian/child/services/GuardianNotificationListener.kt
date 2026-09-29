package com.guardian.child.services

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import com.guardian.child.GuardianApp
import com.guardian.child.data.local.NotificationEntity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

class GuardianNotificationListener : NotificationListenerService() {

    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        sbn ?: return

        val packageName = sbn.packageName
        if (packageName == "com.guardian.child" || packageName == "com.android.systemui") return

        val notification = sbn.notification
        val extras = notification.extras

        val title = extras.getCharSequence("android.title")?.toString()
        val text = extras.getCharSequence("android.text")?.toString()
        val category = notification.category

        val pm = packageManager
        val appName = try {
            pm.getApplicationLabel(pm.getApplicationInfo(packageName, 0)).toString()
        } catch (e: Exception) {
            packageName
        }

        val db = (applicationContext as GuardianApp).database
        scope.launch {
            db.notificationDao().insert(
                NotificationEntity(
                    sourcePackage = packageName,
                    appName = appName,
                    title = title,
                    textContent = text,
                    category = category,
                    recordedAt = sbn.postTime
                )
            )
        }
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification?) {
        // Track notification removal if needed
    }

    override fun onDestroy() {
        super.onDestroy()
        scope.cancel()
    }
}
