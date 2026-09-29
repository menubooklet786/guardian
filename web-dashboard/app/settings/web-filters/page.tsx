'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Shield, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

interface Child {
  id: string;
  name: string;
}

interface WebFilterRule {
  id: string;
  childId: string;
  ruleType: string;
  pattern: string;
  category: string | null;
  active: boolean;
}

const RULE_TYPES = [
  { value: 'blocklist', label: 'Block List' },
  { value: 'allowlist', label: 'Allow List' },
  { value: 'category', label: 'Category Block' },
] as const;

const CATEGORIES = [
  'adult', 'gambling', 'violence', 'drugs', 'social-media', 'gaming', 'streaming', 'shopping', 'news', 'other',
];

export default function WebFilterRulesPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [rules, setRules] = useState<WebFilterRule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newRule, setNewRule] = useState({ ruleType: 'blocklist' as string, pattern: '', category: '' });
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
      const data = await api.get<WebFilterRule[]>(`/children/${selectedChild}/web-filter-rules`);
      setRules(Array.isArray(data) ? data : []);
    } catch {}
  };

  const addRule = async () => {
    if (!selectedChild || !newRule.pattern.trim()) return;
    setSaving(true);
    try {
      await api.post(`/children/${selectedChild}/web-filter-rules`, {
        ruleType: newRule.ruleType,
        pattern: newRule.pattern.trim(),
        category: newRule.category || null,
      });
      setNewRule({ ruleType: 'blocklist', pattern: '', category: '' });
      setShowForm(false);
      await loadRules();
    } catch {}
    setSaving(false);
  };

  const toggleRule = async (rule: WebFilterRule) => {
    try {
      await api.patch(`/children/${selectedChild}/web-filter-rules/${rule.id}`, { active: !rule.active });
      await loadRules();
    } catch {}
  };

  const deleteRule = async (ruleId: string) => {
    try {
      await api.delete(`/children/${selectedChild}/web-filter-rules/${ruleId}`);
      await loadRules();
    } catch {}
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="w-7 h-7" /> Web Filter Rules
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select value={newRule.ruleType} onChange={(e) => setNewRule({ ...newRule, ruleType: e.target.value })} className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2">
              {RULE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <input type="text" placeholder={newRule.ruleType === 'category' ? 'e.g. social-media' : 'e.g. *.example.com'} value={newRule.pattern} onChange={(e) => setNewRule({ ...newRule, pattern: e.target.value })} className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
            {newRule.ruleType === 'category' ? (
              <select value={newRule.category} onChange={(e) => setNewRule({ ...newRule, category: e.target.value })} className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2">
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            ) : (
              <input type="text" placeholder="Category (optional)" value={newRule.category} onChange={(e) => setNewRule({ ...newRule, category: e.target.value })} className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={addRule} disabled={saving || !newRule.pattern.trim()} className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm transition-colors">
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
            <Shield className="w-16 h-16 mx-auto mb-4 text-slate-500" />
            <p className="text-slate-400">No filter rules configured</p>
            <p className="text-slate-500 text-sm mt-1">Add rules to block or allow specific websites and categories</p>
          </div>
        ) : (
          rules.map((rule) => (
            <div key={rule.id} className={`bg-slate-800 rounded-lg p-4 border flex items-center justify-between ${rule.active ? 'border-slate-700' : 'border-slate-700 opacity-60'}`}>
              <div className="flex items-center gap-3 min-w-0">
                <Shield className={`w-5 h-5 flex-shrink-0 ${rule.ruleType === 'blocklist' ? 'text-red-400' : rule.ruleType === 'allowlist' ? 'text-green-400' : 'text-yellow-400'}`} />
                <div className="min-w-0">
                  <p className="text-white text-sm truncate">{rule.pattern}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded">{rule.ruleType}</span>
                    {rule.category && <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded">{rule.category}</span>}
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
