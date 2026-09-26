import React from 'react';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';
import type { ListPagination } from '../utils/api/client';

type TablePaginationProps = {
  page: number;
  pagination: ListPagination | null;
  onPageChange: (page: number) => void;
  loading?: boolean;
  itemLabel?: string;
  className?: string;
};

export function TablePagination({
  page,
  pagination,
  onPageChange,
  loading = false,
  itemLabel = 'items',
  className,
}: TablePaginationProps) {
  if (!pagination || pagination.totalPages <= 1) {
    return null;
  }

  const { totalItems, totalPages, limit } = pagination;
  const start = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalItems);

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t mt-4',
        className
      )}
    >
      <p className="text-sm text-muted-foreground">
        Showing {start}–{end} of {totalItems} {itemLabel}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1 || loading}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground tabular-nums px-1">
          Page {page} of {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages || loading}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
