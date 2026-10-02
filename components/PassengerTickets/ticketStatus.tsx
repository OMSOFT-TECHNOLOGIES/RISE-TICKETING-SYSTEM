import React from 'react';
import { cn } from '../ui/utils';

const ticketStatusStyles: Record<
  string,
  { dot: string; text: string; bg: string; label: string }
> = {
  confirmed: {
    dot: 'bg-emerald-600',
    text: 'text-emerald-900 dark:text-emerald-200',
    bg: 'border-emerald-300/80 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-600/40',
    label: 'Confirmed',
  },
  pending: {
    dot: 'bg-amber-600',
    text: 'text-amber-950 dark:text-amber-100',
    bg: 'border-amber-300/90 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-600/40',
    label: 'Pending',
  },
  used: {
    dot: 'bg-muted-foreground/70',
    text: 'text-foreground/80',
    bg: 'border-border/80 bg-muted/50',
    label: 'Used',
  },
  cancelled: {
    dot: 'bg-red-600',
    text: 'text-red-900 dark:text-red-200',
    bg: 'border-red-300/80 bg-red-50 dark:bg-red-950/40 dark:border-red-600/40',
    label: 'Cancelled',
  },
};

export function TicketStatusBadge({ status }: { status: string }) {
  const styles =
    ticketStatusStyles[status] ?? {
      dot: 'bg-muted-foreground/60',
      text: 'text-muted-foreground',
      bg: 'border-border/60 bg-muted/40',
      label: status.replace(/_/g, ' '),
    };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        styles.bg,
        styles.text
      )}
    >
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', styles.dot)} aria-hidden />
      {styles.label}
    </span>
  );
}

export function SmsStatusBadge({ status }: { status?: string }) {
  if (status === 'sent') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/80 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
        SMS sent
      </span>
    );
  }
  if (status === 'failed') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-300/80 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-900 dark:bg-red-950/40 dark:text-red-200">
        SMS failed
      </span>
    );
  }
  return null;
}
