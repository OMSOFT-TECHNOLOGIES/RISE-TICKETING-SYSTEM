import React from 'react';
import { Download, Search, SlidersHorizontal, Star } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { ScrollableTable } from '../../shared/ScrollableTable';
import type { ListPagination } from '../../utils/api/client';
import type { Rating, RatingFilters } from '../types';
import { TablePagination } from '../../shared/TablePagination';
import { formatFeedbackDate } from '../utils';
import { StarRating } from './StarRating';

interface RatingsTabProps {
  ratings: Rating[];
  filters: RatingFilters;
  onFiltersChange: (updates: Partial<RatingFilters>) => void;
  onExport: () => void;
  page?: number;
  pagination?: ListPagination | null;
  onPageChange?: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  loading?: boolean;
}

export function RatingsTab({
  ratings,
  filters,
  onFiltersChange,
  onExport,
  page = 1,
  pagination = null,
  onPageChange,
  pageSize,
  onPageSizeChange,
  loading = false,
}: RatingsTabProps) {
  const total = pagination?.totalItems ?? ratings.length;
  const hasActiveFilters = Boolean(filters.search.trim());

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="ratings-search"
            placeholder="Passenger, route, ticket ID…"
            value={filters.search}
            onChange={(e) => onFiltersChange({ search: e.target.value })}
            className="pl-9 h-10 bg-background/80"
          />
        </div>
        {hasActiveFilters ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-10 text-muted-foreground"
            onClick={() => onFiltersChange({ search: '' })}
          >
            Clear
          </Button>
        ) : null}
        <Button onClick={onExport} variant="outline" size="sm" className="h-10 shrink-0">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
        {total} rating{total === 1 ? '' : 's'} in registry
      </p>

      <div className={loading ? 'opacity-60 pointer-events-none transition-opacity' : ''}>
        {ratings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center rounded-xl border border-dashed border-border/60 bg-muted/20">
            <Star className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium">No ratings match your search</p>
            <p className="text-xs text-muted-foreground mt-1">Try clearing filters or check back after trips complete.</p>
          </div>
        ) : (
          <ScrollableTable
            className="rounded-xl ring-1 ring-border/50 border border-border/60"
            maxHeightClass="max-h-[min(70vh,560px)]"
            minWidthClass="min-w-[920px]"
          >
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Passenger</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ratings.map((rating) => (
                  <TableRow key={rating.id}>
                    <TableCell>
                      <p className="font-medium text-sm">{rating.passengerName}</p>
                      <p className="text-xs text-muted-foreground font-mono">{rating.ticketId}</p>
                    </TableCell>
                    <TableCell className="text-sm max-w-[180px] truncate">{rating.route}</TableCell>
                    <TableCell className="text-sm font-mono">{rating.vehicle}</TableCell>
                    <TableCell className="text-sm">{rating.driver}</TableCell>
                    <TableCell>
                      <StarRating rating={rating.rating} />
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {formatFeedbackDate(rating.ratingDate)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollableTable>
        )}
      </div>

      {onPageChange ? (
        <TablePagination
          page={page}
          pagination={pagination}
          onPageChange={onPageChange}
          loading={loading}
          itemLabel="ratings"
          pageSize={pageSize}
          onPageSizeChange={onPageSizeChange}
          alwaysShow
        />
      ) : null}
    </div>
  );
}
