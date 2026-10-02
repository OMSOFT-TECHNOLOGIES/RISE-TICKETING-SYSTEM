import React from 'react';
import { cn } from '../ui/utils';
import { SEVERITY_OPTIONS } from './constants';

type HazardSeverityBadgeProps = {
  severity: string;
  className?: string;
};

export function HazardSeverityBadge({ severity, className }: HazardSeverityBadgeProps) {
  const option = SEVERITY_OPTIONS.find((s) => s.value === severity);

  if (!option) {
    return (
      <span className="text-xs text-muted-foreground capitalize">{severity}</span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
        option.bg,
        option.text,
        'dark:border-opacity-40',
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', option.dot)} aria-hidden />
      {option.label}
    </span>
  );
}
