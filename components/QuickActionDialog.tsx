import React from 'react';
import { Bus, Plus, Route, Users } from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { useAuth } from './AuthContext';
import { StationWorkerQuickActions } from './StationWorkerQuickActions';
import { isStationOperationsRole } from './constants/userRoles';
import { usePageAction, type PageActionId } from './context/PageActionContext';
import { cn } from './ui/utils';

interface QuickActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickActionDialog({ open, onOpenChange }: QuickActionDialogProps) {
  const { user } = useAuth();

  if (isStationOperationsRole(user?.role)) {
    return <StationWorkerQuickActions open={open} onOpenChange={onOpenChange} />;
  }

  return <AdminQuickActions open={open} onOpenChange={onOpenChange} />;
}

type AdminAction = {
  id: PageActionId;
  page: string;
  title: string;
  description: string;
  icon: typeof Route;
  accent: string;
  iconBg: string;
  requiresAdmin?: boolean;
  permission?: string;
};

function AdminQuickActions({ open, onOpenChange }: QuickActionDialogProps) {
  const { hasPermission, isAdmin, isSuperAdmin } = useAuth();
  const { navigateWithAction } = usePageAction();
  const isAdminUser = isAdmin() || isSuperAdmin();

  const actions: AdminAction[] = [
    {
      id: 'new-passenger',
      page: 'passengers',
      title: 'Book Passenger',
      description: 'Open passenger booking with e-ticket printing',
      icon: Route,
      accent: 'text-emerald-600',
      iconBg: 'bg-emerald-50 border-emerald-200/60',
    },
    {
      id: 'new-trip',
      page: 'trips',
      title: 'Schedule Trip',
      description: 'Create a new trip on the schedule',
      icon: Route,
      accent: 'text-[#193cb8]',
      iconBg: 'bg-[#193cb8]/10 border-[#193cb8]/20',
    },
    ...(isAdminUser
      ? [
          {
            id: 'new-user' as const,
            page: 'users',
            title: 'Add User',
            description: 'Create an admin or station account',
            icon: Users,
            accent: 'text-[#193cb8]',
            iconBg: 'bg-[#193cb8]/10 border-[#193cb8]/20',
          },
        ]
      : []),
    ...(hasPermission('manage_vehicles')
      ? [
          {
            id: 'new-vehicle' as const,
            page: 'vehicles',
            title: 'Add Vehicle',
            description: 'Register a vehicle in the fleet',
            icon: Bus,
            accent: 'text-purple-600',
            iconBg: 'bg-purple-50 border-purple-200/60',
          },
        ]
      : []),
  ];

  const handleAction = (page: string, action: PageActionId) => {
    navigateWithAction(page, action);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-w-md flex-col gap-0 p-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Quick Actions
          </DialogTitle>
          <DialogDescription>Open a module to complete the task with live data</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain p-4">
          {actions.map(({ id, page, title, description, icon: Icon, accent, iconBg }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleAction(page, id)}
              className="w-full flex items-start gap-3 rounded-lg border p-4 text-left hover:bg-muted/40 transition-colors"
            >
              <div className={cn('rounded-lg border p-2.5 shrink-0', iconBg)}>
                <Icon className={cn('h-5 w-5', accent)} />
              </div>
              <div className="min-w-0">
                <p className="font-medium">{title}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </button>
          ))}

          {actions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              No quick actions available for your role.
            </p>
          )}
        </div>

        <div className="px-4 pb-4">
          <Button type="button" variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
