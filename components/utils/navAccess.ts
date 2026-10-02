import {
  isHospitalIncidentClaimerPage,
  isIncidentInvestigatorPage,
  isRoadSafetyManagerPage,
  isSafetyIncidentPage,
  isStationManagerPage,
  isStationWorkerPage,
  type PageConfig,
} from '../config/pages';
import {
  isDistrictIncidentReporterRole,
  isEmergencyServiceRole,
  isHospitalIncidentClaimerRole,
  isIncidentInvestigatorRole,
  isRoadSafetyManagerRole,
} from '../constants/userRoles';

type PermissionChecker = (permission: string) => boolean;

/** Check if a nav item should be visible for the current user */
export function canViewNavItem(
  item: PageConfig,
  hasPermission: PermissionChecker,
  userRole?: string
): boolean {
  if (userRole === 'station_worker') {
    return isStationWorkerPage(item.id);
  }

  if (userRole === 'station_manager') {
    return isStationManagerPage(item.id);
  }

  if (isIncidentInvestigatorRole(userRole)) {
    return isIncidentInvestigatorPage(item.id);
  }

  if (isHospitalIncidentClaimerRole(userRole)) {
    return isHospitalIncidentClaimerPage(item.id);
  }

  if (isEmergencyServiceRole(userRole)) {
    return item.id === 'dashboard' || item.id === 'incidents';
  }

  if (isRoadSafetyManagerRole(userRole)) {
    return isRoadSafetyManagerPage(item.id);
  }

  if (isDistrictIncidentReporterRole(userRole) && isSafetyIncidentPage(item.id)) {
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
      return (
        hasPermission('manage_claims') ||
        hasPermission('submit_claims') ||
        hasPermission('approve_claims') ||
        hasPermission('view_claims')
      );
    case 'death-traps':
      return (
        hasPermission('view_death_traps') ||
        hasPermission('create_death_trap_reports') ||
        isRoadSafetyManagerRole(userRole)
      );
    case 'stations':
      return hasPermission('manage_stations');
    case 'incidents':
      return (
        hasPermission('manage_incidents') ||
        hasPermission('view_incidents') ||
        hasPermission('respond_incidents') ||
        isRoadSafetyManagerRole(userRole)
      );
    case 'accident-analysis':
      return (
        hasPermission('view_reports') ||
        hasPermission('manage_incidents') ||
        isRoadSafetyManagerRole(userRole)
      );
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

  if (userRole === 'station_worker' || userRole === 'station_manager') {
    return false;
  }

  if (isIncidentInvestigatorRole(userRole) && isIncidentInvestigatorPage(item.id)) {
    return false;
  }

  if (isDistrictIncidentReporterRole(userRole) && isSafetyIncidentPage(item.id)) {
    return false;
  }

  if (isRoadSafetyManagerRole(userRole) && isRoadSafetyManagerPage(item.id)) {
    return false;
  }

  switch (item.id) {
    case 'users':
      return !hasPermission('manage_users');
    case 'unions':
      return !hasPermission('manage_unions');
    case 'incident-claims':
      return (
        !hasPermission('manage_claims') && !isDistrictIncidentReporterRole(userRole)
      );
    case 'accounts':
      return !hasPermission('view_revenue');
    case 'death-traps':
      return (
        !hasPermission('view_death_traps') &&
        !hasPermission('create_death_trap_reports') &&
        !isDistrictIncidentReporterRole(userRole) &&
        userRole !== 'road_safety_manager'
      );
    default:
      return false;
  }
}
