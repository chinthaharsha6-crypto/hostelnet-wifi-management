import { useState } from 'react';
import { Activity, Smartphone, Laptop, Monitor, Tablet, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { DataLoader } from '@/App';
import type { Session as SessionType } from '@/lib/supabase';
import { PageHeader, Card, Table, EmptyState, LoadingState } from '@/components/ui';
import { StatusBadge } from '@/components/Badges';
import { formatData, formatDuration, formatDateTime } from '@/lib/format';

export default function Sessions({ data }: { data: DataLoader }) {
  const { sessions, devices, accessPoints, students, loading, refresh } = data;
  const [filter, setFilter] = useState<string>('all');

  const deviceById = new Map(devices.map((d) => [d.id, d]));
  const apById = new Map(accessPoints.map((ap) => [ap.id, ap]));
  const studentByDevice = new Map<string, string>();
  const studentById = new Map(students.map((s) => [s.id, s]));
  devices.forEach((d) => {
    const stu = studentById.get(d.student_id);
    if (stu) studentByDevice.set(d.id, stu.full_name);
  });

  const filtered = filter === 'all' ? sessions : sessions.filter((s) => s.status === filter);
  const activeSessions = sessions.filter((s) => s.status === 'active');
  const totalData = sessions.reduce((sum, s) => sum + Number(s.data_used_mb), 0);

  function platformIcon(platform: string) {
    if (platform === 'Windows' || platform === 'Linux') return <Laptop className="w-4 h-4 text-slate-500" />;
    if (platform === 'macOS') return <Monitor className="w-4 h-4 text-slate-500" />;
    if (platform === 'iOS' || platform === 'Android') return <Smartphone className="w-4 h-4 text-slate-500" />;
    return <Tablet className="w-4 h-4 text-slate-500" />;
  }

  async function endSession(session: SessionType) {
    await supabase.from('sessions').update({ status: 'completed', disconnected_at: new Date().toISOString() }).eq('id', session.id);
    refresh();
  }

  async function remove(id: string) {
    await supabase.from('sessions').delete().eq('id', id);
    refresh();
  }

  if (loading) {
    return (
      <div className="p-8">
        <PageHeader title="Sessions" subtitle="Connection session logs" onRefresh={refresh} refreshing={loading} />
        <LoadingState />
      </div>
    );
  }

  return (
    <div className="p-8">
      <PageHeader title="Sessions" subtitle="Track wifi connection sessions across the network" onRefresh={refresh} refreshing={loading} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-5">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Active Sessions</p>
          <p className="text-2xl font-bold text-emerald-400">{activeSessions.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total Sessions</p>
          <p className="text-2xl font-bold text-white">{sessions.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Data Transferred</p>
          <p className="text-2xl font-bold text-cyan-400">{formatData(totalData)}</p>
        </Card>
      </div>

      <div className="flex gap-2 mb-4">
        {['all', 'active', 'completed', 'dropped'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
              filter === f ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {f} {f !== 'all' && `(${sessions.filter(s=>s.status===f).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState message="No sessions found" /></Card>
      ) : (
        <Card>
          <Table headers={['Student', 'Device', 'Access Point', 'Status', 'Duration', 'Data', 'Connected', '']}>
            {filtered.slice(0, 50).map((s) => {
              const device = deviceById.get(s.device_id);
              const ap = apById.get(s.access_point_id);
              const student = device ? studentByDevice.get(device.id) : undefined;
              return (
                <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3 text-slate-300 font-medium">{student ?? 'Unknown'}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {device && platformIcon(device.platform)}
                      <span className="text-slate-200">{device?.device_name ?? 'Unknown device'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-400">{ap?.name ?? 'Unknown AP'}</td>
                  <td className="px-5 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-5 py-3 text-slate-400 font-mono text-xs">{formatDuration(s.connected_at, s.disconnected_at)}</td>
                  <td className="px-5 py-3 text-slate-300">{formatData(Number(s.data_used_mb))}</td>
                  <td className="px-5 py-3 text-slate-400 text-xs">{formatDateTime(s.connected_at)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      {s.status === 'active' && (
                        <button onClick={() => endSession(s)} className="px-2 py-1 rounded text-xs font-medium text-amber-400 hover:bg-slate-800 transition-colors">
                          End
                        </button>
                      )}
                      <button onClick={() => remove(s.id)} className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors">
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
    </div>
  );
}
