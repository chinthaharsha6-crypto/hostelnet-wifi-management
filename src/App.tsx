import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { AccessPoint, Student, Device, Session, Ticket } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import Login from '@/components/Login';
import Sidebar, { type ViewKey } from '@/components/Sidebar';
import Dashboard from '@/components/views/Dashboard';
import AccessPoints from '@/components/views/AccessPoints';
import Students from '@/components/views/Students';
import Sessions from '@/components/views/Sessions';
import Tickets from '@/components/views/Tickets';

export type DataLoader = {
  accessPoints: AccessPoint[];
  students: Student[];
  devices: Device[];
  sessions: Session[];
  tickets: Ticket[];
  loading: boolean;
  refresh: () => Promise<void>;
};

export default function App() {
  const { session, ready } = useAuth();
  const [view, setView] = useState<ViewKey>('dashboard');
  const [accessPoints, setAccessPoints] = useState<AccessPoint[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [apRes, stuRes, devRes, sessRes, tickRes] = await Promise.all([
      supabase.from('access_points').select('*').order('name'),
      supabase.from('students').select('*').order('room_number'),
      supabase.from('devices').select('*').order('device_name'),
      supabase.from('sessions').select('*').order('connected_at', { ascending: false }),
      supabase.from('tickets').select('*').order('created_at', { ascending: false }),
    ]);
    setAccessPoints(apRes.data ?? []);
    setStudents(stuRes.data ?? []);
    setDevices(devRes.data ?? []);
    setSessions(sessRes.data ?? []);
    setTickets(tickRes.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (session) refresh();
  }, [session, refresh]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  const data: DataLoader = { accessPoints, students, devices, sessions, tickets, loading, refresh };
  const userEmail = session.user.email ?? '';
  const userInitials = (session.user.user_metadata?.full_name as string | undefined)
    ?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() ?? userEmail.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar
        view={view}
        onChange={setView}
        userEmail={userEmail}
        userInitials={userInitials}
        onSignOut={() => supabase.auth.signOut()}
      />
      <main className="flex-1 overflow-auto">
        {view === 'dashboard' && <Dashboard data={data} />}
        {view === 'access-points' && <AccessPoints data={data} />}
        {view === 'students' && <Students data={data} />}
        {view === 'sessions' && <Sessions data={data} />}
        {view === 'tickets' && <Tickets data={data} />}
      </main>
    </div>
  );
}
