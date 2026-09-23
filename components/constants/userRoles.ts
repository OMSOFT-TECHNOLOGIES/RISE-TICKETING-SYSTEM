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
    value: 'station_manager',
    label: 'Station Manager',
    description: 'Full management of an assigned station',
  },
  { value: 'station_worker', label: 'Station Worker', description: 'Station-level operations' },
];

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
