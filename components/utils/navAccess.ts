import {
  isSafetyIncidentPage,
  isStationManagerPage,
  isStationWorkerPage,
  type PageConfig,
} from '../config/pages';

type PermissionChecker = (permission: string) => boolean;

/** Check if a nav item should be visible for the current user */
export function canViewNavItem(
  item: PageConfig,
  hasPermission: PermissionChecker,
  userRole?: string
): boolean {
  const isIncidentReporter = userRole === 'district_incident_reporter';

  if (userRole === 'station_worker') {
    return isStationWorkerPage(item.id);
  }

  if (userRole === 'station_manager') {
    return isStationManagerPage(item.id);
  }

  if (isIncidentReporter && isSafetyIncidentPage(item.id)) {
    return true;
  }

  const permission = item.navPermission ?? item.permission;

  if (hasPermission(permission)) {
    return true;
  }

  // Alternate permission checks preserved from original Navigation logic
  switch (item.id) {
    case 'users':
      return hasPermission('manage_basic_users');
    case 'unions':
      return hasPermission('manage_unions');
    case 'incident-claims':
      return hasPermission('manage_claims');
    case 'death-traps':
      return hasPermission('view_death_traps') || hasPermission('create_death_trap_reports');
    case 'stations':
      return hasPermission('manage_stations');
    case 'incidents':
      return hasPermission('manage_incidents');
    case 'accident-analysis':
      return hasPermission('view_reports') || hasPermission('manage_incidents');
    case 'tickets':
      return hasPermission('view_tickets');
    case 'accounts':
      return hasPermission('view_revenue');
    case 'ratings-complaints':
      return hasPermission('view_reports') || hasPermission('view_ratings_complaints');
    default:
      return hasPermission(item.permission);
  }
}

/** Check if a nav item should show the "Limited" badge */
export function isNavItemRestricted(
  item: PageConfig,
  hasPermission: PermissionChecker,
  userRole?: string
): boolean {
  if (!item.restrictedAccess) {
    return false;
  }

  const isIncidentReporter = userRole === 'district_incident_reporter';

  if (userRole === 'station_worker' || userRole === 'station_manager') {
    return false;
  }

  if (isIncidentReporter && isSafetyIncidentPage(item.id)) {
    return false;
  }

  switch (item.id) {
    case 'users':
      return !hasPermission('manage_users');
    case 'unions':
      return !hasPermission('manage_unions');
    case 'incident-claims':
      return !hasPermission('manage_claims') && !isIncidentReporter;
    case 'accounts':
      return !hasPermission('view_revenue');
    case 'death-traps':
      return (
        !hasPermission('view_death_traps') &&
        !hasPermission('create_death_trap_reports') &&
        !isIncidentReporter
      );
    default:
      return false;
  }
}
