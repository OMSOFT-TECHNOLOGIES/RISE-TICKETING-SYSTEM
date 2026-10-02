import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, RefreshCw, UserCheck, Users, Wifi, WifiOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { ScrollableTable } from '../shared/ScrollableTable';
import { dashboardApi, userApi } from '../utils/api';
import { getRoleBadgeClass } from '../utils/helpers';
import {
  formatActivityTimestamp,
  formatRelativeSeen,
  normalizeUserActivity,
} from './userActivityUtils';
import type { UserActivitySummary } from './types';

const EMPTY_SUMMARY: UserActivitySummary = {
  activeUsers: 0,
  totalTracked: 0,
  users: [],
};

export function UserActivityPanel() {
  const [summary, setSummary] = useState<UserActivitySummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadActivity = useCallback(async () => {
    setError(null);

    try {
      const activityRes = await dashboardApi.getUserActivity();

      if (activityRes.success && activityRes.data) {
        setSummary(normalizeUserActivity(activityRes.data));
        return;
      }

      const usersRes = await userApi.getAll();
      if (usersRes.success && usersRes.data) {
        setSummary(normalizeUserActivity(usersRes.data));
        return;
      }

      setSummary(EMPTY_SUMMARY);
      setError(activityRes.error || usersRes.error || 'Failed to load user activity');
    } catch (err) {
      setSummary(EMPTY_SUMMARY);
      setError(err instanceof Error ? err.message : 'Failed to load user activity');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadActivity();
    const intervalId = window.setInterval(() => {
      void loadActivity();
    }, 30_000);

    return () => window.clearInterval(intervalId);
  }, [loadActivity]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return summary.users;

    return summary.users.filter(
      (user) =>
        user.fullName.toLowerCase().includes(term) ||
        user.username.toLowerCase().includes(term) ||
        user.role.toLowerCase().includes(term)
    );
  }, [summary.users, search]);

  const onlineUsers = filteredUsers.filter((user) => user.isOnline);
  const offlineUsers = filteredUsers.filter((user) => !user.isOnline);

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="pb-3 px-6 pt-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4 text-primary" />
              User activity
            </CardTitle>
            <CardDescription className="text-xs">
              Active sessions, last seen, and login history
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search users..."
              className="w-full sm:w-56"
            />
            <Button variant="outline" size="icon" onClick={() => void loadActivity()} aria-label="Refresh user activity">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border bg-emerald-50/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Now</p>
                <p className="text-xl font-semibold text-emerald-700 dark:text-emerald-400">{summary.activeUsers}</p>
              </div>
              <Wifi className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
          <div className="rounded-lg border bg-muted/40 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tracked Users</p>
                <p className="text-xl font-semibold">{summary.totalTracked}</p>
              </div>
              <UserCheck className="h-8 w-8 text-[#193cb8]" />
            </div>
          </div>
          <div className="rounded-lg border bg-muted/40 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Offline</p>
                <p className="text-xl font-semibold">{Math.max(summary.totalTracked - summary.activeUsers, 0)}</p>
              </div>
              <WifiOff className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#193cb8]" />
          </div>
        ) : error && summary.users.length === 0 ? (
          <div className="rounded-lg border border-dashed py-10 text-center">
            <p className="text-sm text-muted-foreground mb-3">{error}</p>
            <Button variant="outline" onClick={() => void loadActivity()}>
              Try again
            </Button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">No users match your search.</p>
        ) : (
          <div className="space-y-6">
            {onlineUsers.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Active Users ({onlineUsers.length})
                </h3>
                <UserActivityTable users={onlineUsers} />
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                {onlineUsers.length > 0 ? `Other Users (${offlineUsers.length})` : `All Users (${filteredUsers.length})`}
              </h3>
              <UserActivityTable users={onlineUsers.length > 0 ? offlineUsers : filteredUsers} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function UserActivityTable({ users }: { users: UserActivitySummary['users'] }) {
  if (users.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">No users in this group.</p>;
  }

  return (
    <ScrollableTable maxHeightClass="max-h-[320px]" minWidthClass="min-w-[800px]">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Session</TableHead>
            <TableHead>Last Seen</TableHead>
            <TableHead>Last Login</TableHead>
            <TableHead>Last Logout</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{user.fullName}</p>
                  <p className="text-xs text-muted-foreground">@{user.username}</p>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={getRoleBadgeClass(user.role)}>
                  {user.role.replace(/_/g, ' ')}
                </Badge>
              </TableCell>
              <TableCell>
                {user.isOnline ? (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Online</Badge>
                ) : (
                  <Badge variant="secondary">Offline</Badge>
                )}
              </TableCell>
              <TableCell>
                <div>
                  <p className="text-sm">{formatRelativeSeen(user.lastSeen)}</p>
                  <p className="text-xs text-muted-foreground">{formatActivityTimestamp(user.lastSeen)}</p>
                </div>
              </TableCell>
              <TableCell className="text-sm">{formatActivityTimestamp(user.lastLogin)}</TableCell>
              <TableCell className="text-sm">{formatActivityTimestamp(user.lastLogout)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollableTable>
  );
}
