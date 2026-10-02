import React from 'react';
import { CheckCircle, Clock, DollarSign, FileText, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { DashboardStatCard } from '../Dashboard/DashboardStatCard';

type ClaimsKpiSectionProps = {
  totalOnPage: number;
  totalListed?: number;
  pendingReview: number;
  approved: number;
  totalPaidAmount: number;
  awaitingInvestigator: number;
};

export function ClaimsKpiSection({
  totalOnPage,
  totalListed,
  pendingReview,
  approved,
  totalPaidAmount,
  awaitingInvestigator,
}: ClaimsKpiSectionProps) {
  const pipelineTotal = Math.max(totalOnPage, 1);
  const pendingOnly = Math.max(0, pendingReview - awaitingInvestigator);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-4 sm:p-5 ring-1 ring-border/40">
        <h2 className="text-sm font-semibold tracking-tight mb-4">Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <DashboardStatCard
            title="Claims (this page)"
            value={totalListed ?? totalOnPage}
            icon={FileText}
            accent="blue"
            hint={totalListed != null ? `${totalOnPage} shown here` : 'Current list'}
          />
          <DashboardStatCard
            title="Pending review"
            value={pendingReview}
            icon={Clock}
            accent="amber"
            hint="Investigator or accounts queue"
          />
          <DashboardStatCard
            title="Approved"
            value={approved}
            icon={CheckCircle}
            accent="emerald"
            hint="Ready for payment"
          />
          <DashboardStatCard
            title="Total paid"
            value={`GH₵${totalPaidAmount.toLocaleString()}`}
            icon={DollarSign}
            accent="violet"
            hint="Paid on this page"
          />
        </div>
      </section>

      {(awaitingInvestigator > 0 || pendingOnly > 0 || approved > 0) && (
        <Card className="rounded-2xl shadow-sm ring-1 ring-border/50 border-0">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <p className="text-sm font-semibold tracking-tight">Status mix (current page)</p>
              {awaitingInvestigator > 0 ? (
                <span className="inline-flex items-center gap-1 text-xs text-violet-700 dark:text-violet-400 font-medium">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {awaitingInvestigator} need biometric review
                </span>
              ) : null}
            </div>
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
              {[
                { value: awaitingInvestigator, color: 'bg-violet-500' },
                { value: pendingOnly, color: 'bg-amber-500' },
                { value: approved, color: 'bg-emerald-500' },
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
                Awaiting investigator{' '}
                <span className="font-medium text-foreground tabular-nums">{awaitingInvestigator}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Pending{' '}
                <span className="font-medium text-foreground tabular-nums">{pendingOnly}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Approved{' '}
                <span className="font-medium text-foreground tabular-nums">{approved}</span>
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
