package com.guardian.child.ui.setup

import android.Manifest
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.VpnService
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.guardian.child.GuardianApp
import com.guardian.child.data.remote.DeviceInfo
import com.guardian.child.data.remote.PairRequest
import com.guardian.child.receivers.GuardianDeviceAdminReceiver
import com.guardian.child.services.GuardianAccessibilityService
import com.guardian.child.services.GuardianNotificationListener
import com.guardian.child.services.MonitorForegroundService
import kotlinx.coroutines.launch

@Composable
fun SetupScreen(onPaired: () -> Unit) {
    val context = LocalContext.current
    val api = (context.applicationContext as GuardianApp).apiClient
    val scope = rememberCoroutineScope()
    var step by remember { mutableStateOf(0) }
    var pairingCode by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(false) }

    if (api == null) {
        Column(
            modifier = Modifier.fillMaxSize().padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text("API client not initialized", color = MaterialTheme.colorScheme.error, fontSize = 18.sp)
        }
        return
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { step = 2 }

    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp).verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(Modifier.height(48.dp))

        Text("Guardian Setup", fontSize = 24.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(8.dp))
        Text("Step ${step + 1} of 6", color = MaterialTheme.colorScheme.primary)
        Spacer(Modifier.height(32.dp))

        when (step) {
            0 -> PairingStep(pairingCode, error, loading,
                onCodeChange = { pairingCode = it; error = null },
                onSubmit = {
                    loading = true
                    error = null
                    scope.launch {
                        try {
                            val response = api!!.api.pairDevice(
                                PairRequest(
                                    code = pairingCode,
                                    deviceInfo = DeviceInfo(
                                        model = Build.MODEL,
                                        manufacturer = Build.MANUFACTURER,
                                        androidVersion = Build.VERSION.RELEASE,
                                        sdkVersion = Build.VERSION.SDK_INT,
                                        appVersion = com.guardian.child.BuildConfig.VERSION_NAME
                                    )
                                )
                            )
                            api.saveDeviceToken(response.deviceToken)
                            response.accessToken?.let { api.saveAccessToken(it) }
                            response.refreshToken?.let { api.saveRefreshToken(it) }
                            api.saveChildId(response.childId)
                            api.saveDeviceId(response.deviceId)
                            step = 1
                        } catch (e: Exception) {
                            error = "Pairing failed: ${e.message}"
                        } finally {
                            loading = false
                        }
                    }
                }
            )
            1 -> PermissionStep(
                onRequest = {
                    val permissions = mutableListOf(
                        Manifest.permission.ACCESS_FINE_LOCATION,
                        Manifest.permission.READ_PHONE_STATE,
                        Manifest.permission.READ_CALL_LOG,
                        Manifest.permission.READ_CONTACTS,
                        Manifest.permission.POST_NOTIFICATIONS
                    )

                    // Add version-specific media permissions
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        permissions.add(Manifest.permission.READ_MEDIA_IMAGES)
                        permissions.add(Manifest.permission.READ_MEDIA_VIDEO)
                    } else {
                        permissions.add(Manifest.permission.READ_EXTERNAL_STORAGE)
                    }

                    permissionLauncher.launch(permissions.toTypedArray())
                },
                onNext = { step = 2 }
            )
            2 -> AccessibilityStep(onNext = { step = 3 })
            3 -> DeviceAdminStep(context = context, onNext = { step = 4 })
            4 -> NotificationListenerStep(context = context, onNext = { step = 5 })
            5 -> BatteryStep(context = context, onFinish = {
                val intent = Intent(context, MonitorForegroundService::class.java)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(intent)
                } else {
                    context.startService(intent)
                }
                onPaired()
            })
        }
    }
}

@Composable
fun PairingStep(code: String, error: String?, loading: Boolean, onCodeChange: (String) -> Unit, onSubmit: () -> Unit) {
    Text("Enter Pairing Code", fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
    Spacer(Modifier.height(8.dp))
    Text("Get the 6-digit code from the parent dashboard", fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
    Spacer(Modifier.height(24.dp))

    OutlinedTextField(
        value = code,
        onValueChange = { if (it.length <= 6) onCodeChange(it) },
        label = { Text("Pairing Code") },
        singleLine = true,
        isError = error != null,
        supportingText = error?.let { { Text(it) } }
    )
    Spacer(Modifier.height(24.dp))

    Button(onClick = onSubmit, enabled = code.length == 6 && !loading, modifier = Modifier.fillMaxWidth()) {
        Text(if (loading) "Pairing..." else "Pair Device")
    }
}

@Composable
fun PermissionStep(onRequest: () -> Unit, onNext: () -> Unit) {
    Text("Grant Permissions", fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
    Spacer(Modifier.height(8.dp))
    Text("Guardian needs permissions to monitor device activity, track location, and read notifications.", fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
    Spacer(Modifier.height(24.dp))

    val perms = listOf(
        "Location (always)", "Phone", "Call Log", "Contacts", "Photos & Videos", "Notifications"
    )
    perms.forEach { perm ->
        Card(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
            Text(perm, modifier = Modifier.padding(12.dp))
        }
    }

    Spacer(Modifier.height(24.dp))
    Button(onClick = onRequest, modifier = Modifier.fillMaxWidth()) {
        Text("Grant Permissions")
    }
    Spacer(Modifier.height(8.dp))
    TextButton(onClick = onNext, modifier = Modifier.fillMaxWidth()) {
        Text("Continue")
    }
}

@Composable
fun AccessibilityStep(onNext: () -> Unit) {
    val context = LocalContext.current
    var isEnabled by remember { mutableStateOf(GuardianAccessibilityService.isRunning()) }

    Text("Enable Accessibility Service", fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
    Spacer(Modifier.height(8.dp))
    Text("This allows Guardian to monitor app usage and provide screen time controls.", fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
    Spacer(Modifier.height(16.dp))

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = if (isEnabled) MaterialTheme.colorScheme.primaryContainer
                else MaterialTheme.colorScheme.errorContainer
        )
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Status", fontWeight = FontWeight.Medium)
                Text(
                    if (isEnabled) "Enabled" else "Disabled",
                    color = if (isEnabled) MaterialTheme.colorScheme.primary
                        else MaterialTheme.colorScheme.error
                )
            }
            if (!isEnabled) {
                Spacer(Modifier.height(8.dp))
                Text(
                    "Look for 'Guardian' under 'Installed services' or 'Downloaded services'",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }

    Spacer(Modifier.height(24.dp))

    Button(
        onClick = {
            context.startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
        },
        modifier = Modifier.fillMaxWidth()
    ) {
        Text("Open Accessibility Settings")
    }
    Spacer(Modifier.height(8.dp))
    OutlinedButton(
        onClick = { isEnabled = GuardianAccessibilityService.isRunning() },
        modifier = Modifier.fillMaxWidth()
    ) {
        Text("Check Status")
    }
    Spacer(Modifier.height(8.dp))
    TextButton(onClick = onNext, modifier = Modifier.fillMaxWidth()) {
        Text("I've enabled it")
    }
}

@Composable
fun DeviceAdminStep(context: Context, onNext: () -> Unit) {
    val isAdminActive = remember { GuardianDeviceAdminReceiver.isAdminActive(context) }

    Text("Activate Device Admin", fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
    Spacer(Modifier.height(8.dp))
    Text("This allows Guardian to lock the device remotely and prevent uninstallation.", fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
    Spacer(Modifier.height(24.dp))

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = if (isAdminActive) MaterialTheme.colorScheme.primaryContainer
                else MaterialTheme.colorScheme.errorContainer
        )
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Status", fontWeight = FontWeight.Medium)
            Text(
                if (isAdminActive) "Active" else "Inactive",
                color = if (isAdminActive) MaterialTheme.colorScheme.primary
                    else MaterialTheme.colorScheme.error
            )
        }
    }

    Spacer(Modifier.height(24.dp))

    Button(
        onClick = {
            val intent = Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN).apply {
                putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, GuardianDeviceAdminReceiver.getComponentName(context))
            }
            context.startActivity(intent)
        },
        modifier = Modifier.fillMaxWidth()
    ) {
        Text("Activate Device Admin")
    }
    Spacer(Modifier.height(8.dp))
    TextButton(onClick = onNext, modifier = Modifier.fillMaxWidth()) {
        Text("Continue")
    }
}

@Composable
fun BatteryStep(context: Context, onFinish: () -> Unit) {
    Text("Battery Optimization", fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
    Spacer(Modifier.height(8.dp))
    Text("Disable battery optimization to keep Guardian running in the background.", fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
    Spacer(Modifier.height(24.dp))

    Button(
        onClick = {
            val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                data = android.net.Uri.parse("package:${context.packageName}")
            }
            context.startActivity(intent)
        },
        modifier = Modifier.fillMaxWidth()
    ) {
        Text("Disable Battery Optimization")
    }
    Spacer(Modifier.height(8.dp))
    Button(
        onClick = onFinish,
        modifier = Modifier.fillMaxWidth(),
        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
    ) {
        Text("Finish Setup")
    }
}

@Composable
fun NotificationListenerStep(context: Context, onNext: () -> Unit) {
    val isEnabled = remember { isNotificationListenerEnabled(context) }

    Text("Enable Notification Listener", fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
    Spacer(Modifier.height(8.dp))
    Text("This allows Guardian to monitor notifications for app usage tracking.", fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
    Spacer(Modifier.height(24.dp))

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = if (isEnabled) MaterialTheme.colorScheme.primaryContainer
                else MaterialTheme.colorScheme.errorContainer
        )
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Status", fontWeight = FontWeight.Medium)
            Text(
                if (isEnabled) "Enabled" else "Disabled",
                color = if (isEnabled) MaterialTheme.colorScheme.primary
                    else MaterialTheme.colorScheme.error
            )
        }
    }

    Spacer(Modifier.height(24.dp))

    Button(
        onClick = {
            context.startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
        },
        modifier = Modifier.fillMaxWidth()
    ) {
        Text("Open Notification Settings")
    }

    Spacer(Modifier.height(8.dp))
    TextButton(onClick = onNext, modifier = Modifier.fillMaxWidth()) {
        Text("Continue")
    }
}

fun isNotificationListenerEnabled(context: Context): Boolean {
    val cn = ComponentName(context, GuardianNotificationListener::class.java)
    val flat = Settings.Secure.getString(context.contentResolver, "enabled_notification_listeners")
    return flat?.contains(cn.flattenToString()) == true
}
