import type {
  Accident,
  AccidentFilters,
  AccidentStats,
  CauseAnalysisItem,
  NewAccidentForm,
  SeverityDistribution,
  TrendDataPoint,
} from './types';
import { CAUSE_OPTIONS } from './constants';

const CAUSE_CHART_COLORS = ['#193cb8', '#ef4444', '#f59e0b', '#22c55e', '#8b5cf6', '#64748b'];

const SEVERITY_CHART_COLORS: Record<string, string> = {
  minor: '#22c55e',
  major: '#f59e0b',
  critical: '#ef4444',
};

export function calculateStats(accidents: Accident[]): AccidentStats {
  const total = accidents.length;
  const injuries = accidents.reduce((sum, a) => sum + a.injuries, 0);
  const fatalities = accidents.reduce((sum, a) => sum + a.fatalities, 0);
  const totalCost = accidents.reduce((sum, a) => sum + a.cost, 0);

  return {
    total,
    injuries,
    fatalities,
    totalCost,
    avgInjuries: total ? Math.round(injuries / total) : 0,
    avgCost: total ? Math.round(totalCost / total) : 0,
    fatalityRate: total ? (fatalities / total) * 100 : 0,
  };
}

export function filterAccidents(accidents: Accident[], filters: AccidentFilters): Accident[] {
  const term = filters.search.toLowerCase();

  return accidents.filter((accident) => {
    const matchesSearch =
      !term ||
      accident.id.toLowerCase().includes(term) ||
      (accident.location ?? '').toLowerCase().includes(term) ||
      (accident.driverName ?? '').toLowerCase().includes(term) ||
      (accident.route ?? '').toLowerCase().includes(term);

    const matchesSeverity = filters.severity === 'all' || accident.severity === filters.severity;
    const matchesStatus = filters.status === 'all' || accident.status === filters.status;

    return matchesSearch && matchesSeverity && matchesStatus;
  });
}

export function formatAccidentDate(dateString: string): string {
  return new Date(dateString).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(amount: number): string {
  return `₵${amount.toLocaleString()}`;
}

export function getSeverityStyles(severity: string) {
  switch (severity) {
    case 'critical':
      return { dot: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50 border-red-200/60' };
    case 'major':
      return { dot: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-50 border-orange-200/60' };
    case 'minor':
    default:
      return { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200/60' };
  }
}

export function getStatusStyles(status: string) {
  switch (status) {
    case 'pending':
      return { dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50 border-amber-200/60' };
    case 'investigated':
      return { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200/60' };
    case 'under_investigation':
      return { dot: 'bg-[#193cb8]', text: 'text-[#193cb8]', bg: 'bg-[#193cb8]/5 border-[#193cb8]/20' };
    case 'closed':
    default:
      return { dot: 'bg-slate-400', text: 'text-slate-600', bg: 'bg-slate-50 border-slate-200/60' };
  }
}

export function formatSnakeLabel(value: string | null | undefined): string | undefined {
  if (value == null || value === '') return undefined;
  return String(value).replace(/_/g, ' ');
}

export function getStatusLabel(status: string | null | undefined): string {
  if (status == null || status === '') return 'Unknown';
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getCauseLabel(cause: string | null | undefined): string | undefined {
  if (cause == null || cause === '') return undefined;
  return CAUSE_OPTIONS.find((c) => c.value === cause)?.label ?? formatSnakeLabel(cause);
}

export function buildCauseAnalysis(accidents: Accident[]): CauseAnalysisItem[] {
  const counts = new Map<string, number>();

  for (const accident of accidents) {
    const cause = accident.cause || 'unknown';
    counts.set(cause, (counts.get(cause) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([cause, count], index) => ({
      cause: getCauseLabel(cause),
      count,
      color: CAUSE_CHART_COLORS[index % CAUSE_CHART_COLORS.length],
    }))
    .sort((a, b) => b.count - a.count);
}

export function buildSeverityDistribution(accidents: Accident[]): SeverityDistribution[] {
  const total = accidents.length;
  if (total === 0) return [];

  const counts = new Map<string, number>();
  for (const accident of accidents) {
    counts.set(accident.severity, (counts.get(accident.severity) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([severity, count]) => ({
    severity: severity.charAt(0).toUpperCase() + severity.slice(1),
    count,
    percentage: Math.round((count / total) * 100),
    color: SEVERITY_CHART_COLORS[severity] ?? '#64748b',
  }));
}

export function buildAccidentTrends(accidents: Accident[]): TrendDataPoint[] {
  const byMonth = new Map<
    string,
    TrendDataPoint & {
      sortKey: string;
    }
  >();

  for (const accident of accidents) {
    const date = new Date(accident.date);
    const sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const month = date.toLocaleString('en-US', { month: 'short', year: '2-digit' });
    const entry = byMonth.get(sortKey) ?? {
      month,
      sortKey,
      accidents: 0,
      injuries: 0,
      cost: 0,
    };

    entry.accidents += 1;
    entry.injuries += accident.injuries;
    entry.cost += accident.cost;
    byMonth.set(sortKey, entry);
  }

  return Array.from(byMonth.values())
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .map(({ sortKey: _sortKey, ...point }) => point);
}

export function generateAccidentId(count: number): string {
  return `ACC${String(count + 1).padStart(3, '0')}`;
}

export function validateNewAccident(form: NewAccidentForm): string | null {
  if (!form.vehicleRegistrationNumber?.trim() || !form.location?.trim() || !form.severity) {
    return 'Please fill in vehicle number, location, and severity';
  }
  return null;
}

export function buildAccidentFromForm(
  form: NewAccidentForm,
  user: { fullName?: string; username?: string; stationId?: string } | null,
  id: string
): Accident {
  return {
    id,
    tripId: 'TBD',
    date: new Date().toISOString(),
    location: form.location,
    severity: form.severity as Accident['severity'],
    vehicleId: 'TBD',
    driverId: 'TBD',
    driverName: 'Pending assignment',
    route: 'Route pending',
    passengersAboard: 0,
    injuries: parseInt(form.injuries, 10) || 0,
    fatalities: parseInt(form.fatalities, 10) || 0,
    description: form.description || 'No description provided.',
    cause: form.cause || 'unknown',
    weatherConditions: form.weatherConditions || 'unknown',
    roadConditions: form.roadConditions || 'unknown',
    timeOfDay: 'unknown',
    reportedBy: user?.fullName ?? user?.username ?? 'Administrator',
    stationId: user?.stationId ?? '',
    status: 'pending',
    insuranceClaim: 'pending',
    cost: 0,
  };
}
