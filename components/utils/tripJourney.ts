import { formatApiError, passengerApi, parseListResponse, tripApi } from './api';
import {
  issuePoliceCheckToken,
  policeReceiptFromTrip,
  printPoliceReceiptCheck,
} from './policeReceiptCheck';
import { getDefaultTripTiers, parseTripTiersFromApi } from './tripTier';

export async function fetchTripManifest(tripId: string) {
  const manifestRes = await passengerApi.getTripPassengers(tripId);
  if (!manifestRes.success || !manifestRes.data) return [];
  return parseListResponse<Record<string, unknown>>(manifestRes.data, 'passengers');
}

export function canStartTripJourney(trip: Record<string, unknown>): boolean {
  const status = String(trip.status ?? 'scheduled');
  if (
    [
      'journey_started',
      'on_road',
      'arrived',
      'cancelled',
      'unsuccessful',
      'replaced',
    ].includes(status)
  ) {
    return false;
  }
  const booked = Math.max(0, Number(trip.booked ?? trip.bookedSeats ?? 0));
  return booked > 0;
}

export function canPrintPoliceCheck(trip: Record<string, unknown>): boolean {
  const status = String(trip.status ?? '');
  return status === 'journey_started' || status === 'on_road';
}

async function printPoliceManifest(
  tripId: string,
  trip: Record<string, unknown>,
  stationName: string,
  branchPhone?: string
): Promise<boolean> {
  const passengers = await fetchTripManifest(tripId);
  if (passengers.length === 0) {
    return false;
  }
  const policeCheck = await issuePoliceCheckToken(tripId);
  if (!policeCheck) {
    return false;
  }
  const tiersRes = await tripApi.getCommissionTiers();
  const tiers =
    tiersRes.success && tiersRes.data
      ? parseTripTiersFromApi(tiersRes.data)
      : getDefaultTripTiers();
  printPoliceReceiptCheck(
    policeReceiptFromTrip(trip, passengers, stationName, branchPhone, policeCheck, tiers)
  );
  return true;
}

export async function startTripJourneyAndPrint(params: {
  tripId: string;
  trip: Record<string, unknown>;
  stationName: string;
  branchPhone?: string;
}): Promise<{ ok: boolean; error?: string; updatedTrip?: Record<string, unknown> }> {
  const passengers = await fetchTripManifest(params.tripId);
  if (passengers.length === 0) {
    return { ok: false, error: 'Add at least one passenger before starting the journey' };
  }
  const response = await tripApi.updateStatus(params.tripId, 'journey_started');
  if (!response.success) {
    return { ok: false, error: formatApiError(response.error, 'Failed to start journey') };
  }
  const updated = (response.data ?? {
    ...params.trip,
    status: 'journey_started',
  }) as Record<string, unknown>;
  const printed = await printPoliceManifest(
    params.tripId,
    updated,
    params.stationName,
    params.branchPhone
  );
  if (!printed) {
    return { ok: false, error: 'Journey started but police check could not be printed' };
  }
  return { ok: true, updatedTrip: updated };
}

export async function printPoliceCheckForTrip(params: {
  tripId: string;
  trip: Record<string, unknown>;
  stationName: string;
  branchPhone?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const passengers = await fetchTripManifest(params.tripId);
  if (passengers.length === 0) {
    return { ok: false, error: 'No passengers on manifest' };
  }
  const printed = await printPoliceManifest(
    params.tripId,
    params.trip,
    params.stationName,
    params.branchPhone
  );
  if (!printed) {
    return { ok: false, error: 'Could not generate police check QR codes' };
  }
  return { ok: true };
}
