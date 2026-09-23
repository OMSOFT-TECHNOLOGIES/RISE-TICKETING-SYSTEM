import React from 'react';
import { LayoutGrid, List, Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Card } from '../../ui/card';
import { Separator } from '../../ui/separator';
import type { IncidentFilters, ViewMode } from '../types';
import { INCIDENT_TYPE_OPTIONS, SEVERITY_OPTIONS, STATUS_OPTIONS } from '../constants';

interface IncidentWorkspaceProps {
  filters: IncidentFilters;
  viewMode: ViewMode;
  resultCount: number;
  totalCount: number;
  onFiltersChange: (updates: Partial<IncidentFilters>) => void;
  onViewModeChange: (mode: ViewMode) => void;
  children: React.ReactNode;
}

export function IncidentWorkspace({
  filters,
  viewMode,
  resultCount,
  totalCount,
  onFiltersChange,
  onViewModeChange,
  children,
}: IncidentWorkspaceProps) {
  const hasActiveFilters =
    filters.type !== 'all' || filters.status !== 'all' || filters.severity !== 'all' || filters.search;

  return (
    <Card className="border shadow-none overflow-hidden">
      <div className="p-4 space-y-4 border-b bg-muted/20">
        <div className="flex flex-col xl:flex-row xl:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search cases, locations, reporters..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ search: e.target.value })}
              className="pl-9 bg-background"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={filters.type} onValueChange={(v) => onFiltersChange({ type: v })}>
              <SelectTrigger className="w-[140px] h-9 bg-background">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {INCIDENT_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(v) => onFiltersChange({ status: v })}>
              <SelectTrigger className="w-[140px] h-9 bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.severity} onValueChange={(v) => onFiltersChange({ severity: v })}>
              <SelectTrigger className="w-[140px] h-9 bg-background">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All severity</SelectItem>
                {SEVERITY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-muted-foreground"
                onClick={() =>
                  onFiltersChange({ search: '', type: 'all', status: 'all', severity: 'all' })
                }
              >
                Clear
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 xl:ml-auto">
            <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
              {resultCount} of {totalCount}
            </span>
            <Separator orientation="vertical" className="h-6 hidden sm:block" />
            <div className="inline-flex rounded-md border bg-background p-0.5">
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 px-3"
                onClick={() => onViewModeChange('table')}
              >
                <List className="h-4 w-4 mr-1.5" />
                Registry
              </Button>
              <Button
                variant={viewMode === 'map' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 px-3"
                onClick={() => onViewModeChange('map')}
              >
                <LayoutGrid className="h-4 w-4 mr-1.5" />
                Map
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Filtered incident registry — select a row or map marker to open the case file</span>
        </div>
      </div>

      <div className="p-0">{children}</div>
    </Card>
  );
}
