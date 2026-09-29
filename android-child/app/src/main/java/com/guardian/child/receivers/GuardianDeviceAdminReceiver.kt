package com.guardian.child.receivers

import android.app.admin.DeviceAdminReceiver
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import com.guardian.child.GuardianApp
import com.guardian.child.data.remote.ApiClient
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class GuardianDeviceAdminReceiver : DeviceAdminReceiver() {

    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
    }

    override fun onDisabled(context: Context, intent: Intent) {
        super.onDisabled(context, intent)
        // Alert parent that device admin was deactivated
        val api = (context.applicationContext as GuardianApp).apiClient
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val childId = api?.getChildId() ?: return@launch
                // Send alert to parent via API
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    companion object {
        fun getComponentName(context: Context): ComponentName {
            return ComponentName(context, GuardianDeviceAdminReceiver::class.java)
        }

        fun isAdminActive(context: Context): Boolean {
            val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            return dpm.isAdminActive(getComponentName(context))
        }
    }
}
