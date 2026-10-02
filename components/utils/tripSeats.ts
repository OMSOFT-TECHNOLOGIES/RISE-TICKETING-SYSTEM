type TripSeatSource = {
  capacity?: unknown;
  booked?: unknown;
  bookedSeats?: unknown;
  available?: unknown;
  passengerCount?: unknown;
};

type PassengerSeatSource = {
  seats?: unknown;
  seatCount?: unknown;
  numberOfSeats?: unknown;
};

/** Seats reserved by one passenger booking (defaults to 1). */
export function readPassengerSeatCount(passenger: PassengerSeatSource): number {
  const raw =
    passenger.seats ?? passenger.seatCount ?? passenger.numberOfSeats ?? 1;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
}

/** Sum seat counts across a trip manifest. */
export function sumPassengerSeatsFromManifest(
  passengers: PassengerSeatSource[] | undefined | null
): number {
  if (!passengers?.length) return 0;
  return passengers.reduce((sum, p) => sum + readPassengerSeatCount(p), 0);
}

function readNumericField(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * Resolve how many seats are booked on a trip.
 * Prefer explicit seat totals from the API; use manifest sum when it is higher
 * (backend sometimes increments passenger count by 1 regardless of `seats` booked).
 */
export function resolveTripBookedSeats(
  trip: TripSeatSource,
  passengers?: PassengerSeatSource[] | null
): number {
  const bookedSeats = readNumericField(trip.bookedSeats);
  const booked = readNumericField(trip.booked);
  const passengerCount = readNumericField(trip.passengerCount);

  let fromTrip = 0;
  if (bookedSeats != null) {
    fromTrip = bookedSeats;
  } else if (booked != null) {
    fromTrip = booked;
  } else if (passengerCount != null) {
    fromTrip = passengerCount;
  }

  const fromManifest = sumPassengerSeatsFromManifest(passengers ?? undefined);
  if (fromManifest > 0) {
    return Math.max(fromTrip, fromManifest);
  }
  return fromTrip;
}

export function getTripSeatStats(
  trip: TripSeatSource,
  options?: { passengers?: PassengerSeatSource[] | null }
) {
  const capacity = Math.max(0, Number(trip.capacity ?? 0));
  const booked = resolveTripBookedSeats(trip, options?.passengers);
  const remaining =
    capacity > 0 ? Math.max(0, capacity - booked) : Math.max(0, Number(trip.available ?? 0));
  const isFull = capacity > 0 && booked >= capacity;
  return {
    capacity,
    booked,
    remaining,
    isFull,
    canBook: capacity > 0 && booked < capacity,
  };
}

/** Apply additional booked seats on the client when the API lagged behind a multi-seat booking. */
export function patchTripWithBookedSeats<T extends TripSeatSource>(
  trip: T,
  bookedSeats: number
): T & { booked: number; bookedSeats: number; available: number; isFull: boolean; canBook: boolean } {
  const capacity = Math.max(0, Number(trip.capacity ?? 0));
  const booked = Math.max(0, bookedSeats);
  const remaining = capacity > 0 ? Math.max(0, capacity - booked) : 0;
  const isFull = capacity > 0 && booked >= capacity;
  return {
    ...trip,
    booked,
    bookedSeats: booked,
    available: remaining,
    isFull,
    canBook: capacity > 0 && booked < capacity,
  };
}

export function mergeTripSeatUpdateFromApi(
  trip: TripSeatSource,
  apiTrip: TripSeatSource | undefined | null,
  seatsJustBooked?: number
): ReturnType<typeof patchTripWithBookedSeats> {
  const base = resolveTripBookedSeats(trip);
  const fromApi = apiTrip ? resolveTripBookedSeats(apiTrip) : 0;
  const bumped =
    seatsJustBooked != null && seatsJustBooked > 0
      ? base + seatsJustBooked
      : base;
  return patchTripWithBookedSeats(trip, Math.max(fromApi, bumped));
}
