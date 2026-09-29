package com.guardian.child.ui.main

import android.Manifest
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.VpnService
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.guardian.child.data.remote.PairRequest
import com.guardian.child.receivers.GuardianDeviceAdminReceiver
import com.guardian.child.services.GuardianAccessibilityService
import com.guardian.child.services.GuardianNotificationListener
import com.guardian.child.services.MonitorForegroundService
import com.guardian.child.ui.setup.SetupScreen
import com.guardian.child.ui.theme.GuardianTheme
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            GuardianTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    GuardianRootScreen()
                }
            }
        }
    }
}

@Composable
fun GuardianRootScreen() {
    val context = LocalContext.current
    val app = context.applicationContext as com.guardian.child.GuardianApp
    val api = app.apiClient

    android.util.Log.d("GuardianDebug", "GuardianApp composable called, apiClient is null: ${api == null}")

    val scope = rememberCoroutineScope()
    var isPaired by remember { mutableStateOf(false) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var retryCount by remember { mutableStateOf(0) }

    if (api == null) {
        android.util.Log.d("GuardianDebug", "API client is null, showing error")
        Column(
            modifier = Modifier.fillMaxSize().padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text("API client not initialized", color = MaterialTheme.colorScheme.error, fontSize = 18.sp)
            Spacer(Modifier.height(16.dp))
            Button(onClick = { retryCount++ }) {
                Text("Retry")
            }
        }
        return
    }

    LaunchedEffect(retryCount) {
        loading = true
        error = null
        try {
            isPaired = api.isPaired()
        } catch (e: Exception) {
            error = "Failed to initialize: ${e.message}"
        } finally {
            loading = false
        }
    }

    if (loading) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator()
        }
    } else if (error != null) {
        Column(
            modifier = Modifier.fillMaxSize().padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text("Error", color = MaterialTheme.colorScheme.error, fontSize = 18.sp)
            Spacer(Modifier.height(8.dp))
            Text(error ?: "Unknown error")
            Spacer(Modifier.height(16.dp))
            Button(onClick = { retryCount++ }) {
                Text("Retry")
            }
        }
    } else if (isPaired) {
        StatusScreen(onStop = {
            context.stopService(Intent(context, MonitorForegroundService::class.java))
            scope.launch {
                api.clearSession()
                isPaired = false
            }
        })
    } else {
        SetupScreen(onPaired = { isPaired = true })
    }
}

@Composable
fun StatusScreen(onStop: () -> Unit) {
    val context = LocalContext.current
    var accessibilityActive by remember { mutableStateOf(GuardianAccessibilityService.isRunning()) }
    var notifListenerActive by remember { mutableStateOf(isNotificationListenerEnabled(context)) }
    var adminActive by remember { mutableStateOf(GuardianDeviceAdminReceiver.isAdminActive(context)) }

    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(Modifier.height(48.dp))

        Text(
            "Study Timer",
            fontSize = 28.sp,
            fontWeight = FontWeight.Bold
        )

        Spacer(Modifier.height(8.dp))

        Text(
            "All systems active",
            color = MaterialTheme.colorScheme.primary
        )

        Spacer(Modifier.height(48.dp))

        ServiceStatusCard("Accessibility Service", accessibilityActive)
        Spacer(Modifier.height(8.dp))
        ServiceStatusCard("Notification Listener", notifListenerActive)
        Spacer(Modifier.height(8.dp))
        ServiceStatusCard("Device Admin", adminActive)

        Spacer(Modifier.height(48.dp))

        Button(
            onClick = onStop,
            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
        ) {
            Text("Unpair Device")
        }
    }
}

@Composable
fun ServiceStatusCard(name: String, active: Boolean) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = if (active) MaterialTheme.colorScheme.primaryContainer
                else MaterialTheme.colorScheme.errorContainer
        )
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(name, fontWeight = FontWeight.Medium)
            Text(
                if (active) "Active" else "Inactive",
                color = if (active) MaterialTheme.colorScheme.primary
                    else MaterialTheme.colorScheme.error
            )
        }
    }
}

fun isNotificationListenerEnabled(context: Context): Boolean {
    val cn = ComponentName(context, GuardianNotificationListener::class.java)
    val flat = Settings.Secure.getString(context.contentResolver, "enabled_notification_listeners")
    return flat?.contains(cn.flattenToString()) == true
}
