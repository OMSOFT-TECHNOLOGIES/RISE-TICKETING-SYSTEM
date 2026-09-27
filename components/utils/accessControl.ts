import {
  isHospitalIncidentClaimerPage,
  isIncidentInvestigatorPage,
  isStationManagerPage,
  isStationWorkerPage,
  pagePermissions,
  restrictionMessages,
  type RestrictionMessage,
} from '../config/pages';
import {
  isDistrictIncidentReporterRole,
  isHospitalIncidentClaimerRole,
  isIncidentInvestigatorRole,
} from '../constants/userRoles';

export type { RestrictionMessage };

// Custom access checks for complex permission logic
export const customAccessChecks: Record<
  string,
  (hasPermission: (perm: string) => boolean, userRole?: string) => boolean
> = {
  'ratings-complaints': (hasPermission) =>
    hasPermission('view_reports') || hasPermission('view_ratings_complaints'),

  'accident-analysis': (hasPermission, userRole) =>
    hasPermission('view_reports') ||
    hasPermission('manage_incidents') ||
    isDistrictIncidentReporterRole(userRole) ||
    isIncidentInvestigatorRole(userRole),

  'death-traps': (hasPermission, userRole) =>
    hasPermission('view_death_traps') ||
    hasPermission('create_death_trap_reports') ||
    isDistrictIncidentReporterRole(userRole),

  incidents: (hasPermission, userRole) =>
    hasPermission('manage_incidents') ||
    isDistrictIncidentReporterRole(userRole) ||
    isIncidentInvestigatorRole(userRole),

  'incident-claims': (hasPermission, userRole) =>
    hasPermission('manage_claims') ||
    hasPermission('submit_claims') ||
    hasPermission('approve_claims') ||
    hasPermission('view_claims') ||
    isDistrictIncidentReporterRole(userRole),
};

export { pagePermissions };

export function checkPageAccess(
  page: string,
  hasPermission: (permission: string) => boolean,
  isSuperAdmin: () => boolean,
  userRole?: string
): boolean {
  if (isSuperAdmin()) {
    return true;
  }

  if (userRole === 'station_worker') {
    return isStationWorkerPage(page);
  }

  if (userRole === 'station_manager') {
    return isStationManagerPage(page);
  }

  if (isIncidentInvestigatorRole(userRole)) {
    return isIncidentInvestigatorPage(page);
  }

  if (isHospitalIncidentClaimerRole(userRole)) {
    return isHospitalIncidentClaimerPage(page);
  }

  if (customAccessChecks[page]) {
    return customAccessChecks[page](hasPermission, userRole);
  }

  const permission = pagePermissions[page];
  return permission ? hasPermission(permission) : false;
}

export function getRestrictionMessage(page: string): RestrictionMessage {
  return (
    restrictionMessages[page] ?? {
      title: 'Access Restricted',
      message: "You don't have permission to access this feature.",
      suggestion: 'Contact your system administrator if you need access.',
    }
  );
}

export function getAccessLevelInfo(
  isSuperAdmin: () => boolean,
  isAdmin: () => boolean,
  userRole?: string
) {
  if (isSuperAdmin()) {
    return {
      label: 'Super Administrator',
      color: 'text-red-600',
      description: 'Full System Access',
    };
  }

  if (isAdmin()) {
    return {
      label: 'Administrator',
      color: 'text-orange-600',
      description: 'Administrative Access',
    };
  }

  if (userRole === 'station_manager') {
    return {
      label: 'Station Manager',
      color: 'text-teal-700',
      description: 'Station Management',
    };
  }

  if (userRole === 'station_worker') {
    return {
      label: 'Station Worker',
      color: 'text-emerald-600',
      description: 'Station Operations',
    };
  }

  const roleLabel =
    userRole?.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) || 'User';

  return {
    label: roleLabel,
    color: 'text-[#193cb8]',
    description: 'Limited Access',
  };
}
