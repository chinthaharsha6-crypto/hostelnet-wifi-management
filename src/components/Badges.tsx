export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    online: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    offline: 'bg-red-500/10 text-red-400 border-red-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    suspended: 'bg-red-500/10 text-red-400 border-red-500/20',
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    connected: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    idle: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
    completed: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    dropped: 'bg-red-500/10 text-red-400 border-red-500/20',
    open: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    in_progress: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };
  const label = status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status] ?? styles.idle}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${styles[status]?.includes('emerald') ? 'bg-emerald-400' : styles[status]?.includes('red') ? 'bg-red-400' : styles[status]?.includes('amber') ? 'bg-amber-400' : styles[status]?.includes('sky') ? 'bg-sky-400' : 'bg-slate-400'}`} />
      {label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    low: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
    medium: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    high: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    urgent: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${styles[priority] ?? styles.low}`}>
      {priority}
    </span>
  );
}

export function PlanBadge({ plan }: { plan: string }) {
  const styles: Record<string, string> = {
    basic: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
    premium: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    unlimited: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${styles[plan] ?? styles.basic}`}>
      {plan}
    </span>
  );
}
