import React from 'react';
import { cn } from '../ui/utils';

type PageHeaderProps = {
  title: string;
  description?: string;
  titleAddon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, description, titleAddon, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between',
        className
      )}
    >
      <div className="space-y-1 min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-3 flex-wrap">
          {title}
          {titleAddon}
        </h1>
        {description ? (
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div> : null}
    </div>
  );
}
