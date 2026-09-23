import type { NewAccidentForm } from './types';

export const ACCIDENT_TAB_TRIGGER_CLASS =
  'rounded-md py-2.5 text-sm font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:font-semibold data-[state=active]:ring-1 data-[state=active]:ring-red-700/40';

export const DEFAULT_NEW_ACCIDENT: NewAccidentForm = {
  vehicleRegistrationNumber: '',
  location: '',
  severity: '',
  description: '',
  injuries: '',
  fatalities: '',
  cause: '',
  weatherConditions: '',
  roadConditions: '',
};

export const SEVERITY_OPTIONS = [
  { value: 'minor', label: 'Minor' },
  { value: 'major', label: 'Major' },
  { value: 'critical', label: 'Critical' },
] as const;

export const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'investigated', label: 'Investigated' },
  { value: 'under_investigation', label: 'Under Investigation' },
  { value: 'closed', label: 'Closed' },
] as const;

export const CAUSE_OPTIONS = [
  { value: 'driver_error', label: 'Driver Error' },
  { value: 'weather', label: 'Weather' },
  { value: 'mechanical_failure', label: 'Mechanical Failure' },
  { value: 'road_conditions', label: 'Road Conditions' },
  { value: 'other_vehicle', label: 'Other Vehicle' },
  { value: 'unknown', label: 'Unknown' },
] as const;

export const WEATHER_OPTIONS = [
  { value: 'clear', label: 'Clear' },
  { value: 'rain', label: 'Rain' },
  { value: 'heavy_rain', label: 'Heavy Rain' },
  { value: 'fog', label: 'Fog' },
  { value: 'storm', label: 'Storm' },
] as const;

export const ROAD_OPTIONS = [
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
  { value: 'under_construction', label: 'Under Construction' },
] as const;

export const REPORT_TEMPLATES = [
  {
    id: 'safety',
    title: 'Safety Report',
    description: 'Comprehensive safety analysis and recommendations',
    icon: 'file' as const,
  },
  {
    id: 'monthly',
    title: 'Monthly Summary',
    description: 'Monthly accident statistics and trends',
    icon: 'chart' as const,
  },
  {
    id: 'vehicle',
    title: 'Vehicle Safety',
    description: 'Vehicle-specific patterns and maintenance needs',
    icon: 'car' as const,
  },
];
