import { useState } from 'react';
import { Ticket as TicketIcon, Plus, Pencil, Trash2, X, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { DataLoader } from '@/App';
import type { Ticket } from '@/lib/supabase';
import { PageHeader, Card, Table, EmptyState, LoadingState } from '@/components/ui';
import { StatusBadge, PriorityBadge } from '@/components/Badges';
import { inputCls, Field } from '@/components/views/AccessPoints';
import { formatTimeAgo } from '@/lib/format';

type EditState = { mode: 'add' | 'edit'; data: Partial<Ticket> } | null;

export default function Tickets({ data }: { data: DataLoader }) {
  const { tickets, students, loading, refresh } = data;
  const [edit, setEdit] = useState<EditState>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<string | null>(null);

  const studentById = new Map(students.map((s) => [s.id, s]));
  const filtered = filter === 'all' ? tickets : tickets.filter((t) => t.status === filter);

  async function save(t: Partial<Ticket>) {
    setSaving(true);
    if (edit?.mode === 'add') {
      await supabase.from('tickets').insert(t);
    } else {
      await supabase.from('tickets').update(t).eq('id', edit!.data.id);
    }
    setSaving(false);
    setEdit(null);
    refresh();
  }

  async function remove(id: string) {
    await supabase.from('tickets').delete().eq('id', id);
    refresh();
  }

  async function advanceStatus(t: Ticket) {
    const next = t.status === 'open' ? 'in_progress' : t.status === 'in_progress' ? 'resolved' : 'open';
    const update: Partial<Ticket> = { status: next };
    if (next === 'resolved') update.resolved_at = new Date().toISOString();
    if (next !== 'resolved') update.resolved_at = null;
    await supabase.from('tickets').update(update).eq('id', t.id);
    refresh();
  }

  if (loading) {
    return (
      <div className="p-8">
        <PageHeader title="Support Tickets" subtitle="Connectivity issue reports" onRefresh={refresh} refreshing={loading} />
        <LoadingState />
      </div>
    );
  }

  const openCount = tickets.filter((t) => t.status === 'open').length;
  const inProgressCount = tickets.filter((t) => t.status === 'in_progress').length;
  const resolvedCount = tickets.filter((t) => t.status === 'resolved').length;

  return (
    <div className="p-8">
      <PageHeader
        title="Support Tickets"
        subtitle="Manage student connectivity issues and requests"
        onRefresh={refresh}
        refreshing={loading}
        action={
          <button
            onClick={() => setEdit({ mode: 'add', data: { student_id: students[0]?.id ?? '', subject: '', description: '', status: 'open', priority: 'medium' } })}
            disabled={students.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 text-white text-sm font-medium hover:bg-cyan-400 disabled:opacity-50 transition-colors"
          >
            <Plus className="w-4 h-4" /> New Ticket
          </button>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-400" />
          <div><p className="text-xl font-bold text-white">{openCount}</p><p className="text-xs text-slate-400">Open</p></div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <TicketIcon className="w-5 h-5 text-sky-400" />
          <div><p className="text-xl font-bold text-white">{inProgressCount}</p><p className="text-xs text-slate-400">In Progress</p></div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <div><p className="text-xl font-bold text-white">{resolvedCount}</p><p className="text-xs text-slate-400">Resolved</p></div>
        </Card>
      </div>

      <div className="flex gap-2 mb-4">
        {['all', 'open', 'in_progress', 'resolved'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
              filter === f ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {f === 'in_progress' ? 'In Progress' : f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState message="No tickets found" /></Card>
      ) : (
        <Card>
          <Table headers={['Subject', 'Student', 'Priority', 'Status', 'Created', '']}>
            {filtered.map((t) => {
              const student = studentById.get(t.student_id);
              const isOpen = selected === t.id;
              return (
                <>
                  <tr key={t.id} className="hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => setSelected(isOpen ? null : t.id)}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-200">{t.subject}</p>
                      {t.description && <p className="text-xs text-slate-500 mt-0.5 truncate max-w-md">{t.description}</p>}
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-slate-300 text-sm">{student?.full_name ?? 'Unknown'}</p>
                      <p className="text-xs text-slate-500">Room {student?.room_number ?? '?'}</p>
                    </td>
                    <td className="px-5 py-3"><PriorityBadge priority={t.priority} /></td>
                    <td className="px-5 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-5 py-3 text-slate-400 text-xs">{formatTimeAgo(t.created_at)}</td>
                    <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => advanceStatus(t)} className="px-2 py-1 rounded text-xs font-medium text-cyan-400 hover:bg-slate-800 transition-colors">
                          {t.status === 'open' ? 'Start' : t.status === 'in_progress' ? 'Resolve' : 'Reopen'}
                        </button>
                        <button onClick={() => setEdit({ mode: 'edit', data: t })} className="p-1.5 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => remove(t.id)} className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isOpen && t.description && (
                    <tr key={t.id + '-detail'} className="bg-slate-900/50">
                      <td colSpan={6} className="px-5 py-4">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</p>
                        <p className="text-sm text-slate-300 leading-relaxed">{t.description}</p>
                        {t.resolved_at && <p className="text-xs text-emerald-400 mt-2">Resolved {formatTimeAgo(t.resolved_at)}</p>}
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </Table>
        </Card>
      )}

      {edit && <EditModal edit={edit} students={students} onClose={() => setEdit(null)} onSave={save} saving={saving} />}
    </div>
  );
}

function EditModal({ edit, students, onClose, onSave, saving }: { edit: EditState; students: DataLoader['students']; onClose: () => void; onSave: (t: Partial<Ticket>) => void; saving: boolean }) {
  const [form, setForm] = useState<Partial<Ticket>>(edit!.data);
  const set = (k: keyof Ticket, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <TicketIcon className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">{edit!.mode === 'add' ? 'New Support Ticket' : 'Edit Ticket'}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Student" className="col-span-2">
            <select className={inputCls} value={form.student_id ?? ''} onChange={(e) => set('student_id', e.target.value)}>
              {students.map((s) => <option key={s.id} value={s.id}>{s.full_name} — Room {s.room_number}</option>)}
            </select>
          </Field>
          <Field label="Subject" className="col-span-2"><input className={inputCls} value={form.subject ?? ''} onChange={(e) => set('subject', e.target.value)} placeholder="Brief description of the issue" /></Field>
          <Field label="Description" className="col-span-2"><textarea className={`${inputCls} h-24 resize-none`} value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} placeholder="Detailed description..." /></Field>
          <Field label="Priority">
            <select className={inputCls} value={form.priority ?? 'medium'} onChange={(e) => set('priority', e.target.value)}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
            </select>
          </Field>
          <Field label="Status">
            <select className={inputCls} value={form.status ?? 'open'} onChange={(e) => set('status', e.target.value)}>
              <option value="open">Open</option><option value="in_progress">In Progress</option><option value="resolved">Resolved</option>
            </select>
          </Field>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-slate-400 hover:text-slate-200 text-sm font-medium">Cancel</button>
          <button onClick={() => onSave(form)} disabled={saving || !form.subject || !form.student_id} className="px-4 py-2 rounded-lg bg-cyan-500 text-white text-sm font-medium hover:bg-cyan-400 disabled:opacity-50 transition-colors">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
