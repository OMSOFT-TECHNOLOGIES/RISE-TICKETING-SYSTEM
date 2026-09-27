import React from 'react';
import { CalendarDays, Sparkles } from 'lucide-react';
import { Badge } from '../ui/badge';
import { greetingForHour } from './dashboardUtils';
import type { DashboardLayout } from './dashboardProfile';

type DashboardHeroProps = {
  fullName?: string;
  eyebrow: string;
  subtitle: string;
  layout: DashboardLayout;
  statsError?: string | null;
  highlight?: { label: string; value: string | number } | null;
};

const layoutBadge: Record<DashboardLayout, string> = {
  executive: 'Executive view',
  station: 'Station ops',
  safety: 'Safety desk',
  claims: 'Claims desk',
  general: 'Operations',
};

export function DashboardHero({
  fullName,
  eyebrow,
  subtitle,
  layout,
  statsError,
  highlight,
}: DashboardHeroProps) {
  const greeting = greetingForHour(new Date().getHours());
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <section className="rise-dashboard-hero relative overflow-hidden rounded-2xl border shadow-sm">
      <div className="rise-dashboard-hero-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative px-5 py-5 sm:px-7 sm:py-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                {eyebrow}
              </span>
              <span className="text-border hidden sm:inline">/</span>
              <Badge variant="secondary" className="font-normal text-[10px] uppercase tracking-wide">
                {layoutBadge[layout]}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{greeting}</p>
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight truncate mt-0.5">
                {fullName ?? 'Welcome back'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{subtitle}</p>
            </div>
            {statsError ? (
              <p className="text-xs text-destructive rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
                {statsError}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 sm:items-end shrink-0 w-full lg:w-auto">
            <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              {today}
            </div>
            {highlight ? (
              <div className="rounded-xl border bg-background/70 backdrop-blur px-4 py-3 text-left sm:text-right w-full sm:w-auto">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                  {highlight.label}
                </p>
                <p className="text-2xl font-semibold tabular-nums tracking-tight">{highlight.value}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
