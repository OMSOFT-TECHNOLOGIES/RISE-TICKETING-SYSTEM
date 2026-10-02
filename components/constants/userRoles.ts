export const userRoles = [
  { value: 'super_admin', label: 'Super Administrator', description: 'Full system access' },
  { value: 'admin', label: 'Administrator', description: 'Administrative access' },
  { value: 'regional_manager', label: 'Regional Manager', description: 'Regional operations' },
  { value: 'district_manager', label: 'District Manager', description: 'District operations' },
  { value: 'admin_operation', label: 'Operations Admin', description: 'Trip and fleet operations' },
  { value: 'admin_hrm', label: 'HR Admin', description: 'Human resources management' },
  {
    value: 'district_incident_reporter',
    label: 'Incident Reporter',
    description: 'Safety and incident reporting',
  },
  {
    value: 'incident_investigator',
    label: 'Incident Investigator',
    description: 'Confirm and manage reported road incidents',
  },
  {
    value: 'hospital_incident_claimer',
    label: 'Hospital Incident Claimer',
    description: 'Submit hospital claims after investigator approval on the incident',
  },
  {
    value: 'station_manager',
    label: 'Station Manager',
    description: 'Full management of an assigned station',
  },
  { value: 'station_worker', label: 'Station Worker', description: 'Station-level operations' },
  { value: 'mttd', label: 'MTTD', description: 'Verify citizen reports and respond to confirmed incidents' },
  { value: 'fire_service', label: 'Fire Service', description: 'Fire emergency verification and response' },
  { value: 'police', label: 'Ghana Police Service', description: 'Police verification and incident response' },
  {
    value: 'road_safety_center',
    label: 'Road Safety Center',
    description: 'National Road Safety verification and response',
  },
  {
    value: 'road_safety_manager',
    label: 'Road Safety Manager',
    description: 'District road safety: incident analysis and death trap management',
  },
  {
    value: 'ambulance_service',
    label: 'Ambulance Service',
    description: 'Ambulance verification and medical response',
  },
];

export const EMERGENCY_SERVICE_ROLES = [
  'mttd',
  'fire_service',
  'police',
  'road_safety_center',
  'ambulance_service',
] as const;

/** Roles that must be assigned to a specific station */
export const STATION_BOUND_ROLES = ['station_worker', 'station_manager'] as const;

/** Roles that see station quick actions (schedule trip, book passenger) */
export const STATION_OPERATIONS_ROLES = ['station_worker', 'station_manager'] as const;

export function isStationBoundRole(role?: string): boolean {
  return STATION_BOUND_ROLES.includes(role as (typeof STATION_BOUND_ROLES)[number]);
}

export function isStationOperationsRole(role?: string): boolean {
  return STATION_OPERATIONS_ROLES.includes(role as (typeof STATION_OPERATIONS_ROLES)[number]);
}

export function isIncidentInvestigatorRole(role?: string): boolean {
  return role === 'incident_investigator';
}

export function isHospitalIncidentClaimerRole(role?: string): boolean {
  return role === 'hospital_incident_claimer';
}

export function isDistrictIncidentReporterRole(role?: string): boolean {
  return role === 'district_incident_reporter';
}

export function isEmergencyServiceRole(role?: string): boolean {
  return EMERGENCY_SERVICE_ROLES.includes(role as (typeof EMERGENCY_SERVICE_ROLES)[number]);
}

export function isRoadSafetyManagerRole(role?: string): boolean {
  return role === 'road_safety_manager';
}
