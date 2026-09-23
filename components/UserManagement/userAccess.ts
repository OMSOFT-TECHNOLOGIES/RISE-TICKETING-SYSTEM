export type UserSummary = {
  id: string;
  role: string;
  stationId?: string;
};

export type ActorContext = {
  id?: string;
  role: string;
  stationId?: string;
};

export function canModifyUser(
  actor: ActorContext,
  target: UserSummary,
  isSuperAdmin: boolean,
  hasPermission: (permission: string) => boolean
): boolean {
  if (actor.id && target.id === actor.id) {
    return false;
  }
  if (target.role === 'super_admin' && !isSuperAdmin) {
    return false;
  }
  if (target.role === 'admin' && !isSuperAdmin && !hasPermission('manage_users')) {
    return false;
  }
  if (isSuperAdmin || hasPermission('manage_users')) {
    return true;
  }
  if (!hasPermission('manage_basic_users')) {
    return false;
  }
  if (target.role.includes('admin')) {
    return false;
  }
  if (actor.role === 'station_manager') {
    return (
      target.role === 'station_worker' &&
      !!actor.stationId &&
      target.stationId === actor.stationId
    );
  }
  return true;
}

export function canCreateUsers(
  isSuperAdmin: boolean,
  hasPermission: (permission: string) => boolean
): boolean {
  return isSuperAdmin || hasPermission('manage_users') || hasPermission('manage_basic_users');
}
