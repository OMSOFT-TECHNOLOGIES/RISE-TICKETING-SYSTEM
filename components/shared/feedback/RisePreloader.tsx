import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../ui/utils';
import { RiseLogo } from '../../layout/RiseLogo';

export type RisePreloaderVariant = 'fullscreen' | 'page' | 'inline' | 'overlay';

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-7 w-7',
  lg: 'h-9 w-9',
} as const;

export type RisePreloaderProps = {
  variant?: RisePreloaderVariant;
  label?: string;
  size?: keyof typeof sizeMap;
  className?: string;
  /** Shown on fullscreen variant only */
  showBrand?: boolean;
};

export function RisePreloader({
  variant = 'inline',
  label,
  size = 'md',
  className,
  showBrand = true,
}: RisePreloaderProps) {
  const spinner = (
    <Loader2
      className={cn(sizeMap[size], 'animate-spin text-primary', variant === 'fullscreen' && 'text-white')}
      aria-hidden
    />
  );

  const labelEl = label ? (
    <p
      className={cn(
        'text-sm',
        variant === 'fullscreen' ? 'text-white/80' : 'text-muted-foreground'
      )}
    >
      {label}
    </p>
  ) : null;

  if (variant === 'inline') {
    return (
      <div className={cn('inline-flex items-center gap-2', className)} role="status" aria-live="polite">
        {spinner}
        {labelEl}
      </div>
    );
  }

  if (variant === 'overlay') {
    return (
      <div
        className={cn(
          'absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-2xl bg-background/80 backdrop-blur-sm',
          className
        )}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        {spinner}
        {labelEl}
      </div>
    );
  }

  if (variant === 'page') {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center min-h-[280px] p-6',
          className
        )}
        role="status"
        aria-live="polite"
      >
        <div className="rise-preloader-ring mb-4">{spinner}</div>
        {labelEl}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'min-h-screen flex items-center justify-center rise-auth-mesh p-6',
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="text-center space-y-4 rounded-2xl bg-white/10 backdrop-blur px-8 py-8 ring-1 ring-white/20 max-w-sm w-full">
        {showBrand ? (
          <RiseLogo variant="onBrand" className="justify-center" compact />
        ) : null}
        <div className="flex flex-col items-center gap-3 pt-2">
          <div className="rise-preloader-ring">{spinner}</div>
          {labelEl ?? (
            <p className="text-sm text-white/80">Loading…</p>
          )}
        </div>
      </div>
    </div>
  );
}
