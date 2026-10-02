import React from 'react';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { formatDate } from '../utils/helpers';
import { UserRoleBadge, UserStatusBadge, UserOnlineBadge } from './userBadges';

type UserDetails = {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  stationName?: string;
  region?: string;
  district?: string;
  createdAt?: string;
  lastLogin?: string;
  isOnline?: boolean;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserDetails | null;
  onEdit?: () => void;
  canEdit?: boolean;
};

function DetailField({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="text-sm mt-0.5">{value}</div>
    </div>
  );
}

export function UserDetailsDialog({ open, onOpenChange, user, onEdit, canEdit }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden rounded-2xl">
        <DialogHeader className="border-b border-border/80 bg-gradient-to-br from-muted/50 to-background px-6 py-5 shrink-0">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            User profile
            {user ? (
              <span className="block text-sm font-normal text-muted-foreground mt-1 font-mono">
                @{user.username}
              </span>
            ) : null}
          </DialogTitle>
          <DialogDescription>Account details, role, and assignment</DialogDescription>
        </DialogHeader>

        {user ? (
          <DialogBody className="px-6 py-5 space-y-5 max-h-[min(58vh,480px)]">
            <div className="flex flex-wrap items-center gap-2">
              <UserRoleBadge role={user.role} />
              <UserStatusBadge status={user.status} />
              {user.isOnline ? <UserOnlineBadge /> : null}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailField label="Full name" value={user.fullName} />
              <DetailField label="User ID" value={<span className="font-mono text-xs">{user.id}</span>} />
              <DetailField label="Email" value={user.email} />
              <DetailField label="Phone" value={user.phone || '—'} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/60">
              <DetailField label="Station" value={user.stationName} />
              <DetailField
                label="Region / district"
                value={
                  user.region
                    ? `${user.region}${user.district ? ` · ${user.district}` : ''}`
                    : undefined
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/60">
              <DetailField
                label="Created"
                value={user.createdAt ? formatDate(user.createdAt) : '—'}
              />
              <DetailField
                label="Last login"
                value={user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
              />
            </div>
          </DialogBody>
        ) : null}

        <DialogFooter className="px-6 py-4 border-t border-border/80 bg-muted/20 gap-2 sm:justify-end">
          {canEdit && onEdit ? (
            <Button type="button" variant="outline" onClick={onEdit}>
              Edit user
            </Button>
          ) : null}
          <Button type="button" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
