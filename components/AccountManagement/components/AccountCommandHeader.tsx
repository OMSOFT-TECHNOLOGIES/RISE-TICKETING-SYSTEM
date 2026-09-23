import React from 'react';
import { Download, PlusCircle } from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import type { FinancialStats } from '../types';
import { formatCurrency } from '../utils';

interface AccountCommandHeaderProps {
  stats: FinancialStats;
  onExport: () => void;
  onAddTransaction: () => void;
}

export function AccountCommandHeader({
  stats,
  onExport,
  onAddTransaction,
}: AccountCommandHeaderProps) {
  return (
    <div className="border-b bg-background">
      <div className="max-w-[1600px] mx-auto px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <span>Finance &amp; Operations</span>
              <span className="text-border">/</span>
              <span className="text-foreground">Account Management</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Account Management
              </h1>
              {stats.pendingTransactions > 0 && (
                <Badge variant="secondary" className="font-normal tabular-nums">
                  {stats.pendingTransactions} pending
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground max-w-xl">
              Manage revenue streams, expense tracking, and budget utilization across all RISE operations.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button onClick={onAddTransaction} className="bg-[#193cb8] hover:bg-[#152f94] shadow-sm">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Total Profit (All Time)
            </p>
            <p className={`text-xl font-semibold tabular-nums mt-0.5 ${stats.totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrency(stats.totalProfit)}
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs text-muted-foreground">Monthly net</p>
            <p className={`text-sm font-medium tabular-nums ${stats.monthlyProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrency(stats.monthlyProfit)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
