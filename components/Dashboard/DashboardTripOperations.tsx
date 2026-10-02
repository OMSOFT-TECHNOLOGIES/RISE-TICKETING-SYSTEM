import React, { useEffect, useState } from 'react';
import { Bus, Calendar, Loader2, Route, Users } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useAuth } from '../AuthContext';
import { usePageAction } from '../context/PageActionContext';
import { tripApi, parseListResponse } from '../utils/api';
import { formatTripDepartureDisplay } from '../utils/tripDateTime';
import { getTripSeatStats } from '../utils/tripSeats';
import { tripStatusLabel } from '../constants/tripOperationStatus';
import { formatStatValue } from './dashboardUtils';
import type { DashboardPeriodBounds } from './dashboardPeriodRange';

type TripRow = Record<string, unknown>;

export function DashboardTripOperations({
  stats,
  periodBounds,
  showCommission = false,
  periodOffset = 0,
}: {
  stats: Record<string, number> | null;
  periodBounds: DashboardPeriodBounds;
  showCommission?: boolean;
  periodOffset?: number;
}) {
  const { user } = useAuth();
  const { navigateWithAction, navigateToPage } = usePageAction();
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const listDate = periodBounds.date;

    (async () => {
      setLoading(true);
      try {
        const response = await tripApi.getAll({
          stationId: user?.stationId,
          date: listDate,
          limit: 8,
          page: 1,
        });
        if (!cancelled && response.success && response.data) {
          setTrips(parseListResponse<TripRow>(response.data, 'trips'));
        } else if (!cancelled) {
          setTrips([]);
        }
      } catch {
        if (!cancelled) setTrips([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.stationId, periodBounds.date]);

  const todayTrips = stats?.todayTrips ?? 0;
  const moneyValue = showCommission
    ? (stats?.stationCommission ?? 0)
    : (stats?.stationRevenue ?? 0);
  const fleet = stats?.stationVehicles ?? 0;
  const isToday = periodOffset === 0;
  const dayLabel = isToday
    ? 'Today'
    : new Date(`${periodBounds.date}T12:00:00`).toLocaleDateString('en-GH', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
  const moneyLabel = showCommission
    ? isToday
      ? 'Station commission today'
      : `Station commission · ${dayLabel}`
    : isToday
      ? 'Station revenue today'
      : `Station revenue · ${dayLabel}`;

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="border-b px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Route className="h-4 w-4 text-primary" />
            Trip Booking &amp; Management
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isToday ? 'Today' : dayLabel} at {user?.stationName ?? 'your station'} — schedule,
            book, and track departures
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => navigateWithAction('trips', 'new-trip')}
          >
            Schedule trip
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigateWithAction('passengers', 'new-passenger')}
          >
            Book passenger
          </Button>
          <Button size="sm" variant="ghost" onClick={() => navigateToPage('trips')}>
            Open trips
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-border">
        <div className="bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">
            {isToday ? "Today's trips" : `Trips · ${dayLabel}`}
          </p>
          <p className="text-lg font-semibold">{todayTrips}</p>
        </div>
        <div className="bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">{moneyLabel}</p>
          <p className="text-lg font-semibold">
            {formatStatValue(moneyValue, 'currency')}
          </p>
        </div>
        <div className="bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Bus className="h-3 w-3" /> Station fleet
          </p>
          <p className="text-lg font-semibold">{fleet}</p>
        </div>
      </div>

      <div className="p-4">
        <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {isToday ? 'Departures today' : `Departures · ${dayLabel}`}
        </p>
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading trips…
          </div>
        ) : trips.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No trips scheduled for {isToday ? 'today' : dayLabel.toLowerCase()}. Use Schedule trip
            to add a departure and assign a vehicle from your station fleet.
          </p>
        ) : (
          <ul className="space-y-2">
            {trips.map((trip) => {
              const id = String(trip.id ?? '');
              const routeText = String(trip.routeFrom ?? trip.route ?? '');
              const routeParts = routeText.split(/\s+(?:→|to)\s+/i);
              const routeFrom = String(trip.routeFrom ?? routeParts[0] ?? '');
              const routeTo = String(trip.routeTo ?? routeParts[1] ?? '');
              const seatStats = getTripSeatStats(trip);
              return (
                <li
                  key={id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border bg-muted/20 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {routeFrom}
                      {routeTo ? ` → ${routeTo}` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTripDepartureDisplay(trip)} ·{' '}
                      {String(trip.vehicle ?? trip.vehicleRegistration ?? '—')} ·{' '}
                      {String(trip.driver ?? trip.driverName ?? '—')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {seatStats.booked}/{seatStats.capacity || '—'}
                    </span>
                    <Badge variant="secondary" className="text-[10px] font-normal">
                      {tripStatusLabel(String(trip.status ?? 'scheduled'))}
                    </Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
