'use client';

import { Smartphone, Monitor, Download, Shield, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const BACKEND_URL = API_URL.replace(/\/api\/v1\/?$/, '');

export default function DownloadPage() {
  const childAppUrl = `${BACKEND_URL}/download/child-app`;
  const parentAppUrl = `${BACKEND_URL}/download/parent-app`;

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Download Apps</h1>
        <p className="text-slate-400 mt-1">Install Guardian on your devices to get started</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-blue-600/20 flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Child App</h2>
              <p className="text-sm text-slate-400">Install on your child's Android device</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-2 text-sm text-slate-300">
              <span className="text-primary-400 mt-0.5">1.</span>
              <span>Download the APK file using the button below</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-slate-300">
              <span className="text-primary-400 mt-0.5">2.</span>
              <span>Transfer to the child's Android device (or download directly on it)</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-slate-300">
              <span className="text-primary-400 mt-0.5">3.</span>
              <span>Enable "Install from unknown sources" in device settings if prompted</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-slate-300">
              <span className="text-primary-400 mt-0.5">4.</span>
              <span>Open the APK and follow the setup wizard to pair with this account</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            <a
              href={childAppUrl}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg transition-colors font-medium text-sm"
            >
              <Download className="w-4 h-4" />
              Download Child App APK
            </a>
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-lg">
                <QRCodeSVG value={childAppUrl} size={80} level="M" />
              </div>
              <p className="text-xs text-slate-400">Scan with phone camera to download</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">Android 8.0+ required</p>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-purple-600/20 flex items-center justify-center">
              <Monitor className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Parent App</h2>
              <p className="text-sm text-slate-400">Install on your own Android device</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-2 text-sm text-slate-300">
              <span className="text-primary-400 mt-0.5">1.</span>
              <span>Download the APK file using the button below</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-slate-300">
              <span className="text-primary-400 mt-0.5">2.</span>
              <span>Install on your Android phone or tablet</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-slate-300">
              <span className="text-primary-400 mt-0.5">3.</span>
              <span>Sign in with your Guardian account credentials</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-slate-300">
              <span className="text-primary-400 mt-0.5">4.</span>
              <span>Monitor your children's devices from anywhere</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            <a
              href={parentAppUrl}
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg transition-colors font-medium text-sm"
            >
              <Download className="w-4 h-4" />
              Download Parent App APK
            </a>
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-lg">
                <QRCodeSVG value={parentAppUrl} size={80} level="M" />
              </div>
              <p className="text-xs text-slate-400">Scan with phone camera to download</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">Android 8.0+ required</p>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary-400" />
          Web Dashboard
        </h2>
        <p className="text-slate-400 text-sm mb-3">
          You can also manage all Guardian settings from any browser. No installation needed.
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-5 py-2.5 rounded-lg transition-colors font-medium text-sm"
        >
          <Monitor className="w-4 h-4" />
          Open Web Dashboard
        </a>
      </div>

      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
        <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
          <QrCode className="w-4 h-4" /> Quick Install Tip
        </h3>
        <p className="text-sm text-slate-400">
          Scan the QR codes above with your phone's camera to instantly get the download links.
          Alternatively, open this page on the target device's browser and tap the download button.
          You may need to allow installation from your browser in Settings &gt; Security &gt; Install unknown apps.
        </p>
      </div>
    </div>
  );
}
