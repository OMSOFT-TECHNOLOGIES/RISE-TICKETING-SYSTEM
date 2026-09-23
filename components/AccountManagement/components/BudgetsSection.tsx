import React from 'react';
import { Card, CardContent } from '../../ui/card';
import { Progress } from '../../ui/progress';
import type { Budget } from '../types';
import { formatCurrency } from '../utils';

interface BudgetsSectionProps {
  budgets: Budget[];
}

export function BudgetsSection({ budgets }: BudgetsSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Budget Management</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Track allocated vs spent amounts by category
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {budgets.map((budget) => {
          const usedPct =
            budget.allocatedAmount > 0
              ? (budget.spentAmount / budget.allocatedAmount) * 100
              : 0;

          return (
            <Card key={budget.id} className="border shadow-none">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{budget.category}</h4>
                    <p className="text-xs text-muted-foreground capitalize mt-0.5">
                      {budget.period} · {budget.status.replace('_', ' ')}
                    </p>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">{budget.id}</span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm mb-4">
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Allocated</p>
                    <p className="font-medium tabular-nums mt-0.5">{formatCurrency(budget.allocatedAmount)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Spent</p>
                    <p className="font-medium tabular-nums mt-0.5 text-red-600">{formatCurrency(budget.spentAmount)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Remaining</p>
                    <p className="font-medium tabular-nums mt-0.5 text-emerald-600">{formatCurrency(budget.remainingAmount)}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Utilization</span>
                    <span className="tabular-nums">{usedPct.toFixed(1)}%</span>
                  </div>
                  <Progress value={usedPct} className="h-1.5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
