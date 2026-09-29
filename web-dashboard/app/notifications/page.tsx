'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Bell, Search } from 'lucide-react';

interface Child {
  id: string;
  name: string;
}

interface Notification {
  id: number;
  sourcePackage: string;
  appName: string | null;
  title: string | null;
  textContent: string | null;
  category: string | null;
  recordedAt: string;
}

export default function NotificationsPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sourceFilter, setSourceFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<Child[]>('/children');
        setChildren(data);
        if (data.length > 0 && !selectedChild) setSelectedChild(data[0].id);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (!selectedChild) return;
    loadNotifications();
  }, [selectedChild, sourceFilter]);

  const loadNotifications = async () => {
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (sourceFilter) params.set('source', sourceFilter);
      const data = await api.get<{ notifications: Notification[] }>(`/children/${selectedChild}/notifications?${params}`);
      setNotifications(data.notifications || []);
    } catch {}
  };

  const filtered = notifications.filter(n => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (n.title?.toLowerCase().includes(s)) || (n.textContent?.toLowerCase().includes(s)) || (n.appName?.toLowerCase().includes(s));
  });

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <h1 className="text-2xl font-bold text-white">Notifications</h1>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {children.length > 1 && (
          <select
            value={selectedChild || ''}
            onChange={(e) => setSelectedChild(e.target.value)}
            className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-1.5"
          >
            {children.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500"
          />
        </div>
        <input
          type="text"
          placeholder="Filter by app..."
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500 sm:w-auto"
        />
      </div>

      <div className="space-y-2">
        {!selectedChild ? (
          <div className="bg-slate-800 rounded-lg p-12 text-center border border-slate-700">
            <p className="text-slate-400">No children added yet</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-slate-800 rounded-lg p-12 text-center border border-slate-700">
            <Bell className="w-16 h-16 mx-auto mb-4 text-slate-500" />
            <p className="text-slate-400">No notifications</p>
          </div>
        ) : (
          filtered.map((n) => (
            <div key={n.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-primary-400">{n.appName || n.sourcePackage}</span>
                    {n.category && <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded">{n.category}</span>}
                  </div>
                  {n.title && <h3 className="text-white font-medium mt-1">{n.title}</h3>}
                  {n.textContent && <p className="text-sm text-slate-400 mt-1">{n.textContent}</p>}
                </div>
                <span className="text-xs text-slate-500 whitespace-nowrap">
                  {new Date(n.recordedAt).toLocaleString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
