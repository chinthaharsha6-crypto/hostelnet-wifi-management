import { Wifi, Router, Users, Activity, Ticket as TicketIcon, LayoutDashboard, LogOut } from 'lucide-react';

export type ViewKey = 'dashboard' | 'access-points' | 'students' | 'sessions' | 'tickets';

const items: { key: ViewKey; label: string; icon: typeof Wifi }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'access-points', label: 'Access Points', icon: Router },
  { key: 'students', label: 'Students', icon: Users },
  { key: 'sessions', label: 'Sessions', icon: Activity },
  { key: 'tickets', label: 'Support Tickets', icon: TicketIcon },
];

export default function Sidebar({
  view,
  onChange,
  userEmail,
  userInitials,
  onSignOut,
}: {
  view: ViewKey;
  onChange: (v: ViewKey) => void;
  userEmail: string;
  userInitials: string;
  onSignOut: () => void;
}) {
  return (
    <aside className="w-64 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0">
      <div className="px-6 py-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Wifi className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">HostelNet</h1>
            <p className="text-xs text-slate-400">Wifi Management</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              view === key
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            <Icon className="w-4.5 h-4.5" strokeWidth={2} />
            {label}
          </button>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-200">
            {userInitials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-300 truncate">{userEmail}</p>
            <p className="text-xs text-slate-500">Admin</p>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800/50 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
