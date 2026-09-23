export function extractArray(data: unknown, keys: string[]): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    for (const key of keys) {
      if (Array.isArray(record[key])) return record[key] as Record<string, unknown>[];
    }
  }
  return [];
}

export function num(data: Record<string, unknown> | null | undefined, ...keys: string[]): number {
  if (!data) return 0;
  for (const key of keys) {
    const value = data[key];
    if (value != null && value !== '') {
      const n = Number(value);
      if (Number.isFinite(n)) return n;
    }
  }
  return 0;
}

export function mapRevenueTrend(data: Record<string, unknown> | null) {
  return extractArray(data, ['revenueTrend', 'monthlyRevenue', 'revenueData', 'trends']).map(
    (item) => ({
      month: String(item.month ?? item.period ?? item.name ?? ''),
      revenue: Number(item.revenue ?? item.totalRevenue ?? 0),
      trips: Number(item.trips ?? item.tripCount ?? 0),
      passengers: Number(item.passengers ?? item.passengerCount ?? 0),
    })
  );
}

export function mapDailyTrends(data: Record<string, unknown> | null) {
  return extractArray(data, ['dailyTrends', 'passengerTrends', 'dailyRevenue', 'weekdayTrends']).map(
    (item) => ({
      day: String(item.day ?? item.name ?? ''),
      passengers: Number(item.passengers ?? 0),
      revenue: Number(item.revenue ?? 0),
    })
  );
}

export function mapRoutePerformance(data: Record<string, unknown> | null) {
  return extractArray(data, ['routePerformance', 'routes', 'routePerformanceData']).map((item) => ({
    route: String(item.route ?? item.name ?? ''),
    trips: Number(item.trips ?? 0),
    revenue: Number(item.revenue ?? 0),
    occupancy: Number(item.occupancy ?? item.loadFactor ?? 0),
  }));
}

export function mapTripStatus(data: Record<string, unknown> | null, colors: string[]) {
  return extractArray(data, ['tripStatus', 'tripStatusData', 'statusDistribution'])
    .map((item, index) => ({
      name: String(item.name ?? item.status ?? 'Unknown'),
      value: Number(item.value ?? item.count ?? 0),
      color: String(item.color ?? colors[index % colors.length]),
    }))
    .filter((item) => item.value > 0);
}

export function mapPerformanceIndicators(data: Record<string, unknown> | null) {
  return extractArray(data, ['performanceIndicators', 'indicators', 'metrics']);
}

export function mapMonthlyComparison(data: Record<string, unknown> | null) {
  return extractArray(data, ['monthlyComparison', 'comparisons']);
}
