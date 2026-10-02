export type ClaimStatus =
  | 'awaiting_investigator'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'paid';

export function claimStatusLabel(status: string): string {
  switch (status) {
    case 'awaiting_investigator':
      return 'Awaiting investigator';
    case 'pending':
      return 'Pending review';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    case 'paid':
      return 'Paid';
    default:
      return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

/** Subtle registry styling — dot + muted surface (readable in light and dark). */
export function getClaimStatusStyles(status: string): {
  dot: string;
  text: string;
  bg: string;
} {
  switch (status) {
    case 'awaiting_investigator':
      return {
        dot: 'bg-violet-500',
        text: 'text-violet-800 dark:text-violet-300',
        bg: 'border-violet-500/20 bg-violet-500/[0.07] dark:bg-violet-500/10 dark:border-violet-500/30',
      };
    case 'pending':
      return {
        dot: 'bg-amber-600 dark:bg-amber-500',
        text: 'text-amber-950 dark:text-amber-100',
        bg: 'border-amber-300/90 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-600/40',
      };
    case 'approved':
      return {
        dot: 'bg-emerald-500',
        text: 'text-emerald-800 dark:text-emerald-300',
        bg: 'border-emerald-500/20 bg-emerald-500/[0.07] dark:bg-emerald-500/10 dark:border-emerald-500/30',
      };
    case 'rejected':
      return {
        dot: 'bg-red-500',
        text: 'text-red-800 dark:text-red-300',
        bg: 'border-red-500/20 bg-red-500/[0.06] dark:bg-red-500/10 dark:border-red-500/30',
      };
    case 'paid':
      return {
        dot: 'bg-primary',
        text: 'text-foreground/90',
        bg: 'border-border/80 bg-muted/50 dark:bg-muted/30',
      };
    default:
      return {
        dot: 'bg-muted-foreground/60',
        text: 'text-muted-foreground',
        bg: 'border-border/60 bg-muted/40',
      };
  }
}

/** @deprecated Prefer ClaimStatusBadge / getClaimStatusStyles */
export function claimStatusBadgeClass(status: string): string {
  const s = getClaimStatusStyles(status);
  return `${s.bg} ${s.text}`;
}
