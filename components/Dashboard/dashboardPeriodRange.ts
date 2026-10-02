import type { Period } from './dashboardProfile';

export type DashboardPeriodBounds = {
  from: string;
  to: string;
  /** Single calendar day for daily trip lists (YYYY-MM-DD). */
  date: string;
};

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function toDateString(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

/** `offset` 0 = current period; 1 = one step back (yesterday, last month, prior year). */
export function resolveDashboardPeriodBounds(
  period: Period,
  offset: number
): DashboardPeriodBounds {
  const anchor = startOfLocalDay(new Date());

  if (period === 'daily') {
    anchor.setDate(anchor.getDate() - offset);
    return {
      from: toDateString(anchor),
      to: toDateString(anchor),
      date: toDateString(anchor),
    };
  }

  if (period === 'monthly') {
    anchor.setMonth(anchor.getMonth() - offset, 1);
    const lastDay = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
    return {
      from: toDateString(anchor),
      to: toDateString(lastDay),
      date: toDateString(anchor),
    };
  }

  const year = anchor.getFullYear() - offset;
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);
  return {
    from: toDateString(yearStart),
    to: toDateString(yearEnd),
    date: toDateString(yearStart),
  };
}

export function formatPeriodRangeLabel(period: Period, offset: number): string {
  const bounds = resolveDashboardPeriodBounds(period, offset);
  const fromDate = new Date(`${bounds.from}T12:00:00`);

  if (period === 'daily') {
    const dayLabel = fromDate.toLocaleDateString('en-GH', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    if (offset === 0) return `Showing today · ${dayLabel}`;
    return `Showing ${dayLabel}`;
  }

  if (period === 'monthly') {
    const monthLabel = fromDate.toLocaleDateString('en-GH', {
      month: 'long',
      year: 'numeric',
    });
    if (offset === 0) return `Showing this month · ${monthLabel}`;
    return `Showing ${monthLabel}`;
  }

  const year = fromDate.getFullYear();
  if (offset === 0) return `Showing year to date · ${year}`;
  return `Showing calendar year ${year}`;
}

export function dashboardPeriodNavigationEnabled(
  statsSource: 'admin' | 'station' | 'overview'
): boolean {
  return statsSource === 'admin' || statsSource === 'station';
}
