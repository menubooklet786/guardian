'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed } from 'lucide-react';

interface Child {
  id: string;
  name: string;
}

interface CallLog {
  id: number;
  phoneNumber: string;
  contactName: string | null;
  callType: string;
  durationSecs: number | null;
  recordedAt: string;
}

export default function CallsPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [typeFilter, setTypeFilter] = useState('');

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
    loadCalls();
  }, [selectedChild, typeFilter]);

  const loadCalls = async () => {
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (typeFilter) params.set('type', typeFilter);
      const data = await api.get<{ calls: CallLog[] }>(`/children/${selectedChild}/call-logs?${params}`);
      setCalls(data.calls || []);
    } catch {}
  };

  const formatDuration = (secs: number | null) => {
    if (!secs) return '0:00';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const callIcon = (type: string) => {
    switch (type) {
      case 'incoming': return <PhoneIncoming className="w-5 h-5 text-green-400" />;
      case 'outgoing': return <PhoneOutgoing className="w-5 h-5 text-blue-400" />;
      case 'missed': return <PhoneMissed className="w-5 h-5 text-red-400" />;
      default: return <Phone className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <h1 className="text-2xl font-bold text-white">Call Logs</h1>

      <div className="flex flex-wrap items-center gap-3">
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
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-1.5">
          <option value="">All Calls</option>
          <option value="incoming">Incoming</option>
          <option value="outgoing">Outgoing</option>
          <option value="missed">Missed</option>
        </select>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-slate-900 border-b border-slate-700">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Type</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Contact</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Number</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Duration</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {!selectedChild ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                  <p>No children added yet</p>
                </td>
              </tr>
            ) : calls.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                  <Phone className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  No call logs
                </td>
              </tr>
            ) : (
              calls.map((call) => (
                <tr key={call.id} className="hover:bg-slate-700/50">
                  <td className="px-4 py-3">{callIcon(call.callType)}</td>
                  <td className="px-4 py-3 text-white">{call.contactName || 'Unknown'}</td>
                  <td className="px-4 py-3 text-slate-300 font-mono text-sm">{call.phoneNumber}</td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{formatDuration(call.durationSecs)}</td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{new Date(call.recordedAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
