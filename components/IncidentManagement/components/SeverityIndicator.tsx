import React from 'react';
import { cn } from '../../ui/utils';
import { getSeverityStyles } from '../utils';

interface SeverityIndicatorProps {
  severity: string;
  showLabel?: boolean;
  className?: string;
}

export function SeverityIndicator({ severity, showLabel = true, className }: SeverityIndicatorProps) {
  const styles = getSeverityStyles(severity);

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span
        className={cn(
          'h-2 w-2 rounded-full ring-4',
          styles.dot,
          styles.ring,
          severity === 'critical' && 'animate-pulse'
        )}
      />
      {showLabel && (
        <span className={cn('text-xs font-medium capitalize', styles.text)}>{severity}</span>
      )}
    </span>
  );
}
