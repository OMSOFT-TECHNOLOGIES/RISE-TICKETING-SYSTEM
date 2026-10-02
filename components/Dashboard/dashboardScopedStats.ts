import type { Period } from './dashboardProfile';
import type { DashboardScopeQuery } from './dashboardScope';
import {
  extractListTotal,
  extractStatCount,
  incidentApi,
  incidentClaimApi,
  stationApi,
  tripApi,
  userApi,
  vehicleApi,
} from '../utils/api';

export function hasGeoDashboardScope(scope: DashboardScopeQuery): boolean {
  return Boolean(scope.region?.trim() || scope.district?.trim());
}

type RangeQuery = {
  period: Period;
  from: string;
  to: string;
  date: string;
};

function scopeQueryParams(scope: DashboardScopeQuery) {
  return {
    ...(scope.stationId ? { stationId: scope.stationId } : {}),
    ...(scope.region ? { region: scope.region } : {}),
    ...(scope.district ? { district: scope.district } : {}),
  };
}

function mapIncidentStats(data: Record<string, unknown>): Record<string, number> {
  const reported = Number(data.reported ?? 0);
  const confirmed = Number(data.confirmed ?? 0);
  const investigating = Number(data.investigating ?? 0);
  const resolved = Number(data.resolved ?? 0);
  const total = Number(data.total ?? 0);
  const critical = Number(data.critical ?? 0);
  const high = Number(data.high ?? 0);

  const openFromFields = extractStatCount(data, [
    'openIncidents',
    'activeIncidents',
    'open',
  ]);
  const open =
    openFromFields > 0
      ? openFromFields
      : total > 0
        ? Math.max(0, total - resolved)
        : reported + confirmed + investigating;

  return {
    openIncidents: open,
    activeIncidents: open,
    criticalIncidents: critical,
    highSeverityIncidents: high,
    investigatingIncidents: investigating,
  };
}

function mapTripStats(data: Record<string, unknown>, period: Period): Record<string, number> {
  const revenue = extractStatCount(data, [
    period === 'daily' ? 'dailyRevenue' : period === 'yearly' ? 'yearlyRevenue' : 'monthlyRevenue',
    'monthlyRevenue',
    'revenueToday',
    'todayRevenue',
    'totalRevenue',
    'revenue',
  ]);
  const trips = extractStatCount(data, [
    'totalTrips',
    'trips',
    'todayTrips',
    'tripCount',
  ]);
  const onRoad = extractStatCount(data, [
    'tripsOnRoad',
    'inProgressTrips',
    'activeTrips',
    'ongoingTrips',
  ]);

  const out: Record<string, number> = {};
  if (revenue > 0) out.monthlyRevenue = revenue;
  if (trips > 0) out.totalTrips = trips;
  if (onRoad > 0) out.tripsOnRoad = onRoad;
  return out;
}

function mapClaimStats(data: Record<string, unknown>): Record<string, number> {
  const pending = extractStatCount(data, [
    'pendingClaims',
    'pending',
    'awaitingReview',
    'submitted',
  ]);
  const awaitingInvestigator = extractStatCount(data, [
    'awaitingInvestigatorClaims',
    'awaitingInvestigator',
    'investigatorPending',
  ]);
  const out: Record<string, number> = {};
  if (pending > 0) out.pendingClaims = pending;
  if (awaitingInvestigator > 0) out.awaitingInvestigatorClaims = awaitingInvestigator;
  return out;
}

/**
 * KPIs from entity list/statistics endpoints (respect role assignment on the API).
 * Merged over `/api/dashboard/admin|overview` when region/district scope is active.
 */
export async function fetchGeoScopedDashboardRaw(
  scope: DashboardScopeQuery,
  rangeQuery: RangeQuery
): Promise<Record<string, unknown>> {
  const geo = scopeQueryParams(scope);

  const [stationsRes, usersRes, vehiclesRes, tripsRes, incidentsRes, claimsRes] =
    await Promise.all([
      stationApi.getAll({ page: 1, limit: 1, ...geo }),
      userApi.getAll({
        page: 1,
        limit: 1,
        ...(scope.region ? { region: scope.region } : {}),
      }),
      vehicleApi.getStatistics(geo),
      tripApi.getStatistics({ ...rangeQuery, ...geo }),
      incidentApi.getStatistics({
        region: scope.region,
        district: scope.district,
      }),
      incidentClaimApi.getStatistics(),
    ]);

  const merged: Record<string, unknown> = {};

  if (stationsRes.success) {
    merged.totalStations = extractListTotal(stationsRes.data, 'stations');
  }
  if (usersRes.success) {
    merged.totalUsers = extractListTotal(usersRes.data, 'users');
  }
  if (vehiclesRes.success && vehiclesRes.data && typeof vehiclesRes.data === 'object') {
    const count = extractStatCount(vehiclesRes.data as Record<string, unknown>, [
      'totalVehicles',
      'total',
      'fleetTotal',
      'activeVehicles',
      'vehicleCount',
    ]);
    if (count > 0) merged.totalVehicles = count;
  }
  if (tripsRes.success && tripsRes.data && typeof tripsRes.data === 'object') {
    Object.assign(merged, mapTripStats(tripsRes.data as Record<string, unknown>, rangeQuery.period));
  }
  if (incidentsRes.success && incidentsRes.data && typeof incidentsRes.data === 'object') {
    Object.assign(merged, mapIncidentStats(incidentsRes.data as Record<string, unknown>));
  }
  if (claimsRes.success && claimsRes.data && typeof claimsRes.data === 'object') {
    Object.assign(merged, mapClaimStats(claimsRes.data as Record<string, unknown>));
  }

  return merged;
}
