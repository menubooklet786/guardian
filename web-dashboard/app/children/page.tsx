'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Users, Plus, Trash2, Key, Copy, Check } from 'lucide-react';

interface Child {
  id: string;
  name: string;
  birthDate: string | null;
  status: string;
  deviceId: string | null;
  lastSeenAt: string | null;
  createdAt: string;
}

export default function ChildrenPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showPair, setShowPair] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadChildren(); }, []);

  const loadChildren = async () => {
    try {
      const data = await api.get<Child[]>('/children');
      setChildren(data);
    } catch (err) {
      console.error('Failed to load children:', err);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/children', { name, birthDate: birthDate || null });
      setName('');
      setBirthDate('');
      setShowAdd(false);
      await loadChildren();
    } catch (err) {
      console.error('Failed to add child:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (childId: string) => {
    if (!confirm('Are you sure? This will remove all data for this child.')) return;
    try {
      await api.delete(`/children/${childId}`);
      await loadChildren();
    } catch (err) {
      console.error('Failed to delete child:', err);
    }
  };

  const generatePairingCode = async (childId: string) => {
    try {
      const data = await api.post<{ code: string; expiresAt: string }>(`/auth/device/pair-code`, { childId });
      setPairingCode(data.code);
      setShowPair(childId);
    } catch (err) {
      console.error('Failed to generate pairing code:', err);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(pairingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-white">Children</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Child
        </button>
      </div>

      {showAdd && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4">Add Child Profile</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Birth Date (optional)</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Child'}
              </button>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {children.length === 0 ? (
          <div className="bg-slate-800 rounded-lg p-12 text-center border border-slate-700">
            <Users className="w-16 h-16 mx-auto mb-4 text-slate-500" />
            <p className="text-slate-400 text-lg">No children added yet</p>
            <p className="text-slate-500 text-sm mt-2">Add a child profile to start monitoring</p>
          </div>
        ) : (
          children.map((child) => (
            <div key={child.id} className="bg-slate-800 rounded-lg p-4 sm:p-6 border border-slate-700">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                    {child.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{child.name}</h3>
                    <p className="text-sm text-slate-400">
                      {child.lastSeenAt
                        ? `Last seen: ${new Date(child.lastSeenAt).toLocaleString()}`
                        : 'Never connected'}
                    </p>
                    {child.birthDate && (
                      <p className="text-sm text-slate-500">Born: {child.birthDate}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {showPair === child.id && pairingCode ? (
                    <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-lg border border-slate-600">
                      <Key className="w-4 h-4 text-primary-400" />
                      <span className="text-2xl font-mono font-bold text-white tracking-widest">{pairingCode}</span>
                      <button onClick={copyCode} className="text-slate-400 hover:text-white">
                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => generatePairingCode(child.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                    >
                      <Key className="w-4 h-4" />
                      Pair Device
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(child.id)}
                    className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
