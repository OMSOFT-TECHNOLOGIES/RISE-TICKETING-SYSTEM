import React from 'react';
import { Activity, AlertOctagon, CheckCircle2, Clock, Search } from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import type { IncidentStats } from '../types';

interface IncidentKpiDashboardProps {
  stats: IncidentStats;
}

const kpis = [
  { key: 'total' as const, label: 'Total Cases', icon: Activity, accent: 'text-foreground' },
  { key: 'reported' as const, label: 'Awaiting Triage', icon: Clock, accent: 'text-amber-600' },
  { key: 'investigating' as const, label: 'Under Investigation', icon: Search, accent: 'text-[#193cb8]' },
  { key: 'resolved' as const, label: 'Resolved', icon: CheckCircle2, accent: 'text-emerald-600' },
];

export function IncidentKpiDashboard({ stats }: IncidentKpiDashboardProps) {
  const pipelineTotal = Math.max(stats.total, 1);
  const segments = [
    { label: 'Reported', value: stats.reported, color: 'bg-amber-500' },
    { label: 'Investigating', value: stats.investigating, color: 'bg-[#193cb8]' },
    { label: 'Resolved', value: stats.resolved, color: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ key, label, icon: Icon, accent }) => (
          <Card key={key} className="border shadow-none">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {label}
                  </p>
                  <p className={`text-3xl font-semibold tabular-nums mt-2 ${accent}`}>
                    {stats[key]}
                  </p>
                </div>
                <div className="rounded-md bg-muted/60 p-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border shadow-none">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Case Pipeline
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {stats.critical > 0 && (
                <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                  <AlertOctagon className="h-3.5 w-3.5" />
                  {stats.critical} critical
                </span>
              )}
              {stats.high > 0 && (
                <span>{stats.high} high priority</span>
              )}
            </div>
          </div>
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
            {segments.map((seg) =>
              seg.value > 0 ? (
                <div
                  key={seg.label}
                  className={`${seg.color} transition-all`}
                  style={{ width: `${(seg.value / pipelineTotal) * 100}%` }}
                  title={`${seg.label}: ${seg.value}`}
                />
              ) : null
            )}
          </div>
          <div className="flex flex-wrap gap-4 mt-3">
            {segments.map((seg) => (
              <div key={seg.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className={`h-2 w-2 rounded-full ${seg.color}`} />
                <span>{seg.label}</span>
                <span className="font-medium text-foreground tabular-nums">{seg.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
