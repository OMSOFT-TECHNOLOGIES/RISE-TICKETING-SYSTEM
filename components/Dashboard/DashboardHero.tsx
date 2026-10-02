import React from 'react';
import { CalendarDays, Sparkles } from 'lucide-react';
import { Badge } from '../ui/badge';
import { RiseStatusAlert } from '../shared/feedback';
import { greetingForHour } from './dashboardUtils';
import type { DashboardLayout } from './dashboardProfile';
import { cn } from '../ui/utils';

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
    <section className="rise-dashboard-hero relative overflow-hidden rounded-2xl border shadow-sm ring-1 ring-border/50">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-primary/70 to-primary/30" />
      <div className="rise-dashboard-hero-grid pointer-events-none absolute inset-0 opacity-50" />
      <div className="relative px-5 py-6 sm:px-8 sm:py-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-4 max-w-2xl pl-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                {eyebrow}
              </span>
              <Badge variant="outline" className="font-normal text-[10px] uppercase tracking-wide">
                {layoutBadge[layout]}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{greeting}</p>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight truncate mt-1">
                {fullName ?? 'Welcome back'}
              </h1>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-xl">{subtitle}</p>
            </div>
            {statsError ? (
              <RiseStatusAlert type="error" className="max-w-xl">
                {statsError}
              </RiseStatusAlert>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 sm:items-end shrink-0 w-full lg:w-auto">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/60 backdrop-blur px-3 py-1.5 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5 text-primary" />
              {today}
            </div>
            {highlight ? (
              <div
                className={cn(
                  'rounded-2xl border bg-background/75 backdrop-blur-md px-5 py-4 text-left sm:text-right w-full sm:w-auto',
                  'shadow-sm ring-1 ring-primary/10'
                )}
              >
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                  {highlight.label}
                </p>
                <p className="text-3xl font-semibold tabular-nums tracking-tight text-foreground mt-0.5">
                  {highlight.value}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
