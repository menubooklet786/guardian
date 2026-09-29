package com.guardian.parent

import android.graphics.Bitmap
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import com.guardian.parent.ui.GuardianParentTheme

class MainActivity : ComponentActivity() {

    private var webView: WebView? = null

    @OptIn(ExperimentalMaterial3Api::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            GuardianParentTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    var progress by remember { mutableIntStateOf(0) }
                    var showProgress by remember { mutableStateOf(true) }

                    Column(modifier = Modifier.fillMaxSize()) {
                        Scaffold(
                            topBar = {
                                TopAppBar(
                                    title = { Text("Guardian") },
                                    colors = TopAppBarDefaults.topAppBarColors(
                                        containerColor = MaterialTheme.colorScheme.primary,
                                        titleContentColor = Color.White
                                    )
                                )
                            }
                        ) { paddingValues ->
                            Column(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .padding(paddingValues)
                            ) {
                                if (showProgress && progress < 100) {
                                    LinearProgressIndicator(
                                        progress = { progress / 100f },
                                        modifier = Modifier.fillMaxWidth()
                                    )
                                }
                                GuardianWebView(
                                    onProgressChanged = { newProgress ->
                                        progress = newProgress
                                        showProgress = newProgress < 100
                                    },
                                    onWebViewCreated = { webView = it }
                                )
                            }
                        }
                    }

                    BackHandler(enabled = webView?.canGoBack() == true) {
                        webView?.goBack()
                    }
                }
            }
        }
    }

    override fun onDestroy() {
        webView?.destroy()
        webView = null
        super.onDestroy()
    }
}

@Composable
fun GuardianWebView(
    onProgressChanged: (Int) -> Unit,
    onWebViewCreated: (WebView) -> Unit
) {
    val dashboardUrl = BuildConfig.DASHBOARD_URL
    var errorMessage by remember { mutableStateOf<String?>(null) }

    Column(modifier = Modifier.fillMaxSize()) {
        if (errorMessage != null) {
            Column(
                modifier = Modifier.fillMaxSize().padding(32.dp),
                horizontalAlignment = androidx.compose.ui.Alignment.CenterHorizontally,
                verticalArrangement = androidx.compose.foundation.layout.Arrangement.Center
            ) {
                Text("Failed to load dashboard", color = MaterialTheme.colorScheme.error)
                Text(errorMessage ?: "", color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        } else {
            AndroidView(
                factory = { context ->
                    WebView(context).apply {
                        settings.javaScriptEnabled = true
                        settings.domStorageEnabled = true
                        settings.databaseEnabled = true
                        settings.setSupportMultipleWindows(false)
                        settings.loadWithOverviewMode = true
                        settings.useWideViewPort = true
                        settings.setSupportZoom(false)
                        settings.builtInZoomControls = false
                        settings.displayZoomControls = false
                        settings.cacheMode = android.webkit.WebSettings.LOAD_DEFAULT
                        settings.mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_NEVER_ALLOW
                        settings.userAgentString = settings.userAgentString + " GuardianParentApp/1.0"
                        settings.builtInZoomControls = false
                        settings.displayZoomControls = false

                        webViewClient = object : WebViewClient() {
                            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                                super.onPageStarted(view, url, favicon)
                                errorMessage = null
                            }
                            override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                                if (request?.isForMainFrame == true) {
                                    errorMessage = "${error?.description ?: "Unknown error"}"
                                }
                            }
                        }
                        webChromeClient = object : WebChromeClient() {
                            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                                onProgressChanged(newProgress)
                            }
                        }

                        loadUrl(dashboardUrl)
                        onWebViewCreated(this)
                    }
                },
                modifier = Modifier.fillMaxSize()
            )
        }
    }
}
