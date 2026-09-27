import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { NAV_SECTIONS } from '../config/navigation';
import { canViewNavItem } from '../utils/navAccess';
import { usePageAction } from '../context/PageActionContext';
import { cn } from '../ui/utils';

const SKIP_PAGES = new Set(['dashboard', 'new-trip', 'new-passenger', 'settings']);

export function DashboardWorkspace() {
  const { user, hasPermission, isSuperAdmin } = useAuth();
  const { navigateToPage } = usePageAction();

  const modules = NAV_SECTIONS.flatMap((section) =>
    section.items
      .filter((item) => !SKIP_PAGES.has(item.id) && !item.aliasOf)
      .filter(
        (item) => isSuperAdmin() || canViewNavItem(item, hasPermission, user?.role)
      )
      .map((item) => ({ ...item, sectionTitle: section.title }))
  ).slice(0, 8);

  if (modules.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="border-b px-5 py-3.5">
        <h3 className="text-sm font-semibold">Your workspace</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Modules available for your role — same as the sidebar
        </p>
      </div>
      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
        {modules.map((mod) => (
          <button
            key={mod.id}
            type="button"
            onClick={() => navigateToPage(mod.id)}
            className={cn(
              'group flex flex-col gap-3 rounded-lg border bg-muted/20 px-3 py-3 text-left',
              'hover:bg-primary/5 hover:border-primary/25 transition-colors'
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-background border border-border/70 text-primary">
                <mod.icon className="h-4 w-4" />
              </span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{mod.title}</p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5 truncate">
                {mod.sectionTitle}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
