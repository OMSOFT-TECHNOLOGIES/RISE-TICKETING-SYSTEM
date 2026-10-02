import React from 'react';
import { cn } from '../ui/utils';
import { getHazardStatusStyles, hazardStatusLabel } from './hazardStatus';

type HazardStatusBadgeProps = {
  status: string;
  className?: string;
};

export function HazardStatusBadge({ status, className }: HazardStatusBadgeProps) {
  const styles = getHazardStatusStyles(status);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        styles.bg,
        styles.text,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', styles.dot)} aria-hidden />
      {hazardStatusLabel(status)}
    </span>
  );
}
