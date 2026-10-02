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
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Badge } from '../ui/badge';
import {
  Bus,
  Clock,
  Loader2,
  Route,
  Search,
  Ticket,
  UserPlus,
  Users,
} from 'lucide-react';
import { cn } from '../ui/utils';
import {
  PassengerBookingEntry,
  type PassengerBookingMethod,
} from '../shared/PassengerBookingEntry';
import type { PassengerBookingFormValues } from '../shared/PassengerBookingFormFields';
import { PassengerBookingQueuePanel } from '../shared/PassengerBookingQueuePanel';
import type { QueuedPassengerBooking } from '../shared/bulkPassengerBooking';
import { getTripSeatStats } from '../utils/tripSeats';
import { Progress } from '../ui/progress';

type TripRecord = Record<string, unknown>;

function FormSection({
  title,
  description,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('space-y-4', className)}>
      <div className="flex items-start gap-3">
        {Icon ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
            <Icon className="h-4 w-4" strokeWidth={2} />
          </span>
        ) : null}
        <div className="min-w-0 pt-0.5">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
          {description ? (
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
          ) : null}
        </div>
      </div>
      <div className="space-y-4 pl-0 sm:pl-12">{children}</div>
    </section>
  );
}

const fieldInputClass = 'h-10 bg-muted/30 border-border/80';

function TripSummaryStrip({ trip, fareLabel }: { trip: TripRecord; fareLabel?: string }) {
  const stats = getTripSeatStats(trip);
  const pct =
    stats.capacity > 0 ? Math.min(100, (stats.booked / stats.capacity) * 100) : 0;
  const full = stats.capacity > 0 && stats.remaining <= 0;

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/[0.06] p-3 sm:p-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="font-semibold text-sm leading-snug">{String(trip.route ?? 'Trip')}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {String(trip.date ?? '')} · {String(trip.time ?? '')}
            </span>
            {fareLabel ? (
              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                <Ticket className="h-3 w-3" />
                ₵{fareLabel} / seat
              </span>
            ) : null}
          </div>
          <p className="text-[11px] font-mono text-muted-foreground">{String(trip.id ?? '')}</p>
        </div>
        {full ? (
          <Badge variant="outline" className="text-amber-800 border-amber-300 shrink-0">
            Full
          </Badge>
        ) : (
          <Badge variant="secondary" className="tabular-nums shrink-0">
            {stats.remaining} open
          </Badge>
        )}
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
          <span>
            {stats.booked}/{stats.capacity} booked
          </span>
          <span className={cn(full && 'text-destructive font-medium')}>
            {stats.remaining} remaining
          </span>
        </div>
        <Progress value={pct} className={cn('h-1.5', full && '[&>div]:bg-destructive/70')} />
      </div>
    </div>
  );
}

export type AddPassengersDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  onTripIdChange: (tripId: string) => void;
  tripSearch: string;
  onTripSearchChange: (value: string) => void;
  tripOptions: TripRecord[];
  selectedTrip: TripRecord | undefined;
  selectedTripFare?: string;
  isBranchManager: boolean;
  onRefreshTrips: () => void;
  tripsRefreshing?: boolean;
  bookingMethod: PassengerBookingMethod;
  onBookingMethodChange: (method: PassengerBookingMethod) => void;
  formValues: PassengerBookingFormValues & { tripId: string };
  onFormChange: (patch: Partial<PassengerBookingFormValues>) => void;
  maxSeats: number;
  fareReadOnly: boolean;
  phoneLookup?: boolean;
  profileFound?: boolean;
  duplicateOnTrip?: boolean;
  queue: QueuedPassengerBooking[];
  bulkSubmitting?: boolean;
  sessionCompleting?: boolean;
  onCancel: () => void;
  onDone: () => void;
  onBookAndPrint: () => void;
};

export function AddPassengersDialog({
  open,
  onOpenChange,
  tripId,
  onTripIdChange,
  tripSearch,
  onTripSearchChange,
  tripOptions,
  selectedTrip,
  selectedTripFare,
  isBranchManager,
  onRefreshTrips,
  tripsRefreshing = false,
  bookingMethod,
  onBookingMethodChange,
  formValues,
  onFormChange,
  maxSeats,
  fareReadOnly,
  phoneLookup,
  profileFound,
  duplicateOnTrip,
  queue,
  bulkSubmitting = false,
  sessionCompleting = false,
  onCancel,
  onDone,
  onBookAndPrint,
}: AddPassengersDialogProps) {
  const busy = bulkSubmitting || sessionCompleting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden rounded-2xl sm:max-w-2xl">
        <DialogHeader className="border-b border-border/80 bg-gradient-to-br from-muted/50 to-background px-6 py-5">
          <div className="flex items-start gap-4 pr-6">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
              <UserPlus className="h-5 w-5" strokeWidth={2.25} />
            </span>
            <div className="space-y-1 min-w-0">
              <DialogTitle className="text-xl font-semibold tracking-tight">
                Add passengers
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed">
                Book one passenger at a time — each ticket prints immediately. Tap{' '}
                <strong className="font-medium text-foreground">Done</strong> when finished to
                send e-ticket SMS for the session.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody className="px-6 py-5 space-y-8 max-h-[min(62vh,560px)]">
          <FormSection
            title="Departure"
            description="Search and select the trip for this booking."
            icon={Route}
          >
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="add-trip-search"
                    value={tripSearch}
                    onChange={(e) => onTripSearchChange(e.target.value)}
                    placeholder="Route, driver, vehicle, date, trip ID…"
                    className={cn(fieldInputClass, 'pl-9')}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 shrink-0"
                  disabled={tripsRefreshing}
                  onClick={onRefreshTrips}
                >
                  {tripsRefreshing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Refresh'
                  )}
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-trip">
                  Trip <span className="text-destructive">*</span>
                </Label>
                <Select value={tripId || undefined} onValueChange={onTripIdChange}>
                  <SelectTrigger id="add-trip" className={fieldInputClass}>
                    <SelectValue placeholder="Choose a departure" />
                  </SelectTrigger>
                  <SelectContent>
                    {tripOptions.map((trip) => {
                      const id = String(trip.id);
                      const full = getTripSeatStats(trip).isFull;
                      return (
                        <SelectItem key={id} value={id}>
                          {String(trip.route)} — {String(trip.date)} {String(trip.time)}
                          {full ? ' (full)' : ''}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {tripOptions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No trips match your search
                    {!isBranchManager ? ' (fully booked trips are manager-only)' : ''}.
                  </p>
                ) : null}
              </div>
              {selectedTrip ? (
                <TripSummaryStrip trip={selectedTrip} fareLabel={selectedTripFare} />
              ) : (
                <p className="text-xs text-muted-foreground rounded-lg border border-dashed border-border/80 bg-muted/20 px-3 py-2.5">
                  Select a trip to enter passenger details and see seat availability.
                </p>
              )}
            </div>
          </FormSection>

          <FormSection
            title="Passenger details"
            description="Manual entry or biometric capture for repeat travelers."
            icon={Bus}
            className={!tripId ? 'opacity-50 pointer-events-none' : undefined}
          >
            <PassengerBookingEntry
              method={bookingMethod}
              onMethodChange={onBookingMethodChange}
              tabsVariant="segment"
              idPrefix="add-passenger"
              values={formValues}
              onChange={onFormChange}
              showSeatCount
              maxSeats={maxSeats}
              showSeatNumber
              showRoutePoints
              showFare
              fareReadOnly={fareReadOnly}
              phoneLookup={phoneLookup}
              profileFound={profileFound}
              duplicateOnTrip={duplicateOnTrip}
              compactWhenProfileFound={false}
            />
          </FormSection>

          <FormSection
            title="Session queue"
            description="Tickets printed this session — SMS batch on Done."
            icon={Users}
            className="pb-1"
          >
            <PassengerBookingQueuePanel queue={queue} />
          </FormSection>
        </DialogBody>

        <DialogFooter className="gap-2 sm:gap-2 bg-muted/20 border-t border-border/60 flex-col-reverse sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onDone}
            disabled={busy || queue.length === 0}
            className="sm:min-w-[120px]"
          >
            {sessionCompleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending SMS…
              </>
            ) : (
              <>Done{queue.length > 0 ? ` (${queue.length})` : ''}</>
            )}
          </Button>
          <Button
            type="button"
            onClick={onBookAndPrint}
            disabled={duplicateOnTrip || !tripId || bulkSubmitting}
            className="sm:min-w-[168px]"
          >
            {bulkSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Booking…
              </>
            ) : (
              <>
                <Ticket className="h-4 w-4 mr-2" />
                Book & print
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
