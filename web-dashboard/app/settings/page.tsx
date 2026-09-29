'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useParentSocket } from '@/hooks/useSocket';
import { Lock, Camera, MapPin, Ban, Shield, Smartphone } from 'lucide-react';

interface Child {
  id: string;
  name: string;
}

export default function SettingsPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState('');
  const [commandStatus, setCommandStatus] = useState('');
  const { connected } = useParentSocket(selectedChild || null);

  useEffect(() => { loadChildren(); }, []);

  const loadChildren = async () => {
    try {
      const data = await api.get<Child[]>('/children');
      const list = Array.isArray(data) ? data : [];
      setChildren(list);
      if (list.length > 0) setSelectedChild(list[0].id);
    } catch {}
  };

  const execCommand = async (command: string, payload?: Record<string, unknown>) => {
    if (!selectedChild) return;
    setCommandStatus(`Sending ${command}...`);
    try {
      await api.post(`/children/${selectedChild}/alerts/commands/${command}`, { payload: payload || {} });
      setCommandStatus(`${command} sent successfully`);
      setTimeout(() => setCommandStatus(''), 3000);
    } catch {
      setCommandStatus(`Failed to send ${command}`);
    }
  };

  const commands = [
    { type: 'lock', label: 'Lock Device', icon: Lock, color: 'bg-red-600 hover:bg-red-700', desc: 'Immediately lock the device' },
    { type: 'screenshot', label: 'Take Screenshot', icon: Camera, color: 'bg-blue-600 hover:bg-blue-700', desc: 'Capture current screen' },
    { type: 'location-now', label: 'Get Location', icon: MapPin, color: 'bg-green-600 hover:bg-green-700', desc: 'Request immediate GPS fix' },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <h1 className="text-2xl font-bold text-white">Settings & Controls</h1>

      <div className="flex flex-wrap items-center gap-4">
        <select value={selectedChild} onChange={(e) => setSelectedChild(e.target.value)} className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-1.5">
          {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {commandStatus && <span className="text-sm text-primary-400">{commandStatus}</span>}
      </div>

      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Smartphone className="w-5 h-5" /> Device Commands
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {commands.map((cmd) => {
            const Icon = cmd.icon;
            return (
              <button
                key={cmd.type}
                onClick={() => execCommand(cmd.type)}
                className={`${cmd.color} text-white p-4 rounded-lg transition-colors text-left`}
              >
                <Icon className="w-6 h-6 mb-2" />
                <p className="font-medium">{cmd.label}</p>
                <p className="text-sm opacity-75 mt-1">{cmd.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" /> Web Filter Rules
        </h2>
        <p className="text-slate-400 text-sm">Configure web filtering rules to block inappropriate content.</p>
        <div className="mt-4">
          <Link href="/settings/web-filters" className="text-primary-400 hover:text-primary-300 text-sm">Manage web filter rules →</Link>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Ban className="w-5 h-5" /> Screen Time Rules
        </h2>
        <p className="text-slate-400 text-sm">Set time limits and schedules for device usage.</p>
        <div className="mt-4">
          <Link href="/settings/screen-time" className="text-primary-400 hover:text-primary-300 text-sm">Manage screen time rules →</Link>
        </div>
      </div>
    </div>
  );
}
