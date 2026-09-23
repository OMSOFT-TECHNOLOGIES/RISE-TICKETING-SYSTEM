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
