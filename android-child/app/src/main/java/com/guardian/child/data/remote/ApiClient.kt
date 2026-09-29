package com.guardian.child.data.remote

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.google.gson.Gson
import com.google.gson.annotations.SerializedName
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.runBlocking
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.*
import java.util.concurrent.TimeUnit

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "guardian_prefs")

data class PairRequest(
    val code: String,
    val deviceInfo: DeviceInfo
)

data class DeviceInfo(
    val model: String?,
    val manufacturer: String?,
    val androidVersion: String?,
    val sdkVersion: Int?,
    val appVersion: String?
)

data class PairResponse(
    val deviceToken: String,
    val childId: String,
    val deviceId: String,
    val accessToken: String? = null,
    val refreshToken: String? = null
)

data class SyncBatch(
    val deviceId: String,
    val locations: List<LocationPayload>? = null,
    val appEvents: List<AppUsagePayload>? = null,
    val notifications: List<NotificationPayload>? = null,
    val calls: List<CallPayload>? = null,
    val webHistory: List<WebHistoryPayload>? = null,
    val health: HealthPayload? = null
)

data class LocationPayload(
    val latitude: Double,
    val longitude: Double,
    val altitude: Double? = null,
    val accuracy: Float? = null,
    val speed: Float? = null,
    val bearing: Float? = null,
    val provider: String? = null,
    val batteryLevel: Int? = null,
    val recordedAt: String
)

data class AppUsagePayload(
    val packageName: String,
    val appName: String? = null,
    val eventType: String,
    val recordedAt: String
)

data class NotificationPayload(
    val sourcePackage: String,
    val appName: String? = null,
    val title: String? = null,
    val textContent: String? = null,
    val category: String? = null,
    val recordedAt: String
)

data class CallPayload(
    val phoneNumber: String,
    val contactName: String? = null,
    val callType: String,
    val durationSecs: Int? = null,
    val recordedAt: String
)

data class WebHistoryPayload(
    val url: String,
    val domain: String,
    val category: String? = null,
    val blocked: Boolean = false,
    val blockReason: String? = null,
    val recordedAt: String
)

data class HealthPayload(
    val batteryLevel: Int? = null,
    val batteryCharging: Boolean? = null,
    val networkType: String? = null,
    val wifiSsid: String? = null,
    val storageFreeMb: Long? = null,
    val memoryFreeMb: Long? = null,
    val screenOn: Boolean? = null,
    val recordedAt: String
)

data class SyncResponse(
    val success: Boolean,
    val inserted: Map<String, Int>? = null
)

data class CommandPayload(
    val commandType: String,
    val payloadJson: Map<String, Any>? = null
)

interface GuardianApi {
    @POST("auth/device/pair")
    suspend fun pairDevice(@Body request: PairRequest): PairResponse

    @POST("sync/batch")
    suspend fun syncBatch(@Body batch: SyncBatch): SyncResponse

    @POST("sync/heartbeat")
    suspend fun heartbeat(@Body body: Map<String, String>)

    @GET("commands/pending")
    suspend fun getPendingCommands(): List<CommandPayload>
}

class ApiClient(context: Context) {
    private val dataStore = context.dataStore

    companion object {
        private const val BASE_URL = com.guardian.child.BuildConfig.API_BASE_URL
        val DEVICE_TOKEN_KEY = stringPreferencesKey("device_token")
        val ACCESS_TOKEN_KEY = stringPreferencesKey("access_token")
        val REFRESH_TOKEN_KEY = stringPreferencesKey("refresh_token")
        val CHILD_ID_KEY = stringPreferencesKey("child_id")
        val DEVICE_ID_KEY = stringPreferencesKey("device_id")
    }

    private val okHttp = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .addInterceptor { chain ->
            val token = runBlocking { getAccessToken() }
            val req = if (token != null) {
                chain.request().newBuilder()
                    .addHeader("Authorization", "Bearer $token")
                    .build()
            } else chain.request()
            chain.proceed(req)
        }
        .addInterceptor(HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        })
        .build()

    private val retrofit = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .client(okHttp)
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    val api: GuardianApi = retrofit.create(GuardianApi::class.java)

    suspend fun saveDeviceToken(token: String) {
        dataStore.edit { it[DEVICE_TOKEN_KEY] = token }
    }

    suspend fun getDeviceToken(): String? {
        return dataStore.data.map { it[DEVICE_TOKEN_KEY] }.first()
    }

    suspend fun saveAccessToken(token: String) {
        dataStore.edit { it[ACCESS_TOKEN_KEY] = token }
    }

    suspend fun getAccessToken(): String? {
        return dataStore.data.map { it[ACCESS_TOKEN_KEY] }.first()
    }

    suspend fun saveRefreshToken(token: String) {
        dataStore.edit { it[REFRESH_TOKEN_KEY] = token }
    }

    suspend fun saveChildId(childId: String) {
        dataStore.edit { it[CHILD_ID_KEY] = childId }
    }

    suspend fun getChildId(): String? {
        return dataStore.data.map { it[CHILD_ID_KEY] }.first()
    }

    suspend fun saveDeviceId(deviceId: String) {
        dataStore.edit { it[DEVICE_ID_KEY] = deviceId }
    }

    suspend fun getDeviceId(): String? {
        return dataStore.data.map { it[DEVICE_ID_KEY] }.first()
    }

    suspend fun isPaired(): Boolean {
        return getAccessToken() != null
    }

    suspend fun clearSession() {
        dataStore.edit { it.clear() }
    }
}
