import { parseListResponse } from '../utils/api/client';
import type { UserActivityRecord, UserActivitySummary } from './types';

function parseTimestamp(value: unknown): string | null {
  if (!value || typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : value;
}

function normalizeRecord(raw: Record<string, unknown>): UserActivityRecord {
  const lastSeen = parseTimestamp(raw.lastSeen ?? raw.last_seen);
  const lastLogin = parseTimestamp(raw.lastLogin ?? raw.last_login);
  const lastLogout = parseTimestamp(raw.lastLogout ?? raw.last_logout);

  return {
    id: String(raw.id ?? raw.userId ?? ''),
    fullName: String(raw.fullName ?? raw.full_name ?? raw.name ?? 'Unknown user'),
    username: String(raw.username ?? ''),
    role: String(raw.role ?? 'unknown'),
    accountStatus: String(raw.status ?? raw.accountStatus ?? 'active'),
    isOnline: Boolean(raw.isOnline ?? raw.is_online ?? raw.online ?? false),
    lastSeen,
    lastLogin,
    lastLogout,
  };
}

export function normalizeUserActivity(data: unknown): UserActivitySummary {
  if (!data) {
    return { activeUsers: 0, totalTracked: 0, users: [] };
  }

  if (Array.isArray(data)) {
    const users = data.map((item) => normalizeRecord(item as Record<string, unknown>));
    return {
      activeUsers: users.filter((user) => user.isOnline).length,
      totalTracked: users.length,
      users,
    };
  }

  const record = data as Record<string, unknown>;
  const usersRaw =
    record.users ??
    record.activity ??
    record.sessions ??
    parseListResponse<Record<string, unknown>>(data, 'users');

  const users = (Array.isArray(usersRaw) ? usersRaw : []).map((item) =>
    normalizeRecord(item as Record<string, unknown>)
  );

  const activeUsers =
    typeof record.activeUsers === 'number'
      ? record.activeUsers
      : typeof record.active_users === 'number'
        ? record.active_users
        : users.filter((user) => user.isOnline).length;

  return {
    activeUsers,
    totalTracked:
      typeof record.totalTracked === 'number'
        ? record.totalTracked
        : typeof record.total === 'number'
          ? record.total
          : users.length,
    users,
  };
}

export function formatActivityTimestamp(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeSeen(value: string | null): string {
  if (!value) return 'Never';

  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
