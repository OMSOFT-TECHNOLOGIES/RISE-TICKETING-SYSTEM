import type { UserRole } from '../AuthContext';

export type DashboardScopeQuery = {
  stationId?: string;
  region?: string;
  district?: string;
};

const ASSIGNMENT_SCOPED_ROLES: UserRole[] = [
  'regional_manager',
  'district_manager',
  'district_incident_reporter',
  'road_safety_manager',
  'incident_investigator',
  'hospital_incident_claimer',
];

export function shouldScopeDashboardByUserRole(role?: UserRole): boolean {
  if (!role) return false;
  if (role === 'super_admin' || role === 'admin') return false;
  if (role === 'admin_operation' || role === 'admin_hrm') return false;
  if (role === 'station_worker' || role === 'station_manager') return true;
  return ASSIGNMENT_SCOPED_ROLES.includes(role);
}

/** Query params sent to dashboard APIs so KPIs match the user’s region / district / station. */
export function dashboardScopeForUser(
  user?: {
    role?: UserRole;
    stationId?: string;
    region?: string;
    district?: string;
  } | null
): DashboardScopeQuery {
  if (!user?.role) return {};

  if (user.role === 'super_admin' || user.role === 'admin') {
    return {};
  }
  if (user.role === 'admin_operation' || user.role === 'admin_hrm') {
    return {};
  }

  if (user.role === 'station_worker' || user.role === 'station_manager') {
    const stationId = user.stationId?.trim();
    return stationId ? { stationId } : {};
  }

  if (!shouldScopeDashboardByUserRole(user.role)) {
    const stationId = user.stationId?.trim();
    return stationId ? { stationId } : {};
  }

  const scope: DashboardScopeQuery = {};
  const region = user.region?.trim();
  const district = user.district?.trim();
  if (region) scope.region = region;
  if (district) scope.district = district;
  if (!scope.region && !scope.district && user.stationId?.trim()) {
    scope.stationId = user.stationId.trim();
  }
  return scope;
}

export function dashboardScopeLabel(scope: DashboardScopeQuery): string | null {
  if (scope.district) return scope.district;
  if (scope.region) return scope.region;
  if (scope.stationId) return 'Your station';
  return null;
}

export function filterRegionChartForScope(
  rows: { name: string; value: number; trips?: number; share?: number; color?: string }[],
  scope: DashboardScopeQuery
) {
  if (!scope.region && !scope.district) return rows;
  if (scope.region) {
    const region = scope.region.toLowerCase();
    const filtered = rows.filter((r) => r.name.toLowerCase() === region);
    if (filtered.length > 0) return filtered;
  }
  if (scope.district) {
    return rows.filter((r) =>
      r.name.toLowerCase().includes(scope.district!.toLowerCase())
    );
  }
  return rows;
}
