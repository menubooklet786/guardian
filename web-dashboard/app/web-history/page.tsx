'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Globe, Search, Shield } from 'lucide-react';

interface Child {
  id: string;
  name: string;
}

interface WebEntry {
  id: number;
  url: string;
  domain: string;
  category: string | null;
  blocked: boolean;
  blockReason: string | null;
  recordedAt: string;
}

export default function WebHistoryPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [entries, setEntries] = useState<WebEntry[]>([]);
  const [search, setSearch] = useState('');
  const [blockedOnly, setBlockedOnly] = useState(false);

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
    loadHistory();
  }, [selectedChild, blockedOnly]);

  const loadHistory = async () => {
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (blockedOnly) params.set('blocked', 'true');
      const data = await api.get<{ webHistory: WebEntry[] }>(`/children/${selectedChild}/web-history?${params}`);
      setEntries(data.webHistory || []);
    } catch {}
  };

  const filtered = entries.filter(e => {
    if (!search) return true;
    return e.url.toLowerCase().includes(search.toLowerCase()) || e.domain.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <h1 className="text-2xl font-bold text-white">Web History</h1>

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
            placeholder="Search URLs or domains..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={blockedOnly} onChange={(e) => setBlockedOnly(e.target.checked)} className="rounded bg-slate-800 border-slate-600" />
          Blocked only
        </label>
      </div>

      <div className="space-y-2">
        {!selectedChild ? (
          <div className="bg-slate-800 rounded-lg p-12 text-center border border-slate-700">
            <p className="text-slate-400">No children added yet</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-slate-800 rounded-lg p-12 text-center border border-slate-700">
            <Globe className="w-16 h-16 mx-auto mb-4 text-slate-500" />
            <p className="text-slate-400">No web history</p>
          </div>
        ) : (
          filtered.map((entry) => (
            <div key={entry.id} className={`bg-slate-800 rounded-lg p-4 border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${entry.blocked ? 'border-red-800' : 'border-slate-700'}`}>
              <div className="flex items-center gap-3 min-w-0">
                {entry.blocked ? (
                  <Shield className="w-5 h-5 text-red-400 flex-shrink-0" />
                ) : (
                  <Globe className="w-5 h-5 text-slate-400 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-white text-sm truncate">{entry.url}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs text-slate-400">{entry.domain}</span>
                    {entry.category && <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded">{entry.category}</span>}
                    {entry.blocked && <span className="text-xs px-2 py-0.5 bg-red-900/50 text-red-300 rounded">Blocked{entry.blockReason ? `: ${entry.blockReason}` : ''}</span>}
                  </div>
                </div>
              </div>
              <span className="text-xs text-slate-500 whitespace-nowrap">
                {new Date(entry.recordedAt).toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
