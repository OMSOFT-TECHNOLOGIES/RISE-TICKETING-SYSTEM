import React from 'react';
import { Activity, AlertOctagon, CheckCircle2, Clock, Search } from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import { DashboardStatCard } from '../../Dashboard/DashboardStatCard';
import type { IncidentStats } from '../types';

interface IncidentKpiDashboardProps {
  stats: IncidentStats;
}

export function IncidentKpiDashboard({ stats }: IncidentKpiDashboardProps) {
  const pipelineTotal = Math.max(stats.total, 1);
  const segments = [
    { label: 'Reported', value: stats.reported, color: 'bg-amber-500' },
    { label: 'Investigating', value: stats.investigating, color: 'bg-primary' },
    { label: 'Resolved', value: stats.resolved, color: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-4 sm:p-5 ring-1 ring-border/40">
        <h2 className="text-sm font-semibold tracking-tight mb-4">Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <DashboardStatCard
            title="Total cases"
            value={stats.total}
            icon={Activity}
            accent="blue"
            hint="National registry"
          />
          <DashboardStatCard
            title="Awaiting triage"
            value={stats.reported}
            icon={Clock}
            accent="amber"
            hint="Needs review"
          />
          <DashboardStatCard
            title="Investigating"
            value={stats.investigating}
            icon={Search}
            accent="violet"
            hint="Active cases"
          />
          <DashboardStatCard
            title="Resolved"
            value={stats.resolved}
            icon={CheckCircle2}
            accent="emerald"
            hint="Closed cases"
          />
        </div>
      </section>

      <Card className="rounded-2xl shadow-sm ring-1 ring-border/50 border-0">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <p className="text-sm font-semibold tracking-tight">Case pipeline</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {stats.critical > 0 ? (
                <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                  <AlertOctagon className="h-3.5 w-3.5" />
                  {stats.critical} critical
                </span>
              ) : null}
              {stats.high > 0 ? <span>{stats.high} high priority</span> : null}
            </div>
          </div>
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
            {segments.map((seg) =>
              seg.value > 0 ? (
                <div
                  key={seg.label}
                  className={`${seg.color} transition-all duration-300`}
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
