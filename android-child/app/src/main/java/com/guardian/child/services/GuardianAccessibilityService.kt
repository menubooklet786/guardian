package com.guardian.child.services

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent
import com.guardian.child.GuardianApp
import com.guardian.child.data.local.AppUsageEntity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

class GuardianAccessibilityService : AccessibilityService() {

    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var lastPackage: String? = null
    private var lastTimestamp: Long = 0

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        event ?: return

        val packageName = event.packageName?.toString() ?: return
        if (packageName == "com.android.systemui" || packageName == "com.guardian.child") return

        when (event.eventType) {
            AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED -> {
                val now = System.currentTimeMillis()
                if (packageName != lastPackage || now - lastTimestamp > 5000) {
                    lastPackage = packageName
                    lastTimestamp = now
                    recordAppUsage(packageName, "foreground")
                }
            }
            AccessibilityEvent.TYPE_VIEW_TEXT_CHANGED -> {
                val text = event.text?.joinToString("") ?: return
                if (text.isNotEmpty()) {
                    recordKeylog(packageName, text)
                }
            }
        }
    }

    override fun onInterrupt() {}

    private fun recordAppUsage(packageName: String, eventType: String) {
        val db = (applicationContext as GuardianApp).database
        scope.launch {
            db.appUsageDao().insert(
                AppUsageEntity(
                    packageName = packageName,
                    eventType = eventType,
                    recordedAt = System.currentTimeMillis()
                )
            )
        }
    }

    private fun recordKeylog(packageName: String, text: String) {
        // Keylog data stored locally and synced
        // In a full implementation, this would write to a keylog table
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
        scope.cancel()
    }

    companion object {
        var instance: GuardianAccessibilityService? = null
            private set

        fun isRunning(): Boolean = instance != null
    }
}
