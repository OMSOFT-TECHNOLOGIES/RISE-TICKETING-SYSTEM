import React from 'react';
import { AlertTriangle, CheckCircle, Clock, Zap } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { DashboardStatCard } from '../Dashboard/DashboardStatCard';

type DeathTrapKpiSectionProps = {
  totalOnPage: number;
  totalListed?: number;
  critical: number;
  pendingAction: number;
  resolved: number;
};

export function DeathTrapKpiSection({
  totalOnPage,
  totalListed,
  critical,
  pendingAction,
  resolved,
}: DeathTrapKpiSectionProps) {
  const pipelineTotal = Math.max(totalOnPage, 1);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-4 sm:p-5 ring-1 ring-border/40">
        <h2 className="text-sm font-semibold tracking-tight mb-4">Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <DashboardStatCard
            title="Reports (this page)"
            value={totalListed ?? totalOnPage}
            icon={Zap}
            accent="blue"
            hint={totalListed != null ? `${totalOnPage} shown here` : 'Current list'}
          />
          <DashboardStatCard
            title="Critical hazards"
            value={critical}
            icon={AlertTriangle}
            accent="amber"
            hint="Severity critical"
          />
          <DashboardStatCard
            title="Pending action"
            value={pendingAction}
            icon={Clock}
            accent="violet"
            hint="Reported or acknowledged"
          />
          <DashboardStatCard
            title="Resolved"
            value={resolved}
            icon={CheckCircle}
            accent="emerald"
            hint="Closed on this page"
          />
        </div>
      </section>

      {(critical > 0 || pendingAction > 0 || resolved > 0) && (
        <Card className="rounded-2xl shadow-sm ring-1 ring-border/50 border-0">
          <CardContent className="p-4 sm:p-5">
            <p className="text-sm font-semibold tracking-tight mb-3">Status mix (current page)</p>
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
              {[
                { value: pendingAction, color: 'bg-violet-500' },
                { value: critical, color: 'bg-red-500' },
                { value: resolved, color: 'bg-emerald-500' },
              ].map((seg, i) =>
                seg.value > 0 ? (
                  <div
                    key={i}
                    className={`${seg.color} transition-all duration-300`}
                    style={{ width: `${(seg.value / pipelineTotal) * 100}%` }}
                  />
                ) : null
              )}
            </div>
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-violet-500" />
                Pending{' '}
                <span className="font-medium text-foreground tabular-nums">{pendingAction}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                Critical{' '}
                <span className="font-medium text-foreground tabular-nums">{critical}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Resolved{' '}
                <span className="font-medium text-foreground tabular-nums">{resolved}</span>
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
