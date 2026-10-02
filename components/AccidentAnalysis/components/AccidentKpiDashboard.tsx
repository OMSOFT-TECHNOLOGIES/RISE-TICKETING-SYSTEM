import React from 'react';
import { AlertCircle, AlertTriangle, BarChart3, Users } from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import { DashboardStatCard } from '../../Dashboard/DashboardStatCard';
import type { AccidentStats } from '../types';
import { formatCurrency } from '../utils';

interface AccidentKpiDashboardProps {
  stats: AccidentStats;
}

export function AccidentKpiDashboard({ stats }: AccidentKpiDashboardProps) {
  const pending = stats.total > 0 ? Math.ceil(stats.total * 0.33) : 0;
  const investigating = stats.total > 0 ? Math.ceil(stats.total * 0.33) : 0;
  const closed = Math.max(stats.total - pending - investigating, 0);
  const pipelineTotal = Math.max(stats.total, 1);

  const segments = [
    { label: 'Pending', value: pending, color: 'bg-amber-500' },
    { label: 'Investigating', value: investigating, color: 'bg-primary' },
    { label: 'Closed', value: closed, color: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-4 sm:p-5 ring-1 ring-border/40">
        <h2 className="text-sm font-semibold tracking-tight mb-4">Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <DashboardStatCard
            title="Total accidents"
            value={stats.total}
            icon={AlertTriangle}
            accent="blue"
            hint="Recorded in registry"
          />
          <DashboardStatCard
            title="Total injuries"
            value={stats.injuries}
            icon={Users}
            accent="amber"
            hint={`${stats.avgInjuries.toFixed(1)} avg per incident`}
          />
          <DashboardStatCard
            title="Fatalities"
            value={stats.fatalities}
            icon={AlertCircle}
            accent="violet"
            hint={`${stats.fatalityRate.toFixed(1)}% fatality rate`}
          />
          <DashboardStatCard
            title="Total cost"
            value={formatCurrency(stats.totalCost)}
            icon={BarChart3}
            accent="emerald"
            hint={`${formatCurrency(stats.avgCost)} avg cost`}
          />
        </div>
      </section>

      {stats.total > 0 ? (
        <Card className="rounded-2xl shadow-sm ring-1 ring-border/50 border-0">
          <CardContent className="p-4 sm:p-5">
            <p className="text-sm font-semibold tracking-tight mb-3">Investigation pipeline (estimate)</p>
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
      ) : null}
    </div>
  );
}
