import React from 'react';
import { Badge } from '../ui/badge';
import { cn } from '../ui/utils';

export function DashboardSystemStatus({
  activeIncidents,
}: {
  activeIncidents: number;
}) {
  const items = [
    {
      title: 'All systems operational',
      detail: 'Last checked moments ago',
      badge: 'Online',
      tone: 'success' as const,
    },
    {
      title: `${activeIncidents} active incident${activeIncidents === 1 ? '' : 's'}`,
      detail: activeIncidents > 0 ? 'Requires attention' : 'No open incidents',
      badge: activeIncidents > 0 ? 'Attention' : 'Clear',
      tone: activeIncidents > 0 ? ('warning' as const) : ('neutral' as const),
    },
    {
      title: 'Database backup',
      detail: 'Last backup: 2 hours ago',
      badge: 'Scheduled',
      tone: 'info' as const,
    },
  ];

  const toneStyles = {
    success:
      'border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10',
    warning: 'border-amber-500/25 bg-amber-500/5 dark:bg-amber-500/10',
    neutral: 'border-border bg-muted/40',
    info: 'border-primary/20 bg-primary/5',
  };

  const badgeStyles = {
    success: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-0',
    warning: 'bg-amber-500/15 text-amber-800 dark:text-amber-200 border-0',
    neutral: '',
    info: 'bg-primary/10 text-primary border-0',
  };

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="border-b px-5 py-3.5">
        <h3 className="text-sm font-semibold">System status</h3>
      </div>
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        {items.map((item) => (
          <div
            key={item.title}
            className={cn('rounded-lg border p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', toneStyles[item.tone])}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
            </div>
            <Badge variant="secondary" className={cn('shrink-0 w-fit', badgeStyles[item.tone])}>
              {item.badge}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
