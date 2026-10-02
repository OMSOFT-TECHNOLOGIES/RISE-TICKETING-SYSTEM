import type { Period } from './dashboardProfile';

/** Matches Reports / Revenue — selected tab stands out clearly */
export const DASHBOARD_PERIOD_TAB_TRIGGER_CLASS =
  'rounded-md px-4 py-2 text-xs sm:text-sm font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:bg-[#193cb8] data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:font-semibold data-[state=active]:ring-1 data-[state=active]:ring-[#152f94]/50 dark:data-[state=active]:bg-[#193cb8] dark:data-[state=active]:text-white';

export const DASHBOARD_PERIOD_TABS_LIST_CLASS =
  'inline-flex h-auto w-full sm:w-auto gap-1 bg-muted/50 p-1.5 rounded-lg border shadow-none';

export function periodLabel(period: Period): string {
  switch (period) {
    case 'daily':
      return 'Daily';
    case 'monthly':
      return 'Monthly';
    case 'yearly':
      return 'Yearly';
  }
}

export function periodStatHint(period: Period, periodOffset = 0): string {
  if (periodOffset === 0) {
    switch (period) {
      case 'daily':
        return 'Showing today’s figures';
      case 'monthly':
        return 'Showing this month';
      case 'yearly':
        return 'Showing year to date';
    }
  }
  // Detailed label when browsing previous ranges (set by DashboardPeriodBar via prop).
  return '';
}
