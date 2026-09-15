import { Wifi, Router, Users, Activity, AlertTriangle, TrendingUp, Signal, Gauge } from 'lucide-react';
import type { DataLoader } from '@/App';
import { PageHeader, StatCard, Card, LoadingState } from '@/components/ui';
import { StatusBadge, PriorityBadge } from '@/components/Badges';
import { formatData, formatTimeAgo } from '@/lib/format';

export default function Dashboard({ data }: { data: DataLoader }) {
  const { accessPoints, students, devices, sessions, tickets, loading, refresh } = data;

  if (loading) {
    return (
      <div className="p-8">
        <PageHeader title="Dashboard" subtitle="Network overview" onRefresh={refresh} refreshing={loading} />
        <LoadingState />
      </div>
    );
  }

  const onlineAPs = accessPoints.filter((ap) => ap.status === 'online').length;
  const totalClients = accessPoints.reduce((sum, ap) => sum + ap.connected_clients, 0);
  const totalCapacity = accessPoints.reduce((sum, ap) => sum + ap.max_clients, 0);
  const activeStudents = students.filter((s) => s.wifi_status === 'active').length;
  const connectedDevices = devices.filter((d) => d.status === 'connected').length;
  const activeSessions = sessions.filter((s) => s.status === 'active').length;
  const openTickets = tickets.filter((t) => t.status !== 'resolved').length;
  const urgentTickets = tickets.filter((t) => t.priority === 'urgent' && t.status !== 'resolved').length;
  const totalDataUsed = sessions.reduce((sum, s) => sum + Number(s.data_used_mb), 0);

  const apsByStatus = {
    online: accessPoints.filter((ap) => ap.status === 'online').length,
    warning: accessPoints.filter((ap) => ap.status === 'warning').length,
    offline: accessPoints.filter((ap) => ap.status === 'offline').length,
  };

  const clientsPct = totalCapacity > 0 ? Math.round((totalClients / totalCapacity) * 100) : 0;

  const topAPs = [...accessPoints].sort((a, b) => b.connected_clients - a.connected_clients).slice(0, 5);
  const recentTickets = tickets.slice(0, 5);
  const studentsById = new Map(students.map((s) => [s.id, s]));

  return (
    <div className="p-8">
      <PageHeader
        title="Dashboard"
        subtitle="Real-time overview of your hostel wifi network"
        onRefresh={refresh}
        refreshing={loading}
      />

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Access Points Online" value={`${onlineAPs}/${accessPoints.length}`} icon={Router} accent="bg-cyan-500/10 text-cyan-400" sub={`${apsByStatus.warning} warnings, ${apsByStatus.offline} offline`} />
        <StatCard label="Active Students" value={`${activeStudents}/${students.length}`} icon={Users} accent="bg-emerald-500/10 text-emerald-400" sub={`${students.filter(s=>s.wifi_status==='suspended').length} suspended, ${students.filter(s=>s.wifi_status==='pending').length} pending`} />
        <StatCard label="Connected Devices" value={connectedDevices} icon={Wifi} accent="bg-sky-500/10 text-sky-400" sub={`${activeSessions} active sessions`} />
        <StatCard label="Open Tickets" value={openTickets} icon={AlertTriangle} accent={urgentTickets > 0 ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'} sub={urgentTickets > 0 ? `${urgentTickets} urgent` : 'No urgent issues'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Network load */}
        <Card className="p-5 lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <Gauge className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Network Load</h3>
          </div>
          <div className="relative w-32 h-32 mx-auto mb-4">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgb(30,41,59)" strokeWidth="10" />
              <circle
                cx="60" cy="60" r="50" fill="none" stroke="url(#grad)" strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${(clientsPct / 100) * 314.16} 314.16`}
                className="transition-all duration-700"
              />
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-white">{clientsPct}%</span>
              <span className="text-xs text-slate-400">capacity</span>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-400">Connected clients</span><span className="text-white font-medium">{totalClients}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Total capacity</span><span className="text-white font-medium">{totalCapacity}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Data transferred</span><span className="text-white font-medium">{formatData(totalDataUsed)}</span></div>
          </div>
        </Card>

        {/* Top access points by load */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Busiest Access Points</h3>
          </div>
          <div className="space-y-3">
            {topAPs.map((ap) => {
              const pct = Math.round((ap.connected_clients / ap.max_clients) * 100);
              const barColor = pct > 90 ? 'bg-red-500' : pct > 75 ? 'bg-amber-500' : 'bg-cyan-500';
              return (
                <div key={ap.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Signal className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-sm text-slate-200 font-medium">{ap.name}</span>
                      <span className="text-xs text-slate-500">{ap.location}</span>
                    </div>
                    <span className="text-sm text-slate-300 font-medium">{ap.connected_clients}/{ap.max_clients}</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* AP status summary */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Router className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Access Point Status</h3>
          </div>
          <div className="space-y-2">
            {accessPoints.map((ap) => (
              <div key={ap.id} className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0">
                <div className="flex items-center gap-3">
                  <StatusBadge status={ap.status} />
                  <div>
                    <p className="text-sm text-slate-200 font-medium">{ap.name}</p>
                    <p className="text-xs text-slate-500">{ap.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-300 font-medium">{ap.connected_clients} clients</p>
                  <p className="text-xs text-slate-500">Seen {formatTimeAgo(ap.last_seen)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent tickets */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Recent Support Tickets</h3>
          </div>
          <div className="space-y-2">
            {recentTickets.map((t) => {
              const student = studentsById.get(t.student_id);
              return (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-200 font-medium truncate">{t.subject}</p>
                    <p className="text-xs text-slate-500">{student?.full_name ?? 'Unknown'} · Room {student?.room_number ?? '?'}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <PriorityBadge priority={t.priority} />
                    <StatusBadge status={t.status} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
