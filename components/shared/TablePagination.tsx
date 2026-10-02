import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { cn } from '../ui/utils';
import type { ListPagination } from '../utils/api/client';

/** Matches API default/max (`limit` max 100 per BACKEND_API_SPEC). */
export const TABLE_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

type TablePaginationProps = {
  page: number;
  pagination: ListPagination | null;
  onPageChange: (page: number) => void;
  loading?: boolean;
  itemLabel?: string;
  className?: string;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: readonly number[];
  /** Show footer even when everything fits on one page */
  alwaysShow?: boolean;
};

export function TablePagination({
  page,
  pagination,
  onPageChange,
  loading = false,
  itemLabel = 'items',
  className,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = TABLE_PAGE_SIZE_OPTIONS,
  alwaysShow = true,
}: TablePaginationProps) {
  if (!pagination) {
    return null;
  }

  const { totalItems, totalPages, limit } = pagination;
  const effectiveLimit = pageSize ?? limit;

  if (!alwaysShow && totalPages <= 1 && totalItems <= effectiveLimit) {
    return null;
  }

  const start = totalItems === 0 ? 0 : (page - 1) * effectiveLimit + 1;
  const end = Math.min(page * effectiveLimit, totalItems);

  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4 border-t mt-4',
        className
      )}
    >
      <p className="text-sm text-muted-foreground tabular-nums">
        {totalItems === 0
          ? `No ${itemLabel}`
          : `Showing ${start}–${end} of ${totalItems} ${itemLabel}`}
      </p>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {onPageSizeChange ? (
          <div className="flex items-center gap-2 mr-1">
            <label
              htmlFor="table-page-size"
              className="text-xs text-muted-foreground whitespace-nowrap"
            >
              Per page
            </label>
            <Select
              value={String(effectiveLimit)}
              onValueChange={(v) => onPageSizeChange(Number(v))}
              disabled={loading}
            >
              <SelectTrigger id="table-page-size" className="h-8 w-[76px] text-xs">
                <SelectValue placeholder="20" />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 hidden sm:inline-flex"
            disabled={page <= 1 || loading}
            onClick={() => onPageChange(1)}
            aria-label="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            disabled={page <= 1 || loading}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Previous</span>
          </Button>
          <span className="text-sm text-muted-foreground tabular-nums px-2 min-w-[7rem] text-center">
            Page {page} of {Math.max(totalPages, 1)}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            disabled={page >= totalPages || loading || totalItems === 0}
            onClick={() => onPageChange(page + 1)}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4 sm:ml-1" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 hidden sm:inline-flex"
            disabled={page >= totalPages || loading || totalItems === 0}
            onClick={() => onPageChange(totalPages)}
            aria-label="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
