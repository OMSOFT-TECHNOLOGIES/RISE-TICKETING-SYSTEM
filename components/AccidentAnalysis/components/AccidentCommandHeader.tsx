import React from 'react';
import { AlertTriangle, Download, Plus, RefreshCw } from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { PageHeader } from '../../shared/PageHeader';
import type { AccidentStats } from '../types';

interface AccidentCommandHeaderProps {
  stats: AccidentStats;
  criticalCount: number;
  onReportClick: () => void;
  onExportClick: () => void;
  onRefresh?: () => void;
  loading?: boolean;
  allowManualReport?: boolean;
  isRoadSafetyManager?: boolean;
}

export function AccidentCommandHeader({
  stats,
  criticalCount,
  onReportClick,
  onExportClick,
  onRefresh,
  loading = false,
  allowManualReport = true,
  isRoadSafetyManager = false,
}: AccidentCommandHeaderProps) {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Accident analysis"
        description={
          isRoadSafetyManager
            ? 'Manage accident analysis cases assigned to your district after investigators confirm traffic incidents.'
            : 'Monitor, investigate, and analyze transport accidents. File traffic accidents as incidents first—they sync here when confirmed.'
        }
        titleAddon={
          stats.total > 0 ? (
            <Badge variant="secondary" className="font-normal tabular-nums text-sm">
              {stats.total} recorded
            </Badge>
          ) : undefined
        }
        actions={
          <>
            {onRefresh ? (
              <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            ) : null}
            <Button variant="outline" size="sm" onClick={onExportClick}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            {allowManualReport ? (
              <Button size="sm" onClick={onReportClick} className="shadow-sm">
                <Plus className="h-4 w-4 mr-2" />
                Report accident
              </Button>
            ) : null}
          </>
        }
      />

      {criticalCount > 0 ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200/80 bg-red-50/60 px-4 py-3 dark:bg-red-950/25 dark:border-red-900/40 ring-1 ring-red-500/10">
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
      ) : null}
    </div>
  );
}
