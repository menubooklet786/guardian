package com.guardian.child.services

import android.net.VpnService
import android.os.ParcelFileDescriptor
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.nio.ByteBuffer

class GuardianVpnService : VpnService() {

    private var vpnInterface: ParcelFileDescriptor? = null

    override fun onCreate() {
        super.onCreate()
    }

    fun startVpn(dnsServers: String = "8.8.8.8,1.1.1.1") {
        val builder = Builder()
            .setSession("GuardianFilter")
            .addAddress("10.0.0.2", 32)
            .addRoute("0.0.0.0", 0)
            .addDnsServer("8.8.8.8")
            .addDnsServer("1.1.1.1")
            .setMtu(1500)

        vpnInterface = builder.establish()
    }

    fun stopVpn() {
        vpnInterface?.close()
        vpnInterface = null
        stopSelf()
    }

    override fun onDestroy() {
        super.onDestroy()
        vpnInterface?.close()
    }

    override fun onRevoke() {
        vpnInterface?.close()
        stopSelf()
    }
}
