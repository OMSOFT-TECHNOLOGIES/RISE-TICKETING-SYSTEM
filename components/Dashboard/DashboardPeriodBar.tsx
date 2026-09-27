import React from 'react';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import type { Period } from './dashboardProfile';
import {
  DASHBOARD_PERIOD_TAB_TRIGGER_CLASS,
  DASHBOARD_PERIOD_TABS_LIST_CLASS,
  periodLabel,
  periodStatHint,
} from './constants';

type DashboardPeriodBarProps = {
  selectedPeriod: Period;
  onPeriodChange: (period: Period) => void;
  refreshing?: boolean;
};

const PERIODS: Period[] = ['daily', 'monthly', 'yearly'];

export function DashboardPeriodBar({
  selectedPeriod,
  onPeriodChange,
  refreshing = false,
}: DashboardPeriodBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border bg-card px-4 py-3 shadow-sm">
      <div className="min-w-0">
        <p className="text-sm font-medium">Time range</p>
        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
          {periodStatHint(selectedPeriod)}
          {refreshing ? (
            <span className="inline-flex items-center gap-1 text-primary">
              <Loader2 className="h-3 w-3 animate-spin" />
              Updating…
            </span>
          ) : null}
        </p>
      </div>
      <Tabs
        value={selectedPeriod}
        onValueChange={(v) => onPeriodChange(v as Period)}
        className="w-full sm:w-auto"
      >
        <TabsList className={DASHBOARD_PERIOD_TABS_LIST_CLASS}>
          {PERIODS.map((period) => (
            <TabsTrigger
              key={period}
              value={period}
              className={DASHBOARD_PERIOD_TAB_TRIGGER_CLASS}
            >
              {periodLabel(period)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
