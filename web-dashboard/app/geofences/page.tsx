'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { MapPin, Plus, Trash2 } from 'lucide-react';

interface Child {
  id: string;
  name: string;
}

interface Geofence {
  id: string;
  childId: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  active: boolean;
  alertOnEnter: boolean;
  alertOnExit: boolean;
}

export default function GeofencesPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [selectedChild, setSelectedChild] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'safe', latitude: '', longitude: '', radiusMeters: '200', alertOnEnter: true, alertOnExit: true });

  useEffect(() => {
    loadChildren();
  }, []);

  useEffect(() => {
    if (selectedChild) loadGeofences();
  }, [selectedChild]);

  const loadChildren = async () => {
    try {
      const data = await api.get<Child[]>('/children');
      setChildren(data);
      if (data.length > 0) setSelectedChild(data[0].id);
    } catch {}
  };

  const loadGeofences = async () => {
    try {
      const data = await api.get<Geofence[]>(`/children/${selectedChild}/geofences`);
      setGeofences(data || []);
    } catch {}
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/children/${selectedChild}/geofences`, {
        childId: selectedChild,
        name: form.name,
        type: form.type,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        radiusMeters: parseInt(form.radiusMeters),
        alertOnEnter: form.alertOnEnter,
        alertOnExit: form.alertOnExit,
      });
      setShowAdd(false);
      setForm({ name: '', type: 'safe', latitude: '', longitude: '', radiusMeters: '200', alertOnEnter: true, alertOnExit: true });
      await loadGeofences();
    } catch (err) {
      console.error('Failed to add geofence:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this geofence?')) return;
    try {
      await api.delete(`/children/${selectedChild}/geofences/${id}`);
      await loadGeofences();
    } catch {}
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-white">Geofences</h1>
        <button onClick={() => setShowAdd(true)} className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Add Geofence
        </button>
      </div>

      <div className="flex items-center gap-4">
        <select value={selectedChild} onChange={(e) => setSelectedChild(e.target.value)} className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-1.5">
          {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {showAdd && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4">Add Geofence</h2>
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm">
                <option value="safe">Safe Zone</option>
                <option value="danger">Danger Zone</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Latitude</label>
              <input type="number" step="any" value={form.latitude} onChange={(e) => setForm({...form, latitude: e.target.value})} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Longitude</label>
              <input type="number" step="any" value={form.longitude} onChange={(e) => setForm({...form, longitude: e.target.value})} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Radius (meters)</label>
              <input type="number" value={form.radiusMeters} onChange={(e) => setForm({...form, radiusMeters: e.target.value})} className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500" required />
            </div>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={form.alertOnEnter} onChange={(e) => setForm({...form, alertOnEnter: e.target.checked})} className="rounded bg-slate-800 border-slate-600" />
                Alert on enter
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={form.alertOnExit} onChange={(e) => setForm({...form, alertOnExit: e.target.checked})} className="rounded bg-slate-800 border-slate-600" />
                Alert on exit
              </label>
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">Create</button>
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-3">
        {geofences.length === 0 ? (
          <div className="bg-slate-800 rounded-lg p-12 text-center border border-slate-700">
            <MapPin className="w-16 h-16 mx-auto mb-4 text-slate-500" />
            <p className="text-slate-400">No geofences configured</p>
          </div>
        ) : (
          geofences.map((g) => (
            <div key={g.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${g.type === 'safe' ? 'bg-green-900/50' : g.type === 'danger' ? 'bg-red-900/50' : 'bg-blue-900/50'}`}>
                  <MapPin className={`w-5 h-5 ${g.type === 'safe' ? 'text-green-400' : g.type === 'danger' ? 'text-red-400' : 'text-blue-400'}`} />
                </div>
                <div>
                  <h3 className="text-white font-medium">{g.name}</h3>
                  <p className="text-sm text-slate-400">
                    {g.latitude.toFixed(5)}, {g.longitude.toFixed(5)} — {g.radiusMeters}m radius
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {g.alertOnEnter && <span className="text-xs px-2 py-0.5 bg-green-900/50 text-green-300 rounded">Enter alert</span>}
                    {g.alertOnExit && <span className="text-xs px-2 py-0.5 bg-yellow-900/50 text-yellow-300 rounded">Exit alert</span>}
                    <span className={`text-xs px-2 py-0.5 rounded ${g.active ? 'bg-green-900/50 text-green-300' : 'bg-slate-700 text-slate-400'}`}>
                      {g.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => handleDelete(g.id)} className="self-start sm:self-auto p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
