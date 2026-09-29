'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Clock, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

interface Child {
  id: string;
  name: string;
}

interface ScreenTimeRule {
  id: string;
  childId: string;
  dayOfWeek: number | null;
  startTime: string;
  endTime: string;
  maxDurationMs: number | null;
  allowedApps: unknown;
  action: string;
  active: boolean;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatDuration(ms: number | null): string {
  if (!ms) return 'No limit';
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours && minutes) return `${hours}h ${minutes}m`;
  if (hours) return `${hours}h`;
  return `${minutes}m`;
}

export default function ScreenTimeRulesPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [rules, setRules] = useState<ScreenTimeRule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newRule, setNewRule] = useState({
    dayOfWeek: null as number | null,
    startTime: '08:00',
    endTime: '20:00',
    maxDurationHours: 2,
    action: 'block',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<Child[]>('/children');
        setChildren(Array.isArray(data) ? data : []);
        if (data.length > 0) setSelectedChild(data[0].id);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (selectedChild) loadRules();
  }, [selectedChild]);

  const loadRules = async () => {
    try {
      const data = await api.get<ScreenTimeRule[]>(`/children/${selectedChild}/screen-time-rules`);
      setRules(Array.isArray(data) ? data : []);
    } catch {}
  };

  const addRule = async () => {
    if (!selectedChild) return;
    setSaving(true);
    try {
      await api.post(`/children/${selectedChild}/screen-time-rules`, {
        dayOfWeek: newRule.dayOfWeek,
        startTime: newRule.startTime,
        endTime: newRule.endTime,
        maxDurationMs: newRule.maxDurationHours * 3600000,
        action: newRule.action,
      });
      setShowForm(false);
      await loadRules();
    } catch {}
    setSaving(false);
  };

  const toggleRule = async (rule: ScreenTimeRule) => {
    try {
      await api.patch(`/children/${selectedChild}/screen-time-rules/${rule.id}`, { active: !rule.active });
      await loadRules();
    } catch {}
  };

  const deleteRule = async (ruleId: string) => {
    try {
      await api.delete(`/children/${selectedChild}/screen-time-rules/${ruleId}`);
      await loadRules();
    } catch {}
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Clock className="w-7 h-7" /> Screen Time Rules
        </h1>
        {selectedChild && (
          <button onClick={() => setShowForm(!showForm)} className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
            <Plus className="w-4 h-4" /> Add Rule
          </button>
        )}
      </div>

      {children.length > 1 && (
        <select value={selectedChild || ''} onChange={(e) => setSelectedChild(e.target.value)} className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-1.5">
          {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      )}

      {showForm && selectedChild && (
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <select value={newRule.dayOfWeek ?? ''} onChange={(e) => setNewRule({ ...newRule, dayOfWeek: e.target.value === '' ? null : parseInt(e.target.value) })} className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2">
              <option value="">Every day</option>
              {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Start time</label>
              <input type="time" value={newRule.startTime} onChange={(e) => setNewRule({ ...newRule, startTime: e.target.value })} className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">End time</label>
              <input type="time" value={newRule.endTime} onChange={(e) => setNewRule({ ...newRule, endTime: e.target.value })} className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Max duration (hours)</label>
              <input type="number" min={0.5} max={24} step={0.5} value={newRule.maxDurationHours} onChange={(e) => setNewRule({ ...newRule, maxDurationHours: parseFloat(e.target.value) })} className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
            </div>
          </div>
          <div className="flex gap-2">
            <select value={newRule.action} onChange={(e) => setNewRule({ ...newRule, action: e.target.value })} className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2">
              <option value="block">Block device</option>
              <option value="limit">Show warning</option>
              <option value="allow">Allow (log only)</option>
            </select>
            <button onClick={addRule} disabled={saving} className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm transition-colors">
              {saving ? 'Adding...' : 'Add Rule'}
            </button>
            <button onClick={() => setShowForm(false)} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {!selectedChild ? (
          <div className="bg-slate-800 rounded-lg p-12 text-center border border-slate-700">
            <p className="text-slate-400">No children added yet</p>
          </div>
        ) : rules.length === 0 ? (
          <div className="bg-slate-800 rounded-lg p-12 text-center border border-slate-700">
            <Clock className="w-16 h-16 mx-auto mb-4 text-slate-500" />
            <p className="text-slate-400">No screen time rules configured</p>
            <p className="text-slate-500 text-sm mt-1">Add rules to control when and how long the device can be used</p>
          </div>
        ) : (
          rules.map((rule) => (
            <div key={rule.id} className={`bg-slate-800 rounded-lg p-4 border flex items-center justify-between ${rule.active ? 'border-slate-700' : 'border-slate-700 opacity-60'}`}>
              <div className="flex items-center gap-3 min-w-0">
                <Clock className={`w-5 h-5 flex-shrink-0 ${rule.action === 'block' ? 'text-red-400' : rule.action === 'limit' ? 'text-yellow-400' : 'text-green-400'}`} />
                <div className="min-w-0">
                  <p className="text-white text-sm">
                    {rule.dayOfWeek !== null ? DAYS[rule.dayOfWeek] : 'Every day'} &middot; {rule.startTime} - {rule.endTime}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded">{formatDuration(rule.maxDurationMs)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${rule.action === 'block' ? 'bg-red-900/50 text-red-300' : rule.action === 'limit' ? 'bg-yellow-900/50 text-yellow-300' : 'bg-green-900/50 text-green-300'}`}>
                      {rule.action}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button onClick={() => toggleRule(rule)} className="text-slate-400 hover:text-white transition-colors" title={rule.active ? 'Disable' : 'Enable'}>
                  {rule.active ? <ToggleRight className="w-6 h-6 text-green-400" /> : <ToggleLeft className="w-6 h-6" />}
                </button>
                <button onClick={() => deleteRule(rule.id)} className="text-slate-400 hover:text-red-400 transition-colors" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
