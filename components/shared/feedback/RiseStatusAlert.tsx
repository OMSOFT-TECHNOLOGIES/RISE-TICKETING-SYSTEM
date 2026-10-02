import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../../ui/alert';
import { Button } from '../../ui/button';
import { cn } from '../../ui/utils';

export type RiseStatusAlertType = 'success' | 'error' | 'warning' | 'info';

const config: Record<
  RiseStatusAlertType,
  {
    icon: React.ComponentType<{ className?: string }>;
    variant: 'default' | 'destructive';
    className: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    variant: 'default',
    className: 'border-green-500/80 bg-green-50 text-green-950 dark:bg-green-950/40 dark:text-green-50',
  },
  error: {
    icon: AlertCircle,
    variant: 'destructive',
    className: '',
  },
  warning: {
    icon: AlertTriangle,
    variant: 'default',
    className: 'border-amber-500/80 bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:text-amber-50',
  },
  info: {
    icon: Info,
    variant: 'default',
    className: 'border-[#193cb8]/50 bg-blue-50 text-blue-950 dark:bg-blue-950/40 dark:text-blue-50',
  },
};

export type RiseStatusAlertProps = {
  type?: RiseStatusAlertType;
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
};

export function RiseStatusAlert({
  type = 'info',
  title,
  children,
  onDismiss,
  className,
}: RiseStatusAlertProps) {
  const { icon: Icon, variant, className: toneClass } = config[type];

  return (
    <Alert variant={variant} className={cn('rounded-xl', toneClass, className)}>
      <Icon className="h-4 w-4" />
      <div className="flex-1 min-w-0">
        {title ? (
          <AlertTitle className="flex items-start justify-between gap-2">
            <span>{title}</span>
            {onDismiss ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto p-1 shrink-0 hover:bg-transparent"
                onClick={onDismiss}
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </Button>
            ) : null}
          </AlertTitle>
        ) : null}
        <AlertDescription className={title ? undefined : 'flex items-start justify-between gap-2'}>
          <span>{children}</span>
          {!title && onDismiss ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto p-1 shrink-0 hover:bg-transparent"
              onClick={onDismiss}
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </AlertDescription>
      </div>
    </Alert>
  );
}
