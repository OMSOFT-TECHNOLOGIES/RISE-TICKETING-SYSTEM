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
