import { parseListResponse } from '../utils/api/client';
import { revenueApi } from '../utils/api/revenue';

export interface RevenuePeriodItem {
  period: string;
  totalRevenue: number;
  tripRevenue?: number;
  penalties?: number;
  fuelCosts?: number;
  maintenanceCosts?: number;
  profit?: number;
  tripCount?: number;
  avgFarePerTrip?: number;
}

export interface StationRevenueItem {
  name: string;
  revenue: number;
  percentage?: number;
}

export interface RouteRevenueItem {
  route: string;
  revenue: number;
  trips: number;
  avgFare: number;
}

export interface PaymentMethodItem {
  name: string;
  value: number;
  color?: string;
}

export interface RevenueAnalytics {
  trendData: RevenuePeriodItem[];
  stationRevenue: StationRevenueItem[];
  routeRevenue: RouteRevenueItem[];
  paymentMethods: PaymentMethodItem[];
  totalRevenue: number;
  totalTrips: number;
  totalPassengers: number;
  avgRevenuePerTrip: number;
}

const PAYMENT_COLORS = ['#193cb8', '#00C49F', '#FFBB28', '#FF8042'];

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Cash',
  mobile_money: 'Mobile Money',
  card: 'Card',
  bank_transfer: 'Bank Transfer',
  other: 'Other',
};

interface NormalizedTrip {
  route: string;
  fare: number;
  bookedSeats: number;
  departureTime: string;
  stationName: string;
  status: string;
}

interface NormalizedTicket {
  fare: number;
  route: string;
  stationName: string;
  bookingDate: string;
  departureTime: string;
  status: string;
  paymentMethod?: string;
}

function normalizeTrip(item: Record<string, unknown>): NormalizedTrip {
  const routeFrom = String(item.routeFrom ?? '');
  const routeTo = String(item.routeTo ?? '');
  const route =
    String(item.route ?? '').trim() ||
    (routeFrom && routeTo ? `${routeFrom} → ${routeTo}` : routeFrom || routeTo || 'Unknown route');

  return {
    route,
    fare: Number(item.fare ?? item.totalFare ?? item.baseFare ?? 0),
    bookedSeats: Number(item.bookedSeats ?? item.booked ?? item.passengerCount ?? 0),
    departureTime: String(item.departureTime ?? ''),
    stationName: String(item.stationName ?? item.fromStationName ?? 'Unknown station'),
    status: String(item.status ?? ''),
  };
}

function normalizeTicket(item: Record<string, unknown>): NormalizedTicket {
  const routeFrom = String(item.routeFrom ?? '');
  const routeTo = String(item.routeTo ?? '');
  const route =
    routeFrom && routeTo ? `${routeFrom} → ${routeTo}` : routeFrom || routeTo || 'Unknown route';

  return {
    fare: Number(item.fare ?? 0),
    route,
    stationName: String(item.stationName ?? 'Unknown station'),
    bookingDate: String(item.bookingDate ?? item.createdAt ?? ''),
    departureTime: String(item.departureTime ?? ''),
    status: String(item.status ?? ''),
    paymentMethod: item.paymentMethod ? String(item.paymentMethod) : undefined,
  };
}

function isWithinPeriod(dateStr: string, period: string): boolean {
  if (!dateStr) return false;

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();

  if (period === 'daily') {
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  }

  if (period === 'quarterly') {
    const quarter = Math.floor(now.getMonth() / 3);
    const dateQuarter = Math.floor(date.getMonth() / 3);
    return date.getFullYear() === now.getFullYear() && quarter === dateQuarter;
  }

  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function getTrendBucket(dateStr: string, period: string): string {
  const date = new Date(dateStr);

  if (period === 'daily') {
    return date.toLocaleString('en-US', { hour: 'numeric', hour12: true });
  }

  if (period === 'quarterly') {
    return date.toLocaleString('en-US', { month: 'short' });
  }

  return date.toLocaleString('en-US', { day: 'numeric', month: 'short' });
}

function formatPaymentLabel(method: string): string {
  return PAYMENT_LABELS[method] ?? method.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function parseTrips(data: unknown): NormalizedTrip[] {
  return parseListResponse<Record<string, unknown>>(data, 'trips').map(normalizeTrip);
}

export function parseTickets(data: unknown): NormalizedTicket[] {
  return parseListResponse<Record<string, unknown>>(data, 'tickets').map(normalizeTicket);
}

export function buildRevenueAnalytics(
  tripsData: unknown,
  ticketsData: unknown,
  period: string
): RevenueAnalytics {
  const trips = parseTrips(tripsData).filter((trip) =>
    isWithinPeriod(trip.departureTime, period)
  );
  const tickets = parseTickets(ticketsData).filter(
    (ticket) =>
      ticket.status !== 'cancelled' &&
      isWithinPeriod(ticket.bookingDate || ticket.departureTime, period)
  );

  const trendMap = new Map<string, RevenuePeriodItem>();
  const stationMap = new Map<string, number>();
  const routeMap = new Map<string, { revenue: number; trips: number }>();
  const paymentMap = new Map<string, number>();

  const addTrend = (dateStr: string, revenue: number) => {
    const bucket = getTrendBucket(dateStr, period);
    const entry = trendMap.get(bucket) ?? {
      period: bucket,
      totalRevenue: 0,
      tripCount: 0,
    };
    entry.totalRevenue += revenue;
    entry.tripCount = (entry.tripCount ?? 0) + 1;
    trendMap.set(bucket, entry);
  };

  if (tickets.length > 0) {
    for (const ticket of tickets) {
      if (ticket.fare <= 0) continue;

      addTrend(ticket.bookingDate || ticket.departureTime, ticket.fare);

      stationMap.set(ticket.stationName, (stationMap.get(ticket.stationName) ?? 0) + ticket.fare);

      const routeEntry = routeMap.get(ticket.route) ?? { revenue: 0, trips: 0 };
      routeEntry.revenue += ticket.fare;
      routeEntry.trips += 1;
      routeMap.set(ticket.route, routeEntry);

      if (ticket.paymentMethod) {
        paymentMap.set(
          ticket.paymentMethod,
          (paymentMap.get(ticket.paymentMethod) ?? 0) + ticket.fare
        );
      }
    }
  } else {
    for (const trip of trips) {
      if (trip.bookedSeats <= 0 || trip.fare <= 0) continue;
      if (['cancelled', 'offloaded', 'broken_down'].includes(trip.status)) continue;

      const revenue = trip.fare * trip.bookedSeats;
      addTrend(trip.departureTime, revenue);

      stationMap.set(trip.stationName, (stationMap.get(trip.stationName) ?? 0) + revenue);

      const routeEntry = routeMap.get(trip.route) ?? { revenue: 0, trips: 0 };
      routeEntry.revenue += revenue;
      routeEntry.trips += 1;
      routeMap.set(trip.route, routeEntry);
    }
  }

  const totalRevenue = tickets.length
    ? tickets.reduce((sum, ticket) => sum + (ticket.fare > 0 ? ticket.fare : 0), 0)
    : trips.reduce((sum, trip) => {
        if (trip.bookedSeats <= 0 || trip.fare <= 0) return sum;
        if (['cancelled', 'offloaded', 'broken_down'].includes(trip.status)) return sum;
        return sum + trip.fare * trip.bookedSeats;
      }, 0);

  const totalTrips = trips.length;
  const totalPassengers = tickets.length > 0 ? tickets.length : trips.reduce((sum, trip) => sum + trip.bookedSeats, 0);
  const avgRevenuePerTrip = totalTrips > 0 ? totalRevenue / totalTrips : 0;

  const stationRevenue = Array.from(stationMap.entries())
    .map(([name, revenue]) => ({
      name,
      revenue,
      percentage: totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 100) : undefined,
    }))
    .filter((station) => station.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue);

  const routeRevenue = Array.from(routeMap.entries())
    .map(([route, data]) => ({
      route,
      revenue: data.revenue,
      trips: data.trips,
      avgFare: data.trips > 0 ? data.revenue / data.trips : 0,
    }))
    .filter((route) => route.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue);

  const paymentTotal = Array.from(paymentMap.values()).reduce((sum, value) => sum + value, 0);
  const paymentMethods = Array.from(paymentMap.entries())
    .map(([method, amount], index) => ({
      name: formatPaymentLabel(method),
      value: paymentTotal > 0 ? Math.round((amount / paymentTotal) * 100) : 0,
      color: PAYMENT_COLORS[index % PAYMENT_COLORS.length],
    }))
    .filter((method) => method.value > 0);

  const trendData = Array.from(trendMap.values()).filter((item) => item.totalRevenue > 0);

  return {
    trendData,
    stationRevenue,
    routeRevenue,
    paymentMethods,
    totalRevenue,
    totalTrips,
    totalPassengers,
    avgRevenuePerTrip,
  };
}

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

/** Load revenue dashboard from `/api/revenue/*` endpoints */
export async function loadRevenueFromApi(
  period: string,
  stationId?: string
): Promise<{ analytics: RevenueAnalytics; error?: string }> {
  const [summaryRes, byStationRes, byRouteRes, paymentRes] = await Promise.all([
    revenueApi.getSummary({ period, stationId }),
    revenueApi.getByStation({ period }),
    revenueApi.getByRoute({ period, stationId }),
    revenueApi.getPaymentMethods({ period, stationId }),
  ]);

  if (!summaryRes.success) {
    return {
      analytics: {
        trendData: [],
        stationRevenue: [],
        routeRevenue: [],
        paymentMethods: [],
        totalRevenue: 0,
        totalTrips: 0,
        totalPassengers: 0,
        avgRevenuePerTrip: 0,
      },
      error: summaryRes.error || 'Failed to load revenue summary',
    };
  }

  const summary = (summaryRes.data ?? {}) as Record<string, unknown>;
  const trendRaw = Array.isArray(summary.trendData)
    ? summary.trendData
    : [summary];

  const trendData: RevenuePeriodItem[] = trendRaw.map((item) => {
    const row = item as Record<string, unknown>;
    return {
      period: String(row.period ?? row.month ?? period),
      totalRevenue: toNumber(row.totalRevenue ?? row.revenue),
      tripRevenue: toNumber(row.tripRevenue),
      penalties: toNumber(row.penalties),
      fuelCosts: toNumber(row.fuelCosts),
      maintenanceCosts: toNumber(row.maintenanceCosts),
      profit: toNumber(row.profit),
      tripCount: toNumber(row.tripCount ?? row.trips),
      avgFarePerTrip: toNumber(row.avgFarePerTrip),
    };
  });

  const stationList = Array.isArray(byStationRes.data) ? byStationRes.data : [];
  const stationRevenue: StationRevenueItem[] = stationList.map((item) => {
    const row = item as Record<string, unknown>;
    const revenue = toNumber(row.revenue);
    return {
      name: String(row.stationName ?? row.name ?? 'Station'),
      revenue,
    };
  });

  const routeList = Array.isArray(byRouteRes.data) ? byRouteRes.data : [];
  const routeRevenue: RouteRevenueItem[] = routeList.map((item) => {
    const row = item as Record<string, unknown>;
    return {
      route: String(row.route ?? 'Route'),
      revenue: toNumber(row.revenue),
      trips: toNumber(row.trips),
      avgFare: toNumber(row.avgFare),
    };
  });

  const paymentList = Array.isArray(paymentRes.data) ? paymentRes.data : [];
  const paymentMethods: PaymentMethodItem[] = paymentList.map((item, index) => {
    const row = item as Record<string, unknown>;
    const method = String(row.method ?? row.name ?? 'other');
    return {
      name: formatPaymentLabel(method),
      value: toNumber(row.percentage ?? row.value),
      color: PAYMENT_COLORS[index % PAYMENT_COLORS.length],
    };
  });

  const totalRevenue = toNumber(summary.totalRevenue ?? summary.revenue);
  const totalTrips = toNumber(summary.tripCount ?? summary.trips);
  const totalPassengers = toNumber(summary.passengerCount ?? summary.passengers);
  const avgRevenuePerTrip = toNumber(
    summary.avgFarePerTrip ?? (totalTrips > 0 ? totalRevenue / totalTrips : 0)
  );

  return {
    analytics: {
      trendData,
      stationRevenue,
      routeRevenue,
      paymentMethods,
      totalRevenue,
      totalTrips,
      totalPassengers,
      avgRevenuePerTrip,
    },
    error:
      !byStationRes.success || !byRouteRes.success || !paymentRes.success
        ? byStationRes.error || byRouteRes.error || paymentRes.error
        : undefined,
  };
}
