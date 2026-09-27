import React from 'react';
import { Shield } from 'lucide-react';
import { cn } from '../ui/utils';

type RiseLogoProps = {
  variant?: 'light' | 'dark' | 'onBrand';
  showTagline?: boolean;
  compact?: boolean;
  className?: string;
};

export function RiseLogo({
  variant = 'dark',
  showTagline = true,
  compact = false,
  className,
}: RiseLogoProps) {
  const titleClass =
    variant === 'onBrand'
      ? 'text-white'
      : variant === 'light'
        ? 'text-white'
        : 'text-foreground';
  const taglineClass =
    variant === 'onBrand' || variant === 'light'
      ? 'text-white/70'
      : 'text-muted-foreground';

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-xl shadow-lg',
          compact ? 'h-9 w-9' : 'h-10 w-10',
          variant === 'onBrand'
            ? 'bg-white/15 ring-1 ring-white/25 backdrop-blur-sm'
            : 'bg-gradient-to-br from-[#1e4fd8] to-[#0f2a6e] text-white'
        )}
      >
        <Shield className={cn(compact ? 'h-5 w-5' : 'h-5 w-5')} strokeWidth={2.25} />
      </div>
      {!compact && (
        <div className="min-w-0">
          <p className={cn('text-lg font-semibold tracking-tight leading-none', titleClass)}>
            RISE
          </p>
          {showTagline && (
            <p className={cn('text-xs mt-1 truncate', taglineClass)}>
              Road Incidents Support & Emergency
            </p>
          )}
        </div>
      )}
    </div>
  );
}
