import React from 'react';
import { AlertTriangle, Plus, Radio } from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import type { IncidentStats } from '../types';

interface IncidentCommandHeaderProps {
  stats: IncidentStats;
  canReport: boolean;
  onReportClick: () => void;
}

export function IncidentCommandHeader({ stats, canReport, onReportClick }: IncidentCommandHeaderProps) {
  const activeCount = stats.reported + stats.investigating;

  return (
    <div className="border-b bg-background">
      <div className="max-w-[1600px] mx-auto px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <span>Safety &amp; Incidents</span>
              <span className="text-border">/</span>
              <span className="text-foreground">Operations Center</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Incident Management
              </h1>
              {activeCount > 0 && (
                <Badge variant="secondary" className="font-normal gap-1.5 px-2.5">
                  <Radio className="h-3 w-3 text-red-500 animate-pulse" />
                  {activeCount} active
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground max-w-xl">
              Monitor, investigate, and coordinate emergency response across the national transport network.
            </p>
          </div>

          {canReport && (
            <Button
              onClick={onReportClick}
              className="shrink-0 bg-[#193cb8] hover:bg-[#152f94] shadow-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Report Incident
            </Button>
          )}
        </div>

        {stats.critical > 0 && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-red-200/80 bg-red-50/50 px-4 py-3 dark:bg-red-950/20 dark:border-red-900/40">
            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-900 dark:text-red-200">
                {stats.critical} critical incident{stats.critical !== 1 ? 's' : ''} require immediate attention
              </p>
              <p className="text-xs text-red-700/80 dark:text-red-300/80 mt-0.5">
                Review and assign response teams without delay.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
