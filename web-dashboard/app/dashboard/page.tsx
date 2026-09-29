'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { MapPin, Users, AlertTriangle, Battery, Smartphone, Clock } from 'lucide-react';
import dynamic from 'next/dynamic';

const LiveMap = dynamic(() => import('@/components/maps/LiveMap'), { ssr: false });

interface Child {
  id: string;
  name: string;
  status: string;
  lastSeenAt: string | null;
  deviceId: string | null;
}

interface Alert {
  id: string;
  type: string;
  severity: string;
  title: string;
  body: string | null;
  createdAt: string;
  acknowledged: boolean;
}

interface Location {
  latitude: number;
  longitude: number;
  recordedAt: string;
}

export default function DashboardPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (!selectedChild) return;
    const loadChildData = async () => {
      try {
        const [locData, alertsData] = await Promise.all([
          api.get<{ location: Location | null }>(`/children/${selectedChild}/location/current`),
          api.get<{ alerts: Alert[] }>(`/children/${selectedChild}/alerts?limit=10&unacknowledged=true`),
        ]);
        if (locData.location) setCurrentLocation(locData.location);
        setAlerts(alertsData.alerts);
      } catch {}
    };
    loadChildData();
  }, [selectedChild]);

  const loadDashboard = async () => {
    try {
      const childrenData = await api.get<Child[]>('/children');
      setChildren(childrenData);

      if (childrenData.length > 0) {
        const firstChild = childrenData[0];
        setSelectedChild(firstChild.id);
        const [locData, alertsData] = await Promise.all([
          api.get<{ location: Location | null }>(`/children/${firstChild.id}/location/current`),
          api.get<{ alerts: Alert[] }>(`/children/${firstChild.id}/alerts?limit=10&unacknowledged=true`),
        ]);
        if (locData.location) setCurrentLocation(locData.location);
        setAlerts(alertsData.alerts);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    }
  };

  const stats = [
    { label: 'Children', value: children.length, icon: Users, color: 'text-blue-400' },
    { label: 'Active Alerts', value: alerts.filter(a => !a.acknowledged).length, icon: AlertTriangle, color: 'text-red-400' },
    { label: 'Online Devices', value: children.filter(c => c.status === 'active').length, icon: Smartphone, color: 'text-green-400' },
    { label: 'Geofences', value: '—', icon: MapPin, color: 'text-purple-400' },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Clock className="w-4 h-4" />
          <span className="hidden sm:inline">Last updated:</span> {new Date().toLocaleTimeString()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                </div>
                <Icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Live Location</h2>
            {selectedChild && (
              <select
                value={selectedChild}
                onChange={(e) => setSelectedChild(e.target.value)}
                className="bg-slate-900 border border-slate-600 text-white text-sm rounded px-2 py-1"
              >
                {children.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>
          <div className="h-96">
            {selectedChild ? (
              <LiveMap childId={selectedChild} />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                No children added yet
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg border border-slate-700">
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white">Recent Alerts</h2>
          </div>
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {alerts.length === 0 ? (
              <p className="text-slate-400 text-sm">No active alerts</p>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${
                    alert.severity === 'critical'
                      ? 'bg-red-900/20 border-red-800'
                      : alert.severity === 'warning'
                      ? 'bg-yellow-900/20 border-yellow-800'
                      : 'bg-slate-700/50 border-slate-600'
                  }`}
                >
                  <p className="text-sm font-medium text-white">{alert.title}</p>
                  {alert.body && <p className="text-xs text-slate-400 mt-1">{alert.body}</p>}
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(alert.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Children</h2>
        </div>
        <div className="divide-y divide-slate-700">
          {children.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No children added yet</p>
              <a href="/children" className="text-primary-400 hover:text-primary-300 text-sm mt-2 inline-block">
                Add a child profile
              </a>
            </div>
          ) : (
            children.map((child) => (
              <div key={child.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-700/50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium flex-shrink-0">
                    {child.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-medium">{child.name}</p>
                    <p className="text-sm text-slate-400">
                      {child.lastSeenAt
                        ? `Last seen: ${new Date(child.lastSeenAt).toLocaleString()}`
                        : 'Never seen'}
                    </p>
                  </div>
                </div>
                <div className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-medium ${
                  child.status === 'active'
                    ? 'bg-green-900/50 text-green-300'
                    : 'bg-slate-700 text-slate-400'
                }`}>
                  {child.status}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
