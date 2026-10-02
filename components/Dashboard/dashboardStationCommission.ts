import type { Period } from './dashboardProfile';
import { resolveDashboardPeriodBounds } from './dashboardPeriodRange';
import { parseListResponse, tripApi } from '../utils/api';
import { getTripDepartureIso } from '../utils/tripDateTime';
import { getTripSeatStats } from '../utils/tripSeats';
import {
  calculateTierInfo,
  getDefaultTripTiers,
  parseTripTiersFromApi,
} from '../utils/tripTier';

function tripDepartureDateKey(trip: Record<string, unknown>): string {
  const dep = trip.departureDate;
  if (typeof dep === 'string' && dep.trim()) {
    return dep.trim().slice(0, 10);
  }
  return getTripDepartureIso(trip).slice(0, 10);
}

function tripWithinBounds(
  trip: Record<string, unknown>,
  from: string,
  to: string
): boolean {
  const key = tripDepartureDateKey(trip);
  if (!key) return false;
  return key >= from && key <= to;
}

/**
 * RISE commission owed for booked seats at the station (tier × seats per trip).
 * Used when dashboard APIs do not yet expose `stationCommission`.
 */
export async function computeStationCommissionForPeriod(params: {
  stationId: string;
  period: Period;
  periodOffset: number;
}): Promise<number> {
  const bounds = resolveDashboardPeriodBounds(params.period, params.periodOffset);

  const tiersRes = await tripApi.getCommissionTiers();
  const tiers =
    tiersRes.success && tiersRes.data
      ? parseTripTiersFromApi(tiersRes.data)
      : getDefaultTripTiers();

  let trips: Record<string, unknown>[] = [];

  if (params.period === 'daily') {
    const res = await tripApi.getAll({
      stationId: params.stationId,
      date: bounds.date,
      limit: 500,
      page: 1,
    });
    if (res.success && res.data) {
      trips = parseListResponse<Record<string, unknown>>(res.data, 'trips');
    }
  } else {
    const res = await tripApi.getAll({
      stationId: params.stationId,
      limit: 500,
      page: 1,
    });
    if (res.success && res.data) {
      trips = parseListResponse<Record<string, unknown>>(res.data, 'trips').filter((trip) =>
        tripWithinBounds(trip, bounds.from, bounds.to)
      );
    }
  }

  let totalCommission = 0;
  for (const trip of trips) {
    const booked = getTripSeatStats(trip).booked;
    if (booked <= 0) continue;
    const fare = Number(trip.fare ?? trip.baseFare ?? trip.totalFare ?? 0);
    if (!Number.isFinite(fare) || fare <= 0) continue;
    totalCommission += calculateTierInfo(tiers, fare, booked).totalCommission;
  }

  return Math.round(totalCommission * 100) / 100;
}
