import React from 'react';
import { ArrowDownRight, ArrowUpRight, DollarSign, Target, Wallet } from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import type { FinancialStats } from '../types';
import { formatCurrency } from '../utils';

interface AccountKpiDashboardProps {
  stats: FinancialStats;
}

const kpis = [
  {
    key: 'monthlyRevenue' as const,
    label: 'Monthly Revenue',
    icon: ArrowUpRight,
    accent: 'text-emerald-600',
    sub: '+12% from last month',
    subClass: 'text-emerald-600',
  },
  {
    key: 'monthlyExpenses' as const,
    label: 'Monthly Expenses',
    icon: ArrowDownRight,
    accent: 'text-red-600',
    sub: '-5% from last month',
    subClass: 'text-red-600',
  },
  {
    key: 'monthlyProfit' as const,
    label: 'Monthly Profit',
    icon: DollarSign,
    accent: 'text-foreground',
    sub: 'Budget target: ₵20,000',
    subClass: 'text-muted-foreground',
    dynamicAccent: true,
  },
  {
    key: 'budgetUtilization' as const,
    label: 'Budget Utilization',
    icon: Wallet,
    accent: 'text-[#193cb8]',
    subKey: 'spent' as const,
    suffix: '%',
    isPercent: true,
  },
];

export function AccountKpiDashboard({ stats }: AccountKpiDashboardProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ key, label, icon: Icon, accent, sub, subClass, dynamicAccent, subKey, suffix, isPercent }) => {
          let value: string;
          if (isPercent) {
            value = `${stats[key].toFixed(1)}${suffix ?? ''}`;
          } else {
            value = formatCurrency(stats[key] as number);
          }

          const colorClass =
            dynamicAccent && key === 'monthlyProfit'
              ? stats.monthlyProfit >= 0
                ? 'text-emerald-600'
                : 'text-red-600'
              : accent;

          let subText = sub;
          if (subKey === 'spent') {
            subText = `${formatCurrency(stats.totalSpent)} of ${formatCurrency(stats.totalBudget)}`;
          }

          return (
            <Card key={key} className="border shadow-none">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {label}
                    </p>
                    <p className={`text-2xl font-semibold tabular-nums mt-2 ${colorClass}`}>{value}</p>
                    {subText && (
                      <p className={`text-xs mt-1 flex items-center gap-1 ${subClass ?? 'text-muted-foreground'}`}>
                        {key === 'monthlyProfit' && <Target className="h-3 w-3" />}
                        {subText}
                      </p>
                    )}
                  </div>
                  <div className="rounded-md bg-muted/60 p-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {stats.totalBudget > 0 && (
        <Card className="border shadow-none">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Budget Allocation Used
              </p>
              <span className="text-xs text-muted-foreground tabular-nums">
                {stats.budgetUtilization.toFixed(1)}% utilized
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-[#193cb8] transition-all"
                style={{ width: `${Math.min(stats.budgetUtilization, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
