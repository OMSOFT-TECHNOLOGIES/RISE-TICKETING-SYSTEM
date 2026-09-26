export const TRIP_OPERATION_STATUSES = [
  { value: 'scheduled', label: 'Scheduled', color: 'bg-[#193cb8]/10 text-[#193cb8]' },
  { value: 'loading', label: 'Loading / Booking', color: 'bg-amber-100 text-amber-900' },
  { value: 'booked', label: 'Fully booked', color: 'bg-yellow-100 text-yellow-900' },
  {
    value: 'journey_started',
    label: 'Journey started',
    color: 'bg-green-100 text-green-800',
  },
  { value: 'on_road', label: 'On the road', color: 'bg-green-100 text-green-800' },
  { value: 'arrived', label: 'Arrived safely', color: 'bg-emerald-100 text-emerald-900' },
  { value: 'issue_on_road', label: 'Issue on road', color: 'bg-orange-100 text-orange-900' },
  { value: 'replaced', label: 'Vehicle replaced', color: 'bg-purple-100 text-purple-900' },
  { value: 'unsuccessful', label: 'Unsuccessful', color: 'bg-red-100 text-red-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
] as const;

export type TripOperationStatus = (typeof TRIP_OPERATION_STATUSES)[number]['value'];

export function tripStatusLabel(status: string): string {
  return TRIP_OPERATION_STATUSES.find((s) => s.value === status)?.label ?? status;
}

/** Statuses that require a free-text reason when set (validated on API). */
export const TRIP_STATUSES_REQUIRING_REASON = [
  'replaced',
  'cancelled',
  'unsuccessful',
  'issue_on_road',
] as const;

export function tripStatusRequiresReason(status: string): boolean {
  return (TRIP_STATUSES_REQUIRING_REASON as readonly string[]).includes(status);
}
