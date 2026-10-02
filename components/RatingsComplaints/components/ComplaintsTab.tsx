import React from 'react';
import { Download, Eye, MessageSquare, Reply, Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { ScrollableTable } from '../../shared/ScrollableTable';
import { COMPLAINT_CATEGORIES } from '../constants';
import type { ListPagination } from '../../utils/api/client';
import type { Complaint, ComplaintFilters } from '../types';
import { TablePagination } from '../../shared/TablePagination';
import { formatFeedbackDate, getCategoryLabel } from '../utils';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';

interface ComplaintsTabProps {
  complaints: Complaint[];
  filters: ComplaintFilters;
  onFiltersChange: (updates: Partial<ComplaintFilters>) => void;
  onViewComplaint: (complaint: Complaint) => void;
  onExport: () => void;
  page?: number;
  pagination?: ListPagination | null;
  onPageChange?: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  loading?: boolean;
}

export function ComplaintsTab({
  complaints,
  filters,
  onFiltersChange,
  onViewComplaint,
  onExport,
  page = 1,
  pagination = null,
  onPageChange,
  pageSize,
  onPageSizeChange,
  loading = false,
}: ComplaintsTabProps) {
  const total = pagination?.totalItems ?? complaints.length;
  const hasActiveFilters =
    filters.status !== 'all' ||
    filters.priority !== 'all' ||
    filters.category !== 'all' ||
    Boolean(filters.search.trim());

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="complaints-search"
            placeholder="Passenger, route, description…"
            value={filters.search}
            onChange={(e) => onFiltersChange({ search: e.target.value })}
            className="pl-9 h-10 bg-background/80"
          />
        </div>
        <Select value={filters.status} onValueChange={(v) => onFiltersChange({ status: v })}>
          <SelectTrigger className="h-10 w-full sm:w-[160px] bg-background/80">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.priority} onValueChange={(v) => onFiltersChange({ priority: v })}>
          <SelectTrigger className="h-10 w-full sm:w-[140px] bg-background/80">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priority</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.category} onValueChange={(v) => onFiltersChange({ category: v })}>
          <SelectTrigger className="h-10 w-full sm:w-[180px] bg-background/80">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {COMPLAINT_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasActiveFilters ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-10 text-muted-foreground"
            onClick={() =>
              onFiltersChange({
                search: '',
                status: 'all',
                priority: 'all',
                category: 'all',
              })
            }
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
        {total} complaint{total === 1 ? '' : 's'} matching filters · open a row to respond
      </p>

      <div className={loading ? 'opacity-60 pointer-events-none transition-opacity' : ''}>
        {complaints.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center rounded-xl border border-dashed border-border/60 bg-muted/20">
            <MessageSquare className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium">No complaints match your filters</p>
            <p className="text-xs text-muted-foreground mt-1">Adjust filters or export for offline review.</p>
          </div>
        ) : (
          <ScrollableTable
            className="rounded-xl ring-1 ring-border/50 border border-border/60"
            maxHeightClass="max-h-[min(70vh,560px)]"
            minWidthClass="min-w-[960px]"
          >
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Passenger</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {complaints.map((complaint) => (
                  <TableRow key={complaint.id} className="group">
                    <TableCell>
                      <p className="font-medium text-sm">{complaint.passengerName}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {complaint.route}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm">{getCategoryLabel(complaint.category)}</TableCell>
                    <TableCell>
                      <PriorityBadge priority={complaint.priority} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={complaint.status} />
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {formatFeedbackDate(complaint.submittedDate)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="View complaint"
                          onClick={() => onViewComplaint(complaint)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {complaint.status !== 'resolved' ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label="Respond to complaint"
                            onClick={() => onViewComplaint(complaint)}
                          >
                            <Reply className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
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
          itemLabel="complaints"
          pageSize={pageSize}
          onPageSizeChange={onPageSizeChange}
          alwaysShow
        />
      ) : null}
    </div>
  );
}
