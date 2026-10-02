import React from 'react';
import { AlertTriangle, Plus, Radio, RefreshCw } from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { PageHeader } from '../../shared/PageHeader';
import type { IncidentStats } from '../types';

interface IncidentCommandHeaderProps {
  stats: IncidentStats;
  canReport: boolean;
  onReportClick: () => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export function IncidentCommandHeader({
  stats,
  canReport,
  onReportClick,
  onRefresh,
  loading = false,
}: IncidentCommandHeaderProps) {
  const activeCount = stats.reported + stats.investigating;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Incident management"
        description="Monitor, investigate, and coordinate emergency response across the national transport network."
        actions={
          <>
            {onRefresh ? (
              <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            ) : null}
            {canReport ? (
              <Button onClick={onReportClick} className="shadow-sm">
                <Plus className="h-4 w-4 mr-2" />
                Report incident
              </Button>
            ) : null}
          </>
        }
        titleAddon={
          activeCount > 0 ? (
            <Badge variant="secondary" className="font-normal gap-1.5 px-2.5 text-sm">
              <Radio className="h-3 w-3 text-red-500 animate-pulse" />
              {activeCount} active
            </Badge>
          ) : undefined
        }
      />

      {stats.critical > 0 ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200/80 bg-red-50/60 px-4 py-3 dark:bg-red-950/25 dark:border-red-900/40 ring-1 ring-red-500/10">
          <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-900 dark:text-red-200">
              {stats.critical} critical incident{stats.critical !== 1 ? 's' : ''} require immediate
              attention
            </p>
            <p className="text-xs text-red-700/80 dark:text-red-300/80 mt-0.5">
              Review and assign response teams without delay.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
