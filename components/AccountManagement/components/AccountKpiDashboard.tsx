import React from 'react';
import { ArrowDownRight, ArrowUpRight, DollarSign, Target, Wallet } from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import { DashboardStatCard } from '../../Dashboard/DashboardStatCard';
import type { FinancialStats } from '../types';
import { formatCurrency } from '../utils';

interface AccountKpiDashboardProps {
  stats: FinancialStats;
}

export function AccountKpiDashboard({ stats }: AccountKpiDashboardProps) {
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-4 sm:p-5 ring-1 ring-border/40">
        <h2 className="text-sm font-semibold tracking-tight mb-4">Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <DashboardStatCard
            title="Monthly revenue"
            value={formatCurrency(stats.monthlyRevenue)}
            icon={ArrowUpRight}
            accent="emerald"
            hint="Current month inflow"
          />
          <DashboardStatCard
            title="Monthly expenses"
            value={formatCurrency(stats.monthlyExpenses)}
            icon={ArrowDownRight}
            accent="amber"
            hint="Current month outflow"
          />
          <DashboardStatCard
            title="Monthly profit"
            value={formatCurrency(stats.monthlyProfit)}
            icon={DollarSign}
            accent={stats.monthlyProfit >= 0 ? 'blue' : 'violet'}
            hint="Net for the month"
          />
          <DashboardStatCard
            title="Budget utilization"
            value={`${stats.budgetUtilization.toFixed(1)}%`}
            icon={Wallet}
            accent="blue"
            hint={`${formatCurrency(stats.totalSpent)} of ${formatCurrency(stats.totalBudget)}`}
          />
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-3">
          <Target className="h-3.5 w-3.5" />
          Track ledger entries and budgets from the tabs below.
        </p>
      </section>

      {stats.totalBudget > 0 ? (
        <Card className="rounded-2xl shadow-sm ring-1 ring-border/50 border-0">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold tracking-tight">Budget allocation used</p>
              <span className="text-xs text-muted-foreground tabular-nums">
                {stats.budgetUtilization.toFixed(1)}% utilized
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${Math.min(stats.budgetUtilization, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
