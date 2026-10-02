export const COMPLAINT_CATEGORIES = [
  { value: 'vehicle_condition', label: 'Vehicle Condition' },
  { value: 'driver_behavior', label: 'Driver Behavior' },
  { value: 'delay', label: 'Delay/Schedule' },
  { value: 'trip_cancellation', label: 'Trip Cancellation' },
  { value: 'customer_service', label: 'Customer Service' },
  { value: 'pricing', label: 'Pricing/Billing' },
  { value: 'safety', label: 'Safety Concerns' },
  { value: 'other', label: 'Other' },
] as const;

export const FEEDBACK_TAB_TRIGGER_CLASS =
  'justify-center gap-1.5 px-2 sm:px-3 text-xs sm:text-sm font-medium';
