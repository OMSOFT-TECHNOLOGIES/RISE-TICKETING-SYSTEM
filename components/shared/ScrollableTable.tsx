import React from 'react';
import { cn } from '../ui/utils';

type ScrollableTableProps = {
  children: React.ReactNode;
  /** Tailwind max-height class, e.g. max-h-[640px] */
  maxHeightClass?: string;
  className?: string;
  /** Minimum width for horizontal scroll on wide tables */
  minWidthClass?: string;
};

/**
 * Vertical scroll + sticky header for data tables. Wrap the shadcn `Table` tree.
 */
export function ScrollableTable({
  children,
  maxHeightClass = 'max-h-[min(70vh,640px)]',
  className,
  minWidthClass = 'min-w-[720px]',
}: ScrollableTableProps) {
  return (
    <div
      className={cn(
        'rise-table-scroll rounded-xl border bg-card overflow-hidden shadow-sm',
        className
      )}
    >
      <div className={cn('overflow-auto overscroll-contain', maxHeightClass)}>
        <div className={cn(minWidthClass, '[&_[data-slot=table-container]]:overflow-visible')}>
          {children}
        </div>
      </div>
    </div>
  );
}
