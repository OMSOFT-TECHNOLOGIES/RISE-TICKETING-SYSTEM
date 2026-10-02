import type { UserRole } from '../AuthContext';

/** Roles that see organization-wide station lists without forcing the user's stationId. */
const GLOBAL_LIST_ROLES: UserRole[] = [
  'super_admin',
  'admin',
  'regional_manager',
  'district_manager',
  'admin_operation',
];

export function isGlobalDataScope(role?: string): boolean {
  if (!role) return false;
  return GLOBAL_LIST_ROLES.includes(role as UserRole);
}

type StationLike = { id?: string; region?: string; district?: string };

function normGeoLabel(value: string): string {
  return value.trim().toLowerCase();
}

/** Client-side filter when the API returns a broad list or the UI cached unscoped rows. */
export function filterStationsForUser<T extends StationLike>(
  stations: T[],
  user?: { role?: string; stationId?: string; region?: string; district?: string } | null
): T[] {
  if (!user?.role) return stations;
  if (user.role === 'super_admin' || user.role === 'admin') return stations;
  if (user.role === 'regional_manager' && user.region?.trim()) {
    const region = normGeoLabel(user.region);
    return stations.filter((s) => normGeoLabel(String(s.region ?? '')) === region);
  }
  if (
    (user.role === 'district_manager' || user.role === 'district_incident_reporter') &&
    user.district?.trim()
  ) {
    const district = normGeoLabel(user.district);
    return stations.filter((s) => normGeoLabel(String(s.district ?? '')) === district);
  }
  if (user.stationId) {
    return stations.filter((s) => String(s.id) === String(user.stationId));
  }
  if (isGlobalDataScope(user.role)) return stations;
  return stations;
}

/** Query params for list endpoints (vehicles, drivers, trips, tickets). */
export function listParamsForUser(
  user: { role?: string; stationId?: string } | null | undefined,
  extra?: { limit?: number; page?: number; status?: string; search?: string }
): { stationId?: string; limit?: number; page?: number; status?: string; search?: string } | undefined {
  const base = { ...extra };
  if (!user || isGlobalDataScope(user.role)) {
    return Object.keys(base).length > 0 ? base : undefined;
  }
  if (user.stationId) {
    return { ...base, stationId: user.stationId };
  }
  return Object.keys(base).length > 0 ? base : undefined;
}

/** Station worker/manager use their assignment; everyone else must pick a station when creating station-bound records. */
export function mustSelectStationForDataEntry(role?: string): boolean {
  if (!role) return false;
  return role !== 'station_worker' && role !== 'station_manager';
}

export function stationIdForDataEntry(
  user: { role?: string; stationId?: string } | null | undefined,
  pickedStationId: string | undefined
): string | undefined {
  if (!user) return pickedStationId?.trim() || undefined;
  if (!mustSelectStationForDataEntry(user.role)) {
    return user.stationId;
  }
  const picked = pickedStationId?.trim();
  return picked || undefined;
}

/** Server-side station list filters for regional / district assignment roles. */
export function stationListQueryForUser(
  user?: { role?: string; region?: string; district?: string } | null
): { region?: string; district?: string } {
  if (!user?.role) return {};
  if (user.role === 'regional_manager' && user.region?.trim()) {
    return { region: user.region.trim() };
  }
  if (
    (user.role === 'district_manager' || user.role === 'district_incident_reporter') &&
    user.district?.trim()
  ) {
    return { district: user.district.trim() };
  }
  return {};
}

/** Roles that must pick a station before station-scoped lists load meaningful data. */
export function deferListUntilStationPicked(
  user?: { role?: string; stationId?: string } | null,
  pickedStationId?: string
): boolean {
  if (!mustSelectStationForDataEntry(user?.role)) return false;
  return !stationIdForDataEntry(user, pickedStationId);
}

export function emptyPaginatedListPayload(
  entityKey: string,
  limit = 20
): Record<string, unknown> {
  return {
    [entityKey]: [],
    pagination: {
      page: 1,
      limit,
      totalItems: 0,
      totalPages: 1,
    },
  };
}

/** List/query params: scoped roles use assignment; others use the station picked for data entry. */
export function listParamsForDataEntry(
  user: { role?: string; stationId?: string } | null | undefined,
  entryStationId: string | undefined,
  extra?: { limit?: number; page?: number; status?: string; search?: string }
): { stationId?: string; limit?: number; page?: number; status?: string; search?: string } | undefined {
  const base = { ...extra };
  const sid = stationIdForDataEntry(user, entryStationId);
  if (sid) {
    return { ...base, stationId: sid };
  }
  if (mustSelectStationForDataEntry(user?.role)) {
    return Object.keys(base).length > 0 ? base : undefined;
  }
  return listParamsForUser(user, extra);
}
