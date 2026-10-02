import React from 'react';
import { AlertTriangle, Bus, Calendar, Route, Users } from 'lucide-react';
import type { ActivityItem } from './dashboardUtils';
import { cn } from '../ui/utils';

function ActivityIcon({ type }: { type: string }) {
  const base = 'flex h-8 w-8 items-center justify-center rounded-full shrink-0';
  if (type === 'incident') {
    return (
      <div className={cn(base, 'bg-destructive/10 text-destructive')}>
        <AlertTriangle className="h-4 w-4" />
      </div>
    );
  }
  if (type === 'trip') {
    return (
      <div className={cn(base, 'bg-primary/10 text-primary')}>
        <Route className="h-4 w-4" />
      </div>
    );
  }
  if (type === 'driver') {
    return (
      <div className={cn(base, 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400')}>
        <Users className="h-4 w-4" />
      </div>
    );
  }
  if (type === 'maintenance') {
    return (
      <div className={cn(base, 'bg-amber-500/10 text-amber-600 dark:text-amber-400')}>
        <Bus className="h-4 w-4" />
      </div>
    );
  }
  return (
    <div className={cn(base, 'bg-muted text-muted-foreground')}>
      <Calendar className="h-4 w-4" />
    </div>
  );
}

export function DashboardActivityFeed({ activities }: { activities: ActivityItem[] }) {
  return (
    <div className="rounded-2xl border bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden h-full flex flex-col ring-1 ring-border/50">
      <div className="border-b border-border/80 px-5 py-4">
        <h3 className="text-sm font-semibold">Recent activity</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Latest updates across your scope</p>
      </div>
      <div className="p-4 flex-1 overflow-y-auto max-h-[320px]">
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
        ) : (
          <ul className="space-y-3">
            {activities.map((activity) => (
              <li key={activity.id} className="flex gap-3">
                <ActivityIcon type={activity.type} />
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-sm leading-snug">{activity.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
