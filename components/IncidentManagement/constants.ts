import type { NewIncidentForm } from './types';

export const DEFAULT_NEW_INCIDENT: NewIncidentForm = {
  title: '',
  description: '',
  type: '',
  severity: '',
  region: '',
  location: '',
  vehicleMode: 'public',
  registeredVehicleId: '',
  vehicleRegNumber: '',
  driverName: '',
  passengersInvolved: '',
  injuriesReported: '',
  fatalitiesReported: '',
  contactNumber: '',
  contactEmail: '',
  weatherConditions: '',
  roadConditions: '',
  timeOfDay: '',
  emergencyServices: [],
  reportSource: 'internal',
};

export const GHANA_BOUNDS = {
  north: 11.2,
  south: 4.5,
  east: 1.3,
  west: -3.5,
};

export const DEFAULT_MAP_CENTER = { lat: 5.56, lng: -0.2057 };

export const INCIDENT_TYPE_OPTIONS = [
  { value: 'accident', label: 'Traffic Accident' },
  { value: 'breakdown', label: 'Vehicle Breakdown' },
  { value: 'theft', label: 'Theft / Robbery' },
  { value: 'violence', label: 'Violence / Assault' },
  { value: 'medical', label: 'Medical Emergency' },
  { value: 'other', label: 'Other' },
] as const;

export const SEVERITY_OPTIONS = [
  { value: 'low', label: 'Low', description: 'Minor issue' },
  { value: 'medium', label: 'Medium', description: 'Moderate concern' },
  { value: 'high', label: 'High', description: 'Serious situation' },
  { value: 'critical', label: 'Critical', description: 'Life threatening' },
] as const;

export const STATUS_OPTIONS = [
  { value: 'reported', label: 'Reported' },
  { value: 'investigating', label: 'Investigating' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'couldnt_fix', label: "Couldn't fix" },
  { value: 'closed', label: 'Closed' },
] as const;

/** Statuses operators may set after initial report (excludes auto "reported"). */
export const INCIDENT_WORKFLOW_STATUS_OPTIONS = STATUS_OPTIONS;

export const CONFIRMATION_AGENCY_OPTIONS = [
  { value: 'mttd', label: 'MTTD' },
  { value: 'fire_service', label: 'Fire Services' },
  { value: 'road_safety', label: 'National Road Safety Authority' },
  { value: 'police', label: 'Ghana Police Service' },
] as const;

export const VEHICLE_MODE_OPTIONS = [
  { value: 'public', label: 'Public / registered vehicle (RISE fleet)' },
  { value: 'other', label: 'Other vehicle (manual entry)' },
] as const;

export const TIME_OF_DAY_OPTIONS = [
  { value: 'morning', label: 'Morning (6AM – 12PM)' },
  { value: 'afternoon', label: 'Afternoon (12PM – 6PM)' },
  { value: 'evening', label: 'Evening (6PM – 9PM)' },
  { value: 'night', label: 'Night (9PM – 6AM)' },
] as const;

export const WEATHER_OPTIONS = [
  { value: 'clear', label: 'Clear / Sunny' },
  { value: 'cloudy', label: 'Cloudy / Overcast' },
  { value: 'light-rain', label: 'Light Rain' },
  { value: 'heavy-rain', label: 'Heavy Rain' },
  { value: 'fog', label: 'Fog / Mist' },
  { value: 'windy', label: 'Windy' },
] as const;

export const ROAD_OPTIONS = [
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
  { value: 'wet', label: 'Wet / Slippery' },
  { value: 'construction', label: 'Under Construction' },
  { value: 'blocked', label: 'Blocked / Obstructed' },
] as const;
