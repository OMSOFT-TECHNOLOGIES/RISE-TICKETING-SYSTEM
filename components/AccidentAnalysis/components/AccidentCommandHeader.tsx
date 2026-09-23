import React from 'react';
import { AlertTriangle, Download, Plus } from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import type { AccidentStats } from '../types';

interface AccidentCommandHeaderProps {
  stats: AccidentStats;
  criticalCount: number;
  onReportClick: () => void;
  onExportClick: () => void;
}

export function AccidentCommandHeader({
  stats,
  criticalCount,
  onReportClick,
  onExportClick,
}: AccidentCommandHeaderProps) {
  return (
    <div className="border-b bg-background">
      <div className="max-w-[1600px] mx-auto px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <span>Safety &amp; Analytics</span>
              <span className="text-border">/</span>
              <span className="text-foreground">Accident Intelligence</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Accident Analysis
              </h1>
              {stats.total > 0 && (
                <Badge variant="secondary" className="font-normal tabular-nums">
                  {stats.total} recorded
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground max-w-xl">
              Monitor, investigate, and analyze transport accidents across the RISE network.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" onClick={onExportClick}>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button onClick={onReportClick} className="bg-[#193cb8] hover:bg-[#152f94] shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              Report Accident
            </Button>
          </div>
        </div>

        {criticalCount > 0 && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-red-200/80 bg-red-50/50 px-4 py-3 dark:bg-red-950/20 dark:border-red-900/40">
            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-900 dark:text-red-200">
                {criticalCount} critical accident{criticalCount !== 1 ? 's' : ''} under review
              </p>
              <p className="text-xs text-red-700/80 dark:text-red-300/80 mt-0.5">
                Prioritize investigation and insurance claim processing.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
