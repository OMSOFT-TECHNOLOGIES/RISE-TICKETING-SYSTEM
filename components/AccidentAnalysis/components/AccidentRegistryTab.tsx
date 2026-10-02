import React from 'react';
import { Eye, Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import type { ListPagination } from '../../utils/api/client';
import type { Accident, AccidentFilters } from '../types';
import { TablePagination } from '../../shared/TablePagination';
import { ScrollableTable } from '../../shared/ScrollableTable';
import { formatAccidentDate } from '../utils';
import { SeverityBadge } from './SeverityBadge';
import { StatusBadge } from './StatusBadge';

interface AccidentRegistryTabProps {
  accidents: Accident[];
  totalMatching?: number;
  filters: AccidentFilters;
  onFiltersChange: (updates: Partial<AccidentFilters>) => void;
  onViewAccident: (accident: Accident) => void;
  page?: number;
  pagination?: ListPagination | null;
  onPageChange?: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
}

export function AccidentRegistryTab({
  accidents,
  totalMatching,
  filters,
  onFiltersChange,
  onViewAccident,
  page = 1,
  pagination = null,
  onPageChange,
  pageSize,
  onPageSizeChange,
}: AccidentRegistryTabProps) {
  const matchCount = totalMatching ?? accidents.length;
  const hasActiveFilters =
    filters.severity !== 'all' || filters.status !== 'all' || Boolean(filters.search.trim());

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="accident-search"
            placeholder="ID, location, driver, route…"
            value={filters.search}
            onChange={(e) => onFiltersChange({ search: e.target.value })}
            className="pl-9 h-10 bg-background/80"
          />
        </div>
        <Select value={filters.severity} onValueChange={(value) => onFiltersChange({ severity: value })}>
          <SelectTrigger className="w-full sm:w-[160px] h-10 bg-background/80">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All severity</SelectItem>
            <SelectItem value="minor">Minor</SelectItem>
            <SelectItem value="major">Major</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.status} onValueChange={(value) => onFiltersChange({ status: value })}>
          <SelectTrigger className="w-full sm:w-[180px] h-10 bg-background/80">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="investigated">Investigated</SelectItem>
            <SelectItem value="under_investigation">Under investigation</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        {hasActiveFilters ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-10 text-muted-foreground"
            onClick={() => onFiltersChange({ search: '', severity: 'all', status: 'all' })}
          >
            Clear
          </Button>
        ) : null}
      </div>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
        {matchCount} record{matchCount !== 1 ? 's' : ''} matching filters · open a row for the full case file
      </p>

      {accidents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center rounded-xl border border-dashed border-border/80 bg-muted/20">
          <p className="font-medium">No accidents match your filters</p>
          <p className="text-sm text-muted-foreground mt-1">Try clearing filters or reporting a new case from the header.</p>
        </div>
      ) : (
        <ScrollableTable
          className="rounded-xl ring-1 ring-border/50 border border-border/60"
          maxHeightClass="max-h-[min(65vh,520px)]"
          minWidthClass="min-w-[960px]"
        >
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-muted/30">
                <TableHead>Accident ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Casualties</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {accidents.map((accident) => (
                <TableRow key={accident.id} className="group">
                  <TableCell>
                    <p className="font-mono text-xs font-medium">{accident.id}</p>
                    {accident.incidentId ? (
                      <p className="text-xs text-muted-foreground">From {accident.incidentId}</p>
                    ) : null}
                    <p className="text-xs text-muted-foreground truncate max-w-[180px]">{accident.route}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{formatAccidentDate(accident.date)}</p>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <p className="text-sm truncate">{accident.location}</p>
                  </TableCell>
                  <TableCell>
                    <SeverityBadge severity={accident.severity} />
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-foreground">{accident.injuries} injured</p>
                    {accident.fatalities > 0 ? (
                      <p className="text-xs text-red-700 dark:text-red-400">{accident.fatalities} fatalities</p>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={accident.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-70 group-hover:opacity-100"
                      onClick={() => onViewAccident(accident)}
                      title="View details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollableTable>
      )}

      {onPageChange ? (
        <TablePagination
          page={page}
          pagination={pagination}
          onPageChange={onPageChange}
          itemLabel="records"
          pageSize={pageSize}
          onPageSizeChange={onPageSizeChange}
          alwaysShow
          className="pt-2"
        />
      ) : null}
    </div>
  );
}
