import { getTripSeatStats } from './tripSeats';

type TripLike = Record<string, unknown>;

const CLOSED_TRIP_STATUSES = new Set([
  'arrived',
  'completed',
  'cancelled',
  'unsuccessful',
  'on_road',
  'journey_started',
]);

export function isBranchManagerRole(role?: string | null): boolean {
  return (
    role === 'station_manager' ||
    role === 'super_admin' ||
    role === 'admin' ||
    role === 'regional_manager' ||
    role === 'district_manager'
  );
}

/** Trips that are full or fully booked — hidden from station workers for new bookings. */
export function isTripClosedForNewBookings(trip: TripLike): boolean {
  const status = String(trip.status ?? '');
  if (CLOSED_TRIP_STATUSES.has(status)) return true;
  if (status === 'booked') return true;
  return getTripSeatStats(trip).isFull;
}

export function isTripVisibleInPassengerManagement(
  trip: TripLike,
  isManager: boolean
): boolean {
  const status = String(trip.status ?? '');
  if (['arrived', 'completed', 'cancelled'].includes(status)) {
    return isManager;
  }
  if (!isManager && isTripClosedForNewBookings(trip)) {
    return false;
  }
  return true;
}

export function filterTripsForBookingList(
  trips: TripLike[],
  isManager: boolean
): TripLike[] {
  return trips.filter((trip) => isTripVisibleInPassengerManagement(trip, isManager));
}
