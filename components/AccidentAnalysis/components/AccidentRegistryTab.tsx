import React from 'react';
import { Download, Eye, Plus, Search } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import type { ListPagination } from '../../utils/api/client';
import type { Accident, AccidentFilters } from '../types';
import { TablePagination } from '../../shared/TablePagination';
import { formatAccidentDate } from '../utils';
import { SeverityBadge } from './SeverityBadge';
import { StatusBadge } from './StatusBadge';

interface AccidentRegistryTabProps {
  accidents: Accident[];
  totalMatching?: number;
  filters: AccidentFilters;
  onFiltersChange: (updates: Partial<AccidentFilters>) => void;
  onViewAccident: (accident: Accident) => void;
  onReportClick: () => void;
  onExportClick: () => void;
  page?: number;
  pagination?: ListPagination | null;
  onPageChange?: (page: number) => void;
}

export function AccidentRegistryTab({
  accidents,
  totalMatching,
  filters,
  onFiltersChange,
  onViewAccident,
  onReportClick,
  onExportClick,
  page = 1,
  pagination = null,
  onPageChange,
}: AccidentRegistryTabProps) {
  const matchCount = totalMatching ?? accidents.length;
  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="accident-search" className="text-xs uppercase tracking-wide text-muted-foreground">
            Search Registry
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="accident-search"
              placeholder="Search by ID, location, driver, or route..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ search: e.target.value })}
              className="pl-10 bg-background"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <Select value={filters.severity} onValueChange={(value) => onFiltersChange({ severity: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="minor">Minor</SelectItem>
              <SelectItem value="major">Major</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.status} onValueChange={(value) => onFiltersChange({ status: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="investigated">Investigated</SelectItem>
              <SelectItem value="under_investigation">Under Investigation</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={onReportClick} className="bg-[#193cb8] hover:bg-[#152f94]">
            <Plus className="h-4 w-4 mr-2" />
            Report
          </Button>
          <Button onClick={onExportClick} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-background overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h3 className="text-sm font-semibold">Accident Records</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {matchCount} record{matchCount !== 1 ? 's' : ''} matching filters
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs uppercase tracking-wide">Accident ID</TableHead>
              <TableHead className="text-xs uppercase tracking-wide">Date</TableHead>
              <TableHead className="text-xs uppercase tracking-wide">Location</TableHead>
              <TableHead className="text-xs uppercase tracking-wide">Severity</TableHead>
              <TableHead className="text-xs uppercase tracking-wide">Casualties</TableHead>
              <TableHead className="text-xs uppercase tracking-wide">Status</TableHead>
              <TableHead className="text-xs uppercase tracking-wide w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {accidents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No accidents match your filters.
                </TableCell>
              </TableRow>
            ) : (
              accidents.map((accident) => (
                <TableRow key={accident.id} className="group">
                  <TableCell>
                    <p className="font-mono text-sm font-medium">{accident.id}</p>
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
                    <p className="text-sm text-orange-600">{accident.injuries} injured</p>
                    {accident.fatalities > 0 && (
                      <p className="text-xs text-red-600">{accident.fatalities} fatalities</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={accident.status} />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-70 group-hover:opacity-100"
                      onClick={() => onViewAccident(accident)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
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
            itemLabel="records"
            className="px-5"
          />
        ) : null}
      </div>
    </div>
  );
}
