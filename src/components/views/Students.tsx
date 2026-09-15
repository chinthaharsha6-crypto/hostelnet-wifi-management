import { useState } from 'react';
import { Users, Plus, Pencil, Trash2, X, Wifi, WifiOff, Clock, Smartphone, Laptop } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { DataLoader } from '@/App';
import type { Student, Device } from '@/lib/supabase';
import { PageHeader, Card, Table, EmptyState, LoadingState } from '@/components/ui';
import { StatusBadge, PlanBadge } from '@/components/Badges';
import { inputCls, Field } from '@/components/views/AccessPoints';
import { formatData } from '@/lib/format';

type EditState = { mode: 'add' | 'edit'; data: Partial<Student> } | null;

const emptyStudent: Partial<Student> = {
  full_name: '', room_number: '', email: '', phone: '', wifi_status: 'pending', plan: 'basic', data_used_mb: 0, data_cap_mb: 10240,
};

export default function Students({ data }: { data: DataLoader }) {
  const { students, devices, loading, refresh } = data;
  const [edit, setEdit] = useState<EditState>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = students.filter((s) => {
    if (filter !== 'all' && s.wifi_status !== filter) return false;
    if (search && !`${s.full_name} ${s.room_number} ${s.email}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const devicesByStudent = new Map<string, Device[]>();
  devices.forEach((d) => {
    const arr = devicesByStudent.get(d.student_id) ?? [];
    arr.push(d);
    devicesByStudent.set(d.student_id, arr);
  });

  async function save(s: Partial<Student>) {
    setSaving(true);
    if (edit?.mode === 'add') {
      await supabase.from('students').insert(s);
    } else {
      await supabase.from('students').update(s).eq('id', edit!.data.id);
    }
    setSaving(false);
    setEdit(null);
    refresh();
  }

  async function remove(id: string) {
    await supabase.from('students').delete().eq('id', id);
    refresh();
  }

  async function toggleWifi(student: Student) {
    const newStatus = student.wifi_status === 'active' ? 'suspended' : 'active';
    await supabase.from('students').update({ wifi_status: newStatus }).eq('id', student.id);
    refresh();
  }

  if (loading) {
    return (
      <div className="p-8">
        <PageHeader title="Students" subtitle="Manage resident wifi access" onRefresh={refresh} refreshing={loading} />
        <LoadingState />
      </div>
    );
  }

  const selectedStudent = selected ? students.find((s) => s.id === selected) : null;
  const selectedDevices = selected ? devicesByStudent.get(selected) ?? [] : [];

  return (
    <div className="p-8">
      <PageHeader
        title="Students"
        subtitle="Manage resident wifi access and data plans"
        onRefresh={refresh}
        refreshing={loading}
        action={
          <button
            onClick={() => setEdit({ mode: 'add', data: { ...emptyStudent } })}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 text-white text-sm font-medium hover:bg-cyan-400 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Student
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, room, or email..."
          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
        />
        <div className="flex gap-2">
          {['all', 'active', 'suspended', 'pending'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                filter === f ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState message="No students found" /></Card>
      ) : (
        <Card>
          <Table headers={['Name', 'Room', 'Plan', 'Status', 'Data Usage', 'Devices', '']}>
            {filtered.map((s) => {
              const studentDevices = devicesByStudent.get(s.id) ?? [];
              const dataPct = s.data_cap_mb >= 999999 ? 0 : Math.min(100, Math.round((Number(s.data_used_mb) / Number(s.data_cap_mb)) * 100));
              const isUnlimited = s.data_cap_mb >= 999999;
              return (
                <>
                  <tr key={s.id} className="hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => setSelected(selected === s.id ? null : s.id)}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-200">
                          {s.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                        <div>
                          <p className="font-medium text-slate-200">{s.full_name}</p>
                          <p className="text-xs text-slate-500">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-300 font-medium">{s.room_number}</td>
                    <td className="px-5 py-3"><PlanBadge plan={s.plan} /></td>
                    <td className="px-5 py-3"><StatusBadge status={s.wifi_status} /></td>
                    <td className="px-5 py-3">
                      {isUnlimited ? (
                        <span className="text-sm text-slate-300">{formatData(Number(s.data_used_mb))} <span className="text-slate-500">/ unlimited</span></span>
                      ) : (
                        <div className="w-32">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-300">{formatData(Number(s.data_used_mb))}</span>
                            <span className="text-slate-500">{formatData(Number(s.data_cap_mb))}</span>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${dataPct > 90 ? 'bg-red-500' : dataPct > 75 ? 'bg-amber-500' : 'bg-cyan-500'}`} style={{ width: `${dataPct}%` }} />
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-400">{studentDevices.length} device{studentDevices.length !== 1 ? 's' : ''}</td>
                    <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => toggleWifi(s)} className={`p-1.5 rounded transition-colors ${s.wifi_status === 'active' ? 'text-emerald-400 hover:bg-slate-800' : 'text-slate-500 hover:text-emerald-400 hover:bg-slate-800'}`} title={s.wifi_status === 'active' ? 'Suspend wifi' : 'Activate wifi'}>
                          {s.wifi_status === 'active' ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => setEdit({ mode: 'edit', data: s })} className="p-1.5 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => remove(s.id)} className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {selected === s.id && (
                    <tr key={s.id + '-detail'} className="bg-slate-900/50">
                      <td colSpan={7} className="px-5 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Contact</p>
                            <p className="text-sm text-slate-300">{s.phone || 'No phone on file'}</p>
                            <p className="text-sm text-slate-300">{s.email}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Registered Devices ({selectedDevices.length})</p>
                            <div className="space-y-1.5">
                              {selectedDevices.length === 0 && <p className="text-sm text-slate-500">No devices registered</p>}
                              {selectedDevices.map((d) => (
                                <div key={d.id} className="flex items-center gap-2 text-sm">
                                  {d.platform === 'Windows' || d.platform === 'Linux' ? <Laptop className="w-3.5 h-3.5 text-slate-500" /> : <Smartphone className="w-3.5 h-3.5 text-slate-500" />}
                                  <span className="text-slate-300">{d.device_name}</span>
                                  <span className="text-slate-500 text-xs">{d.platform}</span>
                                  <StatusBadge status={d.status} />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </Table>
        </Card>
      )}

      {edit && <EditModal edit={edit} onClose={() => setEdit(null)} onSave={save} saving={saving} />}
    </div>
  );
}

function EditModal({ edit, onClose, onSave, saving }: { edit: EditState; onClose: () => void; onSave: (s: Partial<Student>) => void; saving: boolean }) {
  const [form, setForm] = useState<Partial<Student>>(edit!.data);
  const set = (k: keyof Student, v: string | number) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">{edit!.mode === 'add' ? 'Add Student' : 'Edit Student'}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Full Name" className="col-span-2"><input className={inputCls} value={form.full_name ?? ''} onChange={(e) => set('full_name', e.target.value)} placeholder="Jane Doe" /></Field>
          <Field label="Room Number"><input className={inputCls} value={form.room_number ?? ''} onChange={(e) => set('room_number', e.target.value)} placeholder="101" /></Field>
          <Field label="Email"><input className={inputCls} value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} placeholder="jane.doe@hostel.edu" /></Field>
          <Field label="Phone"><input className={inputCls} value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} placeholder="+1-555-0100" /></Field>
          <Field label="Wifi Status">
            <select className={inputCls} value={form.wifi_status ?? 'pending'} onChange={(e) => set('wifi_status', e.target.value)}>
              <option value="active">Active</option><option value="suspended">Suspended</option><option value="pending">Pending</option>
            </select>
          </Field>
          <Field label="Plan">
            <select className={inputCls} value={form.plan ?? 'basic'} onChange={(e) => {
              const plan = e.target.value;
              set('plan', plan);
              set('data_cap_mb', plan === 'basic' ? 10240 : plan === 'premium' ? 20480 : 999999);
            }}>
              <option value="basic">Basic (10 GB)</option><option value="premium">Premium (20 GB)</option><option value="unlimited">Unlimited</option>
            </select>
          </Field>
          <Field label="Data Used (MB)"><input type="number" className={inputCls} value={form.data_used_mb ?? 0} onChange={(e) => set('data_used_mb', parseFloat(e.target.value) || 0)} /></Field>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-slate-400 hover:text-slate-200 text-sm font-medium">Cancel</button>
          <button onClick={() => onSave(form)} disabled={saving || !form.full_name || !form.room_number || !form.email} className="px-4 py-2 rounded-lg bg-cyan-500 text-white text-sm font-medium hover:bg-cyan-400 disabled:opacity-50 transition-colors">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
