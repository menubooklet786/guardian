'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { AlertTriangle, Check, Filter } from 'lucide-react';

interface Child { id: string; name: string; }

interface Alert {
  id: string;
  type: string;
  severity: string;
  title: string;
  body: string | null;
  acknowledged: boolean;
  createdAt: string;
  acknowledgedAt: string | null;
}

export default function AlertsPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState('');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [severityFilter, setSeverityFilter] = useState('');
  const [showUnackOnly, setShowUnackOnly] = useState(false);

  useEffect(() => { loadChildren(); }, []);

  useEffect(() => {
    if (selectedChild) loadAlerts();
  }, [selectedChild, severityFilter, showUnackOnly]);

  const loadChildren = async () => {
    try {
      const data = await api.get<Child[]>('/children');
      setChildren(data);
      if (data.length > 0) setSelectedChild(data[0].id);
    } catch {}
  };

  const loadAlerts = async () => {
    try {
      const params = new URLSearchParams();
      if (severityFilter) params.set('severity', severityFilter);
      if (showUnackOnly) params.set('unacknowledged', 'true');
      params.set('limit', '100');
      const data = await api.get<{ alerts: Alert[] }>(`/children/${selectedChild}/alerts?${params}`);
      setAlerts(data.alerts);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    }
  };

  const acknowledge = async (alertId: string) => {
    try {
      await api.patch(`/alerts/${alertId}/acknowledge`);
      await loadAlerts();
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const severityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-900/30 border-red-800 text-red-300';
      case 'warning': return 'bg-yellow-900/30 border-yellow-800 text-yellow-300';
      default: return 'bg-slate-700/50 border-slate-600 text-slate-300';
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Alerts</h1>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select value={selectedChild} onChange={(e) => setSelectedChild(e.target.value)} className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-1.5">
          {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-1.5"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={showUnackOnly}
            onChange={(e) => setShowUnackOnly(e.target.checked)}
            className="rounded bg-slate-800 border-slate-600"
          />
          Unacknowledged only
        </label>
      </div>

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="bg-slate-800 rounded-lg p-12 text-center border border-slate-700">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-slate-500" />
            <p className="text-slate-400">No alerts</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-lg p-4 border ${severityColor(alert.severity)} ${
                alert.acknowledged ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      alert.severity === 'critical' ? 'bg-red-800 text-red-200'
                      : alert.severity === 'warning' ? 'bg-yellow-800 text-yellow-200'
                      : 'bg-slate-600 text-slate-200'
                    }`}>
                      {alert.severity}
                    </span>
                    <span className="text-xs text-slate-400">{alert.type}</span>
                  </div>
                  <h3 className="text-white font-medium mt-2">{alert.title}</h3>
                  {alert.body && <p className="text-sm text-slate-400 mt-1">{alert.body}</p>}
                  <p className="text-xs text-slate-500 mt-2">
                    {new Date(alert.createdAt).toLocaleString()}
                  </p>
                </div>
                {!alert.acknowledged && (
                  <button
                    onClick={() => acknowledge(alert.id)}
                    className="flex items-center gap-1 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Acknowledge
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
