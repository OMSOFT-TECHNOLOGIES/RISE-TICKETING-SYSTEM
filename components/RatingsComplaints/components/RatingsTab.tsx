import React from 'react';
import { Download, Search } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
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
  loading = false,
}: RatingsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="ratings-search" className="text-xs uppercase tracking-wide text-muted-foreground">
            Search Ratings
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="ratings-search"
              placeholder="Search by passenger, route, or ticket..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ search: e.target.value })}
              className="pl-10 bg-background"
            />
          </div>
        </div>
        <Button onClick={onExport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      <div className="rounded-lg border bg-background overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h3 className="text-sm font-semibold">Ratings Registry</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {pagination?.totalItems ?? ratings.length} rating
            {(pagination?.totalItems ?? ratings.length) !== 1 ? 's' : ''} recorded
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs uppercase tracking-wide">Passenger</TableHead>
              <TableHead className="text-xs uppercase tracking-wide">Route</TableHead>
              <TableHead className="text-xs uppercase tracking-wide">Vehicle</TableHead>
              <TableHead className="text-xs uppercase tracking-wide">Driver</TableHead>
              <TableHead className="text-xs uppercase tracking-wide">Rating</TableHead>
              <TableHead className="text-xs uppercase tracking-wide">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ratings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No ratings match your search.
                </TableCell>
              </TableRow>
            ) : (
              ratings.map((rating) => (
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
                  <TableCell className="text-sm">{formatFeedbackDate(rating.ratingDate)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {onPageChange ? (
          <TablePagination
            page={page}
            pagination={pagination}
            onPageChange={onPageChange}
            loading={loading}
            itemLabel="ratings"
            className="px-5"
          />
        ) : null}
      </div>
    </div>
  );
}
