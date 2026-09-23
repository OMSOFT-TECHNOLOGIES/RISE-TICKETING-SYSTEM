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
  'rounded-md py-2.5 text-sm font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:font-semibold data-[state=active]:ring-1 data-[state=active]:ring-amber-700/40';
