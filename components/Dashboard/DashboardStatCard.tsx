import React from 'react';
import { cn } from '../ui/utils';

type DashboardStatCardProps = {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  accent?: 'blue' | 'emerald' | 'violet' | 'amber';
  hint?: string;
};

const accentStyles = {
  blue: {
    ring: 'ring-primary/20',
    orb: 'bg-primary/25',
    iconWrap:
      'bg-gradient-to-br from-primary to-[#0f2a6e] text-white shadow-lg shadow-primary/25',
    dot: 'bg-primary',
    label: 'text-primary/90 dark:text-primary',
  },
  emerald: {
    ring: 'ring-emerald-500/25',
    orb: 'bg-emerald-400/30',
    iconWrap:
      'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-500/20',
    dot: 'bg-emerald-500',
    label: 'text-emerald-700 dark:text-emerald-400',
  },
  violet: {
    ring: 'ring-violet-500/25',
    orb: 'bg-violet-400/30',
    iconWrap:
      'bg-gradient-to-br from-violet-500 to-violet-700 text-white shadow-lg shadow-violet-500/20',
    dot: 'bg-violet-500',
    label: 'text-violet-700 dark:text-violet-400',
  },
  amber: {
    ring: 'ring-amber-500/25',
    orb: 'bg-amber-400/35',
    iconWrap:
      'bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-lg shadow-amber-500/20',
    dot: 'bg-amber-500',
    label: 'text-amber-700 dark:text-amber-400',
  },
};

export function DashboardStatCard({
  title,
  value,
  icon: Icon,
  accent = 'blue',
  hint,
}: DashboardStatCardProps) {
  const styles = accentStyles[accent];

  return (
    <article
      className={cn(
        'rise-kpi-card group relative isolate',
        'rounded-[1.25rem] p-px',
        'bg-gradient-to-br from-border/80 via-border/40 to-transparent',
        'transition-all duration-300',
        'hover:from-primary/25 hover:via-border/50 hover:shadow-lg hover:shadow-black/5',
        'dark:hover:shadow-black/20'
      )}
    >
      <div
        className={cn(
          'relative flex h-full min-h-[148px] flex-col overflow-hidden rounded-[calc(1.25rem-1px)]',
          'bg-card/95 backdrop-blur-md',
          'ring-1 ring-inset ring-white/10 dark:ring-white/5',
          styles.ring
        )}
      >
        <div
          className={cn(
            'pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full blur-3xl transition-opacity duration-300',
            'opacity-60 group-hover:opacity-90',
            styles.orb
          )}
          aria-hidden
        />
        <div className="rise-kpi-card-grid pointer-events-none absolute inset-0 opacity-[0.35]" aria-hidden />

        <div className="relative flex flex-1 flex-col justify-between gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <span
              className={cn(
                'inline-flex max-w-[70%] items-center rounded-md',
                'bg-muted/50 px-2 py-1',
                'text-[10px] font-semibold uppercase tracking-[0.12em] leading-tight',
                'text-muted-foreground'
              )}
            >
              {title}
            </span>
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                'transition-transform duration-300 group-hover:scale-105',
                styles.iconWrap
              )}
            >
              <Icon className="h-[1.125rem] w-[1.125rem]" strokeWidth={2.25} />
            </div>
          </div>

          <div className="min-w-0 space-y-2">
            <p
              className={cn(
                'text-[1.75rem] sm:text-[1.875rem] font-bold tracking-tight tabular-nums leading-none',
                'text-foreground'
              )}
            >
              {value}
            </p>
            {hint ? (
              <p className="flex items-start gap-2 text-xs text-muted-foreground leading-snug">
                <span
                  className={cn('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', styles.dot)}
                  aria-hidden
                />
                <span>{hint}</span>
              </p>
            ) : (
              <p className={cn('text-[10px] font-medium uppercase tracking-wider', styles.label)}>
                Live metric
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
