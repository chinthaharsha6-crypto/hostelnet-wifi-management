import { useState } from 'react';
import { Router, Plus, Pencil, Trash2, X, Signal } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { DataLoader } from '@/App';
import type { AccessPoint } from '@/lib/supabase';
import { PageHeader, Card, Table, EmptyState, LoadingState } from '@/components/ui';
import { StatusBadge } from '@/components/Badges';
import { formatTimeAgo } from '@/lib/format';

type EditState = { mode: 'add' | 'edit'; data: Partial<AccessPoint> } | null;

const emptyAP: Partial<AccessPoint> = {
  name: '',
  location: '',
  status: 'online',
  ip_address: '',
  mac_address: '',
  connected_clients: 0,
  max_clients: 60,
  firmware_version: '2.4.1',
};

export default function AccessPoints({ data }: { data: DataLoader }) {
  const { accessPoints, loading, refresh } = data;
  const [edit, setEdit] = useState<EditState>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const filtered = filter === 'all' ? accessPoints : accessPoints.filter((ap) => ap.status === filter);

  async function save(ap: Partial<AccessPoint>) {
    setSaving(true);
    if (edit?.mode === 'add') {
      await supabase.from('access_points').insert(ap);
    } else {
      await supabase.from('access_points').update(ap).eq('id', edit!.data.id);
    }
    setSaving(false);
    setEdit(null);
    refresh();
  }

  async function remove(id: string) {
    await supabase.from('access_points').delete().eq('id', id);
    refresh();
  }

  if (loading) {
    return (
      <div className="p-8">
        <PageHeader title="Access Points" subtitle="Manage wifi routers across the hostel" onRefresh={refresh} refreshing={loading} />
        <LoadingState />
      </div>
    );
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Access Points"
        subtitle="Manage wifi routers deployed across hostel floors"
        onRefresh={refresh}
        refreshing={loading}
        action={
          <button
            onClick={() => setEdit({ mode: 'add', data: { ...emptyAP } })}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 text-white text-sm font-medium hover:bg-cyan-400 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Access Point
          </button>
        }
      />

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {['all', 'online', 'warning', 'offline'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
              filter === f ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {f === 'all' ? 'All' : f} {f !== 'all' && `(${accessPoints.filter(a=>a.status===f).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState message="No access points found" /></Card>
      ) : (
        <Card>
          <Table headers={['Name', 'Location', 'Status', 'Clients', 'IP Address', 'Last Seen', '']}>
            {filtered.map((ap) => {
              const pct = Math.round((ap.connected_clients / ap.max_clients) * 100);
              return (
                <tr key={ap.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Router className="w-4 h-4 text-slate-500" />
                      <span className="font-medium text-slate-200">{ap.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-400">{ap.location}</td>
                  <td className="px-5 py-3"><StatusBadge status={ap.status} /></td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${pct > 90 ? 'bg-red-500' : pct > 75 ? 'bg-amber-500' : 'bg-cyan-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-slate-400 whitespace-nowrap">{ap.connected_clients}/{ap.max_clients}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-400 font-mono text-xs">{ap.ip_address ?? '—'}</td>
                  <td className="px-5 py-3 text-slate-400 text-xs">{formatTimeAgo(ap.last_seen)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => setEdit({ mode: 'edit', data: ap })} className="p-1.5 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => remove(ap.id)} className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </Table>
        </Card>
      )}

      {edit && <EditModal edit={edit} onClose={() => setEdit(null)} onSave={save} saving={saving} />}
    </div>
  );
}

function EditModal({ edit, onClose, onSave, saving }: { edit: EditState; onClose: () => void; onSave: (ap: Partial<AccessPoint>) => void; saving: boolean }) {
  const [form, setForm] = useState<Partial<AccessPoint>>(edit!.data);
  const set = (k: keyof AccessPoint, v: string | number) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Signal className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">{edit!.mode === 'add' ? 'Add Access Point' : 'Edit Access Point'}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Name" className="col-span-2"><input className={inputCls} value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} placeholder="AP-F6-CorridorA" /></Field>
          <Field label="Location" className="col-span-2"><input className={inputCls} value={form.location ?? ''} onChange={(e) => set('location', e.target.value)} placeholder="Floor 6 - Corridor A" /></Field>
          <Field label="Status">
            <select className={inputCls} value={form.status ?? 'online'} onChange={(e) => set('status', e.target.value)}>
              <option value="online">Online</option><option value="warning">Warning</option><option value="offline">Offline</option>
            </select>
          </Field>
          <Field label="IP Address"><input className={inputCls} value={form.ip_address ?? ''} onChange={(e) => set('ip_address', e.target.value)} placeholder="10.0.6.1" /></Field>
          <Field label="MAC Address"><input className={inputCls} value={form.mac_address ?? ''} onChange={(e) => set('mac_address', e.target.value)} placeholder="00:1A:2B:3C:4D:09" /></Field>
          <Field label="Firmware"><input className={inputCls} value={form.firmware_version ?? ''} onChange={(e) => set('firmware_version', e.target.value)} /></Field>
          <Field label="Max Clients"><input type="number" className={inputCls} value={form.max_clients ?? 60} onChange={(e) => set('max_clients', parseInt(e.target.value) || 0)} /></Field>
          <Field label="Connected Clients"><input type="number" className={inputCls} value={form.connected_clients ?? 0} onChange={(e) => set('connected_clients', parseInt(e.target.value) || 0)} /></Field>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-slate-400 hover:text-slate-200 text-sm font-medium">Cancel</button>
          <button onClick={() => onSave(form)} disabled={saving || !form.name || !form.location} className="px-4 py-2 rounded-lg bg-cyan-500 text-white text-sm font-medium hover:bg-cyan-400 disabled:opacity-50 transition-colors">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls = 'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors';

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export { inputCls, Field };
