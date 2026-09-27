import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { usePageAction } from '../context/PageActionContext';
import { cn } from '../ui/utils';
import { quickActionsForLayout, type DashboardLayout } from './dashboardProfile';

const toneClass = {
  primary: 'bg-primary/5 hover:bg-primary/10 text-primary',
  emerald: 'bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  amber: 'bg-amber-500/5 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400',
};

export function DashboardQuickActions({ layout }: { layout: DashboardLayout }) {
  const { navigateWithAction, navigateToPage } = usePageAction();
  const actions = quickActionsForLayout(layout);

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden h-full">
      <div className="border-b px-5 py-3.5">
        <h3 className="text-sm font-semibold">Quick actions</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Tasks matched to your role</p>
      </div>
      <div className="p-3 space-y-2">
        {actions.map((action) => (
          <button
            key={action.title}
            type="button"
            onClick={() => {
              if (action.page && action.action) {
                navigateWithAction(action.page, action.action);
              } else if (action.page) {
                navigateToPage(action.page);
              }
            }}
            className={cn(
              'w-full flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left transition-colors',
              toneClass[action.tone]
            )}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background/80 border border-border/60">
              <action.icon className="h-4 w-4" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-medium text-foreground">{action.title}</span>
              <span className="block text-xs text-muted-foreground truncate">
                {action.description}
              </span>
            </span>
            <ArrowUpRight className="h-4 w-4 shrink-0 opacity-50" />
          </button>
        ))}
      </div>
    </div>
  );
}
