import React from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import type { Period } from './dashboardProfile';
import {
  DASHBOARD_PERIOD_TAB_TRIGGER_CLASS,
  DASHBOARD_PERIOD_TABS_LIST_CLASS,
  periodLabel,
  periodStatHint,
} from './constants';
import { formatPeriodRangeLabel } from './dashboardPeriodRange';

type DashboardPeriodBarProps = {
  selectedPeriod: Period;
  onPeriodChange: (period: Period) => void;
  periodOffset?: number;
  onPeriodStepBack?: () => void;
  onPeriodStepForward?: () => void;
  showPeriodNavigation?: boolean;
  refreshing?: boolean;
};

const PERIODS: Period[] = ['daily', 'monthly', 'yearly'];

export function DashboardPeriodBar({
  selectedPeriod,
  onPeriodChange,
  periodOffset = 0,
  onPeriodStepBack,
  onPeriodStepForward,
  showPeriodNavigation = false,
  refreshing = false,
}: DashboardPeriodBarProps) {
  const rangeHint =
    periodOffset > 0 || showPeriodNavigation
      ? formatPeriodRangeLabel(selectedPeriod, periodOffset)
      : periodStatHint(selectedPeriod, periodOffset);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border bg-card/80 backdrop-blur-sm px-4 py-3.5 shadow-sm ring-1 ring-border/50">
      <div className="min-w-0">
        <p className="text-sm font-medium">Time range</p>
        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
          {rangeHint}
          {refreshing ? (
            <span className="inline-flex items-center gap-1 text-primary">
              <Loader2 className="h-3 w-3 animate-spin" />
              Updating…
            </span>
          ) : null}
        </p>
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        {showPeriodNavigation ? (
          <div className="flex items-center shrink-0 rounded-lg border bg-muted/30 p-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Previous period"
              aria-label="Previous period"
              onClick={onPeriodStepBack}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Next period (toward today)"
              aria-label="Next period"
              disabled={periodOffset <= 0}
              onClick={onPeriodStepForward}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
        <Tabs
          value={selectedPeriod}
          onValueChange={(v) => onPeriodChange(v as Period)}
          className="w-full sm:w-auto flex-1 sm:flex-initial"
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
    </div>
  );
}
