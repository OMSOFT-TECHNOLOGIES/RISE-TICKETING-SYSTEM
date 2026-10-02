import React, { useMemo } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { NAV_SECTIONS, type NavItem } from '../config/navigation';
import { canViewNavItem } from '../utils/navAccess';
import { usePageAction } from '../context/PageActionContext';
import { resolveDashboardLayout } from './dashboardProfile';
import { cn } from '../ui/utils';

const SKIP_PAGES = new Set(['dashboard', 'new-trip', 'new-passenger', 'settings']);

const MODULE_BLURB: Partial<Record<string, string>> = {
  stations: 'Terminals, regions, and districts',
  unions: 'Transport unions and membership',
  vehicles: 'Fleet registration and status',
  drivers: 'Licenses, assignments, compliance',
  trips: 'Schedules, routes, and manifests',
  passengers: 'Bookings, seats, and e-tickets',
  incidents: 'Report, track, and coordinate response',
  'incident-claims': 'Investigator and hospital workflows',
  'death-traps': 'Hazard reports and road safety',
  'accident-analysis': 'Trends, hotspots, and registry',
  reports: 'Operational analytics and exports',
  revenue: 'Collections and financial KPIs',
  accounts: 'Claims payments and settlements',
  tickets: 'Passenger ticket lookup',
  'ratings-complaints': 'Feedback and service quality',
  users: 'Roles, access, and assignments',
};

type WorkspaceModule = NavItem & { sectionTitle: string };

function WorkspaceModuleCard({
  mod,
  prominent = false,
  onOpen,
}: {
  mod: WorkspaceModule;
  prominent?: boolean;
  onOpen: () => void;
}) {
  const blurb = MODULE_BLURB[mod.id] ?? mod.sectionTitle;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'group relative flex flex-col gap-3 rounded-xl border text-left overflow-hidden',
        'bg-gradient-to-br from-card to-muted/25',
        'ring-1 ring-border/60 shadow-sm',
        'transition-all duration-200',
        'hover:shadow-md hover:ring-primary/30 hover:-translate-y-0.5',
        prominent ? 'p-4 min-h-[112px]' : 'p-3.5 min-h-[100px]'
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            'flex items-center justify-center rounded-xl ring-1 ring-border/70',
            'bg-background/90 text-primary shadow-sm',
            prominent ? 'h-11 w-11' : 'h-10 w-10'
          )}
        >
          <mod.icon className={prominent ? 'h-5 w-5' : 'h-4 w-4'} strokeWidth={2} />
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/5 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn('font-semibold text-foreground truncate', prominent ? 'text-sm' : 'text-sm')}>
          {mod.title}
        </p>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{blurb}</p>
      </div>
    </button>
  );
}

export function DashboardWorkspace() {
  const { user, hasPermission, isSuperAdmin } = useAuth();
  const { navigateToPage } = usePageAction();
  const layout = resolveDashboardLayout(user?.role);
  const isExecutive = layout === 'executive';

  const sections = useMemo(() => {
    return NAV_SECTIONS.map((section) => ({
      key: section.section,
      title: section.title,
      items: section.items
        .filter((item) => !SKIP_PAGES.has(item.id) && !item.aliasOf)
        .filter(
          (item) => isSuperAdmin() || canViewNavItem(item, hasPermission, user?.role)
        )
        .map((item) => ({ ...item, sectionTitle: section.title })),
    })).filter((section) => section.items.length > 0);
  }, [hasPermission, isSuperAdmin, user?.role]);

  const flatModules = useMemo(
    () => sections.flatMap((s) => s.items),
    [sections]
  );

  if (flatModules.length === 0) return null;

  return (
    <section className="rounded-2xl border bg-card/90 backdrop-blur-sm shadow-sm overflow-hidden ring-1 ring-border/50">
      <header className="border-b border-border/80 px-5 py-4 sm:px-6 sm:py-5 bg-muted/20">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-base font-semibold tracking-tight">
              {isExecutive ? 'Command center' : 'Your workspace'}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5 max-w-xl">
              {isExecutive
                ? 'Full module directory for national operations — same access as the sidebar, grouped by function.'
                : 'Modules available for your role.'}
            </p>
          </div>
          <p className="text-xs font-medium text-muted-foreground tabular-nums shrink-0">
            {flatModules.length} module{flatModules.length === 1 ? '' : 's'}
          </p>
        </div>
      </header>

      {isExecutive ? (
        <div className="p-5 sm:p-6 space-y-8">
          {sections.map((section) => (
            <div key={section.key}>
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                <span className="h-px flex-1 max-w-[2rem] bg-border" />
                {section.title}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {section.items.map((mod) => (
                  <WorkspaceModuleCard
                    key={mod.id}
                    mod={mod}
                    prominent
                    onOpen={() => navigateToPage(mod.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {flatModules.slice(0, 12).map((mod) => (
            <WorkspaceModuleCard
              key={mod.id}
              mod={mod}
              onOpen={() => navigateToPage(mod.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
