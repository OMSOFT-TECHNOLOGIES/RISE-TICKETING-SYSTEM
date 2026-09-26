type TripSeatSource = {
  capacity?: unknown;
  booked?: unknown;
  bookedSeats?: unknown;
  available?: unknown;
};

export function getTripSeatStats(trip: TripSeatSource) {
  const capacity = Math.max(0, Number(trip.capacity ?? 0));
  const booked = Math.max(0, Number(trip.booked ?? trip.bookedSeats ?? 0));
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
