import type { DeathTrapStatus } from './types';

export function hazardStatusLabel(status: string): string {
  switch (status) {
    case 'reported':
      return 'Reported';
    case 'acknowledged':
      return 'Acknowledged';
    case 'in_progress':
      return 'In progress';
    case 'resolved':
      return 'Resolved';
    case 'escalated':
      return 'Escalated';
    default:
      return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

export function getHazardStatusStyles(status: string): {
  dot: string;
  text: string;
  bg: string;
} {
  switch (status as DeathTrapStatus) {
    case 'reported':
      return {
        dot: 'bg-primary',
        text: 'text-primary dark:text-primary',
        bg: 'border-primary/25 bg-primary/[0.07] dark:bg-primary/10 dark:border-primary/35',
      };
    case 'acknowledged':
      return {
        dot: 'bg-violet-600 dark:bg-violet-500',
        text: 'text-violet-900 dark:text-violet-200',
        bg: 'border-violet-300/80 bg-violet-50 dark:bg-violet-950/40 dark:border-violet-600/40',
      };
    case 'in_progress':
      return {
        dot: 'bg-amber-600 dark:bg-amber-500',
        text: 'text-amber-950 dark:text-amber-100',
        bg: 'border-amber-300/90 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-600/40',
      };
    case 'resolved':
      return {
        dot: 'bg-emerald-600 dark:bg-emerald-500',
        text: 'text-emerald-900 dark:text-emerald-200',
        bg: 'border-emerald-300/80 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-600/40',
      };
    case 'escalated':
      return {
        dot: 'bg-red-600 dark:bg-red-500',
        text: 'text-red-900 dark:text-red-200',
        bg: 'border-red-300/80 bg-red-50 dark:bg-red-950/40 dark:border-red-600/40',
      };
    default:
      return {
        dot: 'bg-muted-foreground/60',
        text: 'text-muted-foreground',
        bg: 'border-border/60 bg-muted/40',
      };
  }
}
