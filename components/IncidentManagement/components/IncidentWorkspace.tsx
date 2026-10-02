import React from 'react';
import { List, Map, Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Tabs, TabsList, TabsTrigger } from '../../ui/tabs';
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
    filters.type !== 'all' ||
    filters.status !== 'all' ||
    filters.severity !== 'all' ||
    Boolean(filters.search.trim());

  return (
    <Card className="rounded-2xl shadow-sm ring-1 ring-border/50 overflow-hidden border-0">
      <CardHeader className="space-y-4 border-b border-border/60 bg-muted/20 pb-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Incident registry</CardTitle>
            <CardDescription className="mt-1">
              {resultCount} of {totalCount} case{totalCount === 1 ? '' : 's'} · search and filter
            </CardDescription>
          </div>
          <Tabs
            value={viewMode}
            onValueChange={(v) => onViewModeChange(v as ViewMode)}
            className="w-full xl:w-auto"
          >
            <div className="rise-segment-tabs w-full max-w-xs xl:ml-auto">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="table" className="justify-center gap-1.5 px-3">
                  <List className="h-4 w-4 shrink-0 opacity-80" />
                  Registry
                </TabsTrigger>
                <TabsTrigger value="map" className="justify-center gap-1.5 px-3">
                  <Map className="h-4 w-4 shrink-0 opacity-80" />
                  Map
                </TabsTrigger>
              </TabsList>
            </div>
          </Tabs>
        </div>

        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cases, locations, reporters…"
              value={filters.search}
              onChange={(e) => onFiltersChange({ search: e.target.value })}
              className="pl-9 h-10 bg-background/80"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={filters.type} onValueChange={(v) => onFiltersChange({ type: v })}>
              <SelectTrigger className="w-full sm:w-[140px] h-10 bg-background/80">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {INCIDENT_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(v) => onFiltersChange({ status: v })}>
              <SelectTrigger className="w-full sm:w-[140px] h-10 bg-background/80">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.severity} onValueChange={(v) => onFiltersChange({ severity: v })}>
              <SelectTrigger className="w-full sm:w-[140px] h-10 bg-background/80">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All severity</SelectItem>
                {SEVERITY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
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
                  onFiltersChange({ search: '', type: 'all', status: 'all', severity: 'all' })
                }
              >
                Clear
              </Button>
            ) : null}
          </div>
        </div>

        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
          Open a row or map marker to view the full case file and response actions.
        </p>
      </CardHeader>

      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}
