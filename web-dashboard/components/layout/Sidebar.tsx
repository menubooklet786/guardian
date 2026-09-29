'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, MapPin, AlertTriangle, Bell,
  Settings, LogOut, Shield, Smartphone, Globe, Download, Menu, X
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/children', label: 'Children', icon: Users },
  { href: '/geofences', label: 'Geofences', icon: MapPin },
  { href: '/alerts', label: 'Alerts', icon: AlertTriangle },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/calls', label: 'Call Logs', icon: Smartphone },
  { href: '/web-history', label: 'Web History', icon: Globe },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/download', label: 'Download Apps', icon: Download },
];

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const closeDrawer = () => setDrawerOpen(false);

  const navContent = (
    <>
      <div className="p-4 sm:p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-white">Guardian</h1>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 sm:p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <a
              key={item.href}
              href={item.href}
              onClick={closeDrawer}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </a>
          );
        })}
      </nav>

      <div className="p-3 sm:p-4 border-t border-slate-700">
        <button
          onClick={() => { handleLogout(); closeDrawer(); }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white w-full transition-colors"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-900">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:bg-slate-800 lg:border-r lg:border-slate-700">
        {navContent}
      </aside>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={closeDrawer} />
          <aside className="fixed inset-y-0 left-0 w-72 bg-slate-800 flex flex-col z-50 shadow-xl">
            {navContent}
          </aside>
        </div>
      )}

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-slate-800 border-b border-slate-700">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-white truncate">Guardian</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
