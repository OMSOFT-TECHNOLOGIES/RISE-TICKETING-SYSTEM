import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../ui/utils';

export function userFieldClass(hasError?: boolean) {
  return cn(
    'h-10 bg-background border shadow-sm text-foreground',
    hasError
      ? 'border-destructive focus-visible:ring-destructive/30'
      : 'border-input focus-visible:ring-ring/40'
  );
}

/** @deprecated use userFieldClass(hasError) */
export const userFieldInputClass = userFieldClass(false);

export function UserFormSection({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3">
        {Icon ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/35">
            <Icon className="h-4 w-4" strokeWidth={2.25} />
          </span>
        ) : null}
        <div className="min-w-0 pt-0.5">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
          {description ? (
            <p className="text-xs text-foreground/70 mt-0.5 leading-relaxed">{description}</p>
          ) : null}
        </div>
      </div>
      <div className={cn('space-y-4', Icon ? 'sm:pl-12' : '')}>{children}</div>
    </section>
  );
}

export function UserFieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-2 p-2 rounded-md bg-destructive/10 border border-destructive/30">
      <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
      <p className="text-sm text-destructive font-medium">{message}</p>
    </div>
  );
}

export function UserFormHint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-foreground/65 leading-relaxed">{children}</p>;
}
