import React from 'react';
import { Download, PlusCircle, RefreshCw, Wallet } from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { PageHeader } from '../../shared/PageHeader';
import type { FinancialStats } from '../types';
import { formatCurrency } from '../utils';

interface AccountCommandHeaderProps {
  stats: FinancialStats;
  onExport: () => void;
  onAddTransaction: () => void;
  onRefresh?: () => void;
  loading?: boolean;
  canProcessClaimPayments?: boolean;
  onPayClaims?: () => void;
}

export function AccountCommandHeader({
  stats,
  onExport,
  onAddTransaction,
  onRefresh,
  loading = false,
  canProcessClaimPayments,
  onPayClaims,
}: AccountCommandHeaderProps) {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Account management"
        description="Manage revenue streams, expense tracking, and budget utilization across RISE operations."
        titleAddon={
          stats.pendingTransactions > 0 ? (
            <Badge variant="secondary" className="font-normal tabular-nums text-sm">
              {stats.pendingTransactions} pending
            </Badge>
          ) : undefined
        }
        actions={
          <>
            {onRefresh ? (
              <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            ) : null}
            {canProcessClaimPayments && onPayClaims ? (
              <Button variant="outline" size="sm" onClick={onPayClaims}>
                <Wallet className="h-4 w-4 mr-2" />
                Pay claims
              </Button>
            ) : null}
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm" onClick={onAddTransaction} className="shadow-sm">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add transaction
            </Button>
          </>
        }
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 ring-1 ring-border/40">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Total profit (all time)
          </p>
          <p
            className={`text-xl font-semibold tabular-nums mt-0.5 ${
              stats.totalProfit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'
            }`}
          >
            {formatCurrency(stats.totalProfit)}
          </p>
        </div>
        <div className="sm:text-right">
          <p className="text-xs text-muted-foreground">Monthly net</p>
          <p
            className={`text-sm font-semibold tabular-nums ${
              stats.monthlyProfit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'
            }`}
          >
            {formatCurrency(stats.monthlyProfit)}
          </p>
        </div>
      </div>
    </div>
  );
}
