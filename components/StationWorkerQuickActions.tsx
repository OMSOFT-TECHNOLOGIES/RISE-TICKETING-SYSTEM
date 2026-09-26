import React from 'react';
import { Route, UserPlus } from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { useAuth } from './AuthContext';
import { usePageAction, type PageActionId } from './context/PageActionContext';
import { cn } from './ui/utils';

interface StationWorkerQuickActionsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ACTIONS: {
  id: PageActionId;
  page: string;
  title: string;
  description: string;
  icon: typeof Route;
  accent: string;
  iconBg: string;
}[] = [
  {
    id: 'new-trip',
    page: 'trips',
    title: 'Schedule New Trip',
    description: 'Create a trip schedule for your station',
    icon: Route,
    accent: 'text-[#193cb8]',
    iconBg: 'bg-[#193cb8]/10 border-[#193cb8]/20',
  },
  {
    id: 'new-passenger',
    page: 'passengers',
    title: 'Book Passenger',
    description: 'Register a passenger — e-ticket sent via SMS automatically',
    icon: UserPlus,
    accent: 'text-emerald-600',
    iconBg: 'bg-emerald-50 border-emerald-200/60',
  },
];

export function StationWorkerQuickActions({ open, onOpenChange }: StationWorkerQuickActionsProps) {
  const { user } = useAuth();
  const { navigateWithAction } = usePageAction();

  const handleAction = (page: string, action: PageActionId) => {
    navigateWithAction(page, action);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-w-md flex-col gap-0 p-0">
        <DialogHeader>
          <DialogTitle>Quick Actions</DialogTitle>
          <DialogDescription>
            {user?.stationName
              ? `Station operations for ${user.stationName}`
              : 'Common station tasks'}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain p-4">
          {ACTIONS.map(({ id, page, title, description, icon: Icon, accent, iconBg }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleAction(page, id)}
              className="w-full flex items-start gap-3 rounded-lg border p-4 text-left hover:bg-muted/40 transition-colors"
            >
              <div className={cn('rounded-lg border p-2.5 shrink-0', iconBg)}>
                <Icon className={cn('h-5 w-5', accent)} />
              </div>
              <div>
                <p className="font-medium text-sm">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
              </div>
            </button>
          ))}
        </div>

        <DialogFooter className="sm:justify-stretch">
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
