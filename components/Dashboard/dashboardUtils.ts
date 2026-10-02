import type { DashboardStatsSource, Period } from './dashboardProfile';

export const REGION_COLORS = ['#193cb8', '#10b981', '#f59e0b', '#6366f1', '#ec4899'];

export type ChartPoint = {
  name: string;
  trips: number;
  revenue: number;
  passengers: number;
};

export type RegionPoint = {
  name: string;
  value: number;
  trips?: number;
  share?: number;
  color?: string;
};

export type ActivityItem = {
  id: string | number;
  type: string;
  message: string;
  time: string;
};

function rawArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    const nested = record.points ?? record.data ?? record.chart ?? record.regions;
    if (Array.isArray(nested)) return nested;
  }
  return [];
}

export function normalizeChartData(data: unknown): ChartPoint[] {
  return rawArray(data).map((item) => {
    const row = item as Record<string, unknown>;
    const label = String(row.date ?? row.name ?? '');
    const shortName =
      label.length >= 10 && label.includes('-') ? label.slice(5) : label;
    const trips = Number(row.trips ?? 0);
    return {
      name: shortName || '—',
      trips,
      revenue: Number(row.revenue ?? 0),
      passengers: Number(row.passengers ?? 0),
    };
  });
}

export function normalizeRegionData(data: unknown): RegionPoint[] {
  const rows = rawArray(data);
  const totalTrips = rows.reduce((sum, item) => {
    const row = item as Record<string, unknown>;
    return sum + Number(row.trips ?? row.value ?? 0);
  }, 0);

  return rows.map((item, index) => {
    const row = item as Record<string, unknown>;
    const trips = Number(row.trips ?? 0);
    const share = totalTrips > 0 ? Math.round((trips / totalTrips) * 100) : 0;
    const sliceSize = trips > 0 ? trips : Number(row.value ?? 0);

    return {
      name: String(row.region ?? row.name ?? 'Unknown'),
      value: sliceSize,
      trips: trips || undefined,
      share: share || undefined,
      color: (row.color as string | undefined) ?? REGION_COLORS[index % REGION_COLORS.length],
    };
  });
}

export function normalizeActivities(data: unknown): ActivityItem[] {
  return rawArray(data).map((item, index) => {
    const row = item as Record<string, unknown>;
    const timestamp = String(row.timestamp ?? row.time ?? '');
    return {
      id: row.id ?? `${row.type ?? 'activity'}-${index}`,
      type: String(row.type ?? 'info'),
      message: String(row.message ?? ''),
      time: formatActivityTime(timestamp),
    };
  });
}

function formatActivityTime(iso: string): string {
  if (!iso) return '';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** @deprecated use normalizeChartData */
export function extractChartData(data: unknown): ChartPoint[] {
  return normalizeChartData(data);
}

/** @deprecated use normalizeRegionData */
export function extractRegionData(data: unknown): RegionPoint[] {
  return normalizeRegionData(data);
}

export function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** Flatten common `{ stats: { ... } }` / `{ kpis: { ... } }` dashboard payloads. */
export function unwrapDashboardStatsPayload(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object') return {};
  const record = { ...(raw as Record<string, unknown>) };
  for (const nestKey of ['stats', 'kpis', 'metrics', 'overview'] as const) {
    const nested = record[nestKey];
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      Object.assign(record, nested as Record<string, unknown>);
    }
  }
  return record;
}

export function mapPeriodToStationStatistics(period: Period): string {
  if (period === 'daily') return 'daily';
  if (period === 'yearly') return 'monthly';
  return 'monthly';
}

function firstNumeric(data: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = data[key];
    if (value != null && value !== '' && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return null;
}

const TRIPS_TODAY_KEYS = [
  'todayTrips',
  'tripsToday',
  'todayTripCount',
  'tripsTodayCount',
] as const;

/** Trips departing today when the API sends an explicit count (not lifetime totals). */
export function readTripsTodayFromStats(data: Record<string, unknown>): number | null {
  return firstNumeric(data, [...TRIPS_TODAY_KEYS]);
}

/**
 * Map dashboard API fields onto stat card keys.
 * Daily revenue uses period-specific fields only — never lifetime `revenue` / `totalRevenue`.
 */
export function normalizeDashboardStats(
  raw: unknown,
  period: Period,
  source: DashboardStatsSource
): Record<string, number> {
  const data = unwrapDashboardStatsPayload(raw);
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'number' || typeof value === 'string') {
      const num = Number(value);
      if (Number.isFinite(num)) out[key] = num;
    }
  }

  const adminRevenueKeys =
    period === 'daily'
      ? ['monthlyRevenue', 'dailyRevenue', 'revenueToday', 'todayRevenue']
      : period === 'yearly'
        ? ['monthlyRevenue', 'yearlyRevenue', 'revenueYtd']
        : ['monthlyRevenue', 'revenueThisMonth'];

  const stationRevenueKeys =
    period === 'daily'
      ? [
          'stationRevenue',
          'todayRevenue',
          'dailyRevenue',
          'revenueToday',
          'todayRevenue',
        ]
      : period === 'yearly'
        ? ['stationRevenue', 'yearlyRevenue', 'revenueYtd', 'monthlyRevenue']
        : ['stationRevenue', 'revenueThisMonth', 'monthlyRevenue', 'revenue'];

  const stationCommissionKeys =
    period === 'daily'
      ? [
          'stationCommission',
          'todayCommission',
          'dailyCommission',
          'commissionToday',
          'totalCommission',
          'commission',
          'tripCommission',
        ]
      : period === 'yearly'
        ? [
            'stationCommission',
            'yearlyCommission',
            'commissionYtd',
            'monthlyCommission',
            'totalCommission',
          ]
        : [
            'stationCommission',
            'monthlyCommission',
            'commissionThisMonth',
            'totalCommission',
            'commission',
          ];

  if (source === 'admin') {
    const revenue = firstNumeric(data, adminRevenueKeys);
    out.monthlyRevenue = revenue ?? 0;

    const trips = firstNumeric(data, [
      'totalTrips',
      'tripsInPeriod',
      'scheduledTrips',
      'todayTrips',
      ...TRIPS_TODAY_KEYS,
    ]);
    if (trips != null && out.totalTrips == null) out.totalTrips = trips;

    const drivers = firstNumeric(data, ['totalDrivers', 'activeDrivers', 'driverCount']);
    if (drivers != null && out.totalDrivers == null) out.totalDrivers = drivers;

    const passengers = firstNumeric(data, [
      'totalPassengers',
      'passengersBooked',
      'passengerCount',
      'passengers',
    ]);
    if (passengers != null && out.totalPassengers == null) out.totalPassengers = passengers;

    const incidents = firstNumeric(data, [
      'activeIncidents',
      'openIncidents',
      'investigatingIncidents',
    ]);
    if (incidents != null && out.activeIncidents == null) out.activeIncidents = incidents;
  }

  if (source === 'station') {
    const stationRevenue = firstNumeric(data, stationRevenueKeys);
    out.stationRevenue = stationRevenue ?? 0;

    const stationCommission = firstNumeric(data, stationCommissionKeys);
    out.stationCommission = stationCommission ?? out.stationCommission ?? 0;

    const vehicles = firstNumeric(data, ['stationVehicles', 'activeVehicles', 'vehicleCount']);
    if (vehicles != null) out.stationVehicles = vehicles;

    const drivers = firstNumeric(data, ['activeDrivers', 'driverCount']);
    if (drivers != null) out.activeDrivers = drivers;

    const tripsToday = readTripsTodayFromStats(data);
    if (tripsToday != null) out.todayTrips = tripsToday;
  }

  return out;
}

/** Merge dashboard + station statistics API payloads (same period). */
export function mergeDashboardStatPayloads(
  ...sources: (unknown | null | undefined)[]
): Record<string, unknown> {
  return sources.reduce<Record<string, unknown>>((acc, raw) => {
    if (raw == null) return acc;
    return { ...acc, ...unwrapDashboardStatsPayload(raw) };
  }, {});
}

export function formatStatValue(
  value: unknown,
  format?: 'currency' | 'number'
): string | number {
  const num = Number(value ?? 0);
  if (format === 'currency') {
    return `₵${num.toLocaleString()}`;
  }
  return Number.isFinite(num) ? num : 0;
}
