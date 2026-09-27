export type ClaimStatus =
  | 'awaiting_investigator'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'paid';

export function claimStatusLabel(status: string): string {
  if (status === 'awaiting_investigator') return 'Awaiting investigator';
  return status.replace(/_/g, ' ');
}

/** High-contrast badges for light (day) and dark themes — avoids low-contrast yellow. */
export function claimStatusBadgeClass(status: string): string {
  switch (status) {
    case 'awaiting_investigator':
      return 'border-violet-400 bg-violet-100 text-violet-950 dark:border-violet-600 dark:bg-violet-950/60 dark:text-violet-100';
    case 'pending':
      return 'border-orange-400 bg-orange-100 text-orange-950 dark:border-orange-600 dark:bg-orange-950/60 dark:text-orange-100';
    case 'approved':
      return 'border-emerald-400 bg-emerald-100 text-emerald-950 dark:border-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-100';
    case 'rejected':
      return 'border-red-400 bg-red-100 text-red-950 dark:border-red-600 dark:bg-red-950/60 dark:text-red-100';
    case 'paid':
      return 'border-sky-400 bg-sky-100 text-sky-950 dark:border-sky-600 dark:bg-sky-950/60 dark:text-sky-100';
    default:
      return 'border-border bg-muted text-foreground';
  }
}
