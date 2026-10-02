import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from './AuthContext';
import { usePageAction } from './context/PageActionContext';
import { 
  Route, 
  Plus, 
  Clock, 
  Users, 
  Bus,
  CheckCircle,
  AlertCircle,
  Eye,
  Phone,
  DollarSign,
  Calculator,
  Info,
  UserPlus,
  CarFront,
  ExternalLink,
  Loader2,
  Shield,
  RefreshCw,
  Search,
} from 'lucide-react';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import { isStationOperationsRole } from './constants/userRoles';
import {
  TRIP_OPERATION_STATUSES,
  tripStatusLabel,
  tripStatusRequiresReason,
} from './constants/tripOperationStatus';
import { formatTripDepartureDisplay, getTripDepartureIso } from './utils/tripDateTime';
import {
  getTripSeatStats,
  mergeTripSeatUpdateFromApi,
  patchTripWithBookedSeats,
  sumPassengerSeatsFromManifest,
} from './utils/tripSeats';
import { notify } from './utils/notify';
import {
  tripApi,
  driverApi,
  vehicleApi,
  passengerApi,
  parseListResponse,
  formatApiError,
} from './utils/api';
import {
  deferListUntilStationPicked,
  emptyPaginatedListPayload,
  isGlobalDataScope,
  listParamsForDataEntry,
} from './utils/stationScope';
import {
  driverRecordId,
  isDriverSchedulable,
  isVehicleSchedulable,
  loadDriversForTripScheduling,
  loadVehiclesForTripScheduling,
  vehicleRegistrationForTrip,
} from './utils/tripSchedulingResources';
import { useDataEntryStation } from './shared/hooks/useDataEntryStation';
import { DataEntryStationBanner } from './shared/DataEntryStationBanner';
import { toDriverApiPayload } from './utils/driverForm';
import { DriverSearchSelect } from './shared/DriverSearchSelect';
import { VehicleSearchSelect } from './shared/VehicleSearchSelect';
import { useEntityList } from './shared/hooks/useEntityList';
import { usePaginatedEntityList } from './shared/hooks/usePaginatedEntityList';
import { TablePagination } from './shared/TablePagination';
import { ScrollableTable } from './shared/ScrollableTable';
import { PageHeader } from './shared/PageHeader';
import { DashboardStatCard } from './Dashboard/DashboardStatCard';
import { RisePreloader, RiseStatusAlert } from './shared/feedback';
import {
  EMPTY_PASSENGER_BOOKING_FORM,
  type PassengerBookingFormValues,
} from './shared/PassengerBookingFormFields';
import {
  completePassengerBookingSession,
  createQueueId,
  isPhoneBookedForTrip,
  validateBiometricPassengerBooking,
  validatePassengerBookingForm,
  type QueuedPassengerBooking,
} from './shared/bulkPassengerBooking';
import {
  PassengerBookingEntry,
  type PassengerBookingMethod,
} from './shared/PassengerBookingEntry';
import { issueETicket } from './utils/eTicket';
import type { BookPassengerInput } from './utils/eTicket.types';
import { PassengerBookingQueuePanel } from './shared/PassengerBookingQueuePanel';
import {
  fetchPassengerByPhone,
  normalizePhoneDigits,
} from './utils/passengerLookup';
import {
  calculateTierInfo,
  editRowsToApiPayload,
  getDefaultTripTiers,
  parseTripTiersFromApi,
  tiersToEditRows,
  type TripCommissionTier,
  type TripTierEditRow,
} from './utils/tripTier';
import {
  canPrintPoliceCheck,
  canStartTripJourney,
  printPoliceCheckForTrip,
  startTripJourneyAndPrint,
} from './utils/tripJourney';

type TripRecord = Record<string, unknown>;

function normalizeTrip(trip: TripRecord): TripRecord {
  const routeParts = String(trip.route ?? '').split(/\s*(?:→|to)\s*/i);
  const seatStats = getTripSeatStats(trip);
  const booked = seatStats.booked;
  const capacity = seatStats.capacity;
  const departureAt = getTripDepartureIso(trip);
  let departureDate = trip.departureDate;
  let departureTimeOnly = trip.departureTimeOnly;
  if (departureAt) {
    const [datePart, timePart] = departureAt.split('T');
    departureDate = departureDate ?? datePart;
    departureTimeOnly = departureTimeOnly ?? timePart?.slice(0, 5);
  }
  return {
    ...trip,
    routeFrom: trip.routeFrom ?? routeParts[0]?.trim() ?? '',
    routeTo: trip.routeTo ?? routeParts[1]?.trim() ?? '',
    departureDate,
    departureTimeOnly,
    departureAt,
    departureTime: departureAt || trip.departureTime,
    booked,
    capacity,
    available: seatStats.remaining,
    canBook: seatStats.canBook,
    isFull: seatStats.isFull,
    fare: Number(trip.fare ?? trip.totalFare ?? trip.baseFare ?? 0),
    vehicle: trip.vehicle ?? trip.vehicleRegistration ?? trip.vehicleNumber ?? '',
    driver: trip.driver ?? trip.driverName ?? '',
    passengers: trip.passengers ?? [],
  };
}

function driverNameForVehicle(
  vehicle: TripRecord | undefined,
  drivers: TripRecord[]
): string {
  if (!vehicle) return '';
  if (vehicle.driverName) return String(vehicle.driverName);
  const driverId = vehicle.driverId != null ? String(vehicle.driverId) : '';
  if (!driverId) return '';
  const match = drivers.find(
    (d) => String(d.id).toUpperCase() === driverId.toUpperCase()
  );
  return match?.name ? String(match.name) : '';
}

function driverIdForSchedule(
  driverName: string,
  vehicle: TripRecord | undefined,
  drivers: TripRecord[]
): string | undefined {
  if (driverName) {
    const byName = drivers.find((d) => String(d.name) === driverName);
    if (byName?.id != null) return String(byName.id);
  }
  if (vehicle?.driverId != null) return String(vehicle.driverId);
  return undefined;
}

// Tier Badge Component
const TierBadge = ({
  fare,
  tiers,
  showCommission = false,
}: {
  fare: number;
  tiers: TripCommissionTier[];
  showCommission?: boolean;
}) => {
  const tierInfo = calculateTierInfo(tiers, fare, 1);
  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className={tierInfo.tier.color}>
        {tierInfo.tier.name}
      </Badge>
      {showCommission && (
        <span className="text-xs text-muted-foreground">
          ₵{tierInfo.commissionPerPassenger.toFixed(2)}/passenger
        </span>
      )}
    </div>
  );
};

// Tier Information Card for trip scheduling
const TierInfoCard = ({ fare, tiers }: { fare: number; tiers: TripCommissionTier[] }) => {
  const tierInfo = calculateTierInfo(tiers, fare, 1);
  const progressPercentage = Math.min((fare / 100) * 100, 100);
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-[#193cb8]" />
          <CardTitle className="text-sm">Fare Tier Analysis</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">Current Tier</Label>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={tierInfo.tier.color}>
                {tierInfo.tier.name}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {tierInfo.tier.description}
            </p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Commission Per Passenger</Label>
            <p className="text-lg font-bold text-[#193cb8]">₵{tierInfo.commissionPerPassenger.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Per passenger</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div>
            <Label className="text-xs text-muted-foreground">Fare Per Passenger</Label>
            <p className="text-sm font-medium">₵{tierInfo.farePerPassenger.toFixed(2)}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Net Per Passenger</Label>
            <p className="text-sm font-medium text-green-600">₵{(tierInfo.farePerPassenger - tierInfo.commissionPerPassenger).toFixed(2)}</p>
          </div>
        </div>
        
        <div className="pt-2">
          <div className="flex justify-between items-center mb-1">
            <Label className="text-xs text-muted-foreground">Fare Range Progress</Label>
            <span className="text-xs text-muted-foreground">₵{fare}</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
        
        <div className="p-2 bg-[#193cb8]/10 rounded text-xs text-[#193cb8]">
          <strong>Example for full trip:</strong> If 30 passengers book at ₵{fare}/passenger, you'll earn ₵{(fare * 30).toFixed(2)} in revenue and pay ₵{(tierInfo.commissionPerPassenger * 30).toFixed(2)} in commission, netting ₵{((fare - tierInfo.commissionPerPassenger) * 30).toFixed(2)}.
        </div>
      </CardContent>
    </Card>
  );
};

function vehicleRegistrationKey(vehicle: TripRecord): string {
  return vehicleRegistrationForTrip(vehicle as Record<string, unknown>);
}

export function TripBooking() {
  const { user, isSuperAdmin, hasPermission } = useAuth();
  const { pendingAction, clearAction } = usePageAction();
  const isGlobalUser = isGlobalDataScope(user?.role);
  const stationId = user?.stationId;
  const dataEntry = useDataEntryStation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  const fetchTrips = useCallback(
    (page: number, limit: number) => {
      if (deferListUntilStationPicked(user, dataEntry.stationId)) {
        return Promise.resolve({
          success: true,
          data: emptyPaginatedListPayload('trips', limit),
        });
      }
      return tripApi.getAll(
        listParamsForDataEntry(user, dataEntry.effectiveStationId, {
          page,
          limit,
          search: searchTerm.trim() || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          date: dateFilter || undefined,
        })
      );
    },
    [user, dataEntry.stationId, dataEntry.effectiveStationId, searchTerm, statusFilter, dateFilter]
  );
  const fetchDrivers = useCallback(async () => {
    return loadDriversForTripScheduling();
  }, []);

  /** All drivers at the station (or scope) — for trip history, not scheduling availability. */
  const fetchHistoryDrivers = useCallback(
    () =>
      driverApi.getAll(
        listParamsForDataEntry(user, dataEntry.effectiveStationId, { limit: 500, page: 1 })
      ),
    [user, dataEntry.effectiveStationId]
  );
  const fetchVehicles = useCallback(async () => {
    return loadVehiclesForTripScheduling();
  }, []);

  const {
    items: rawTrips,
    loading: tripsLoading,
    error: tripsError,
    refresh: refreshTrips,
    isSubmitting,
    setIsSubmitting,
    page: tripsPage,
    setPage: setTripsPage,
    pagination: tripsPagination,
    pageSize: tripsPageSize,
    setPageSize: setTripsPageSize,
  } = usePaginatedEntityList<TripRecord>({
    fetchFn: fetchTrips,
    entityKey: 'trips',
    errorMessage: 'Failed to load trips',
    resetPageDeps: [dataEntry.effectiveStationId, searchTerm, statusFilter, dateFilter],
  });
  const { items: drivers, loading: driversLoading, refresh: refreshDrivers } = useEntityList<TripRecord>({
    fetchFn: fetchDrivers,
    entityKey: 'drivers',
    errorMessage: 'Failed to load drivers',
  });
  const { items: historyDrivers, loading: historyDriversLoading } = useEntityList<TripRecord>({
    fetchFn: fetchHistoryDrivers,
    entityKey: 'drivers',
    errorMessage: 'Failed to load drivers for history',
  });
  const { items: vehicles, loading: vehiclesLoading, refresh: refreshVehicles } = useEntityList<TripRecord>({
    fetchFn: fetchVehicles,
    entityKey: 'vehicles',
    errorMessage: 'Failed to load vehicles',
  });

  const [tripBookedSeatOverrides, setTripBookedSeatOverrides] = useState<Record<string, number>>(
    {}
  );

  const trips = useMemo(() => {
    return rawTrips.map((trip) => {
      const normalized = normalizeTrip(trip);
      const override = tripBookedSeatOverrides[String(normalized.id ?? '')];
      if (override == null) return normalized;
      return normalizeTrip(patchTripWithBookedSeats(normalized, override));
    });
  }, [rawTrips, tripBookedSeatOverrides]);

  const pageDescription = isGlobalUser
    ? 'Schedule trips, book passengers, and track commission tiers across stations.'
    : `Trips for ${user?.stationName ?? 'your station'} — scheduling, bookings, and tier commission.`;

  const [showBookDialog, setShowBookDialog] = useState(false);
  const [showPassengerBookDialog, setShowPassengerBookDialog] = useState(false);

  useEffect(() => {
    if (pendingAction === 'new-trip') {
      setShowBookDialog(true);
      clearAction();
    }
  }, [pendingAction, clearAction]);

  useEffect(() => {
    if (showBookDialog) {
      void refreshDrivers();
      void refreshVehicles();
    }
  }, [showBookDialog, refreshDrivers, refreshVehicles]);

  const [showTierGuide, setShowTierGuide] = useState(false);
  const [commissionTiers, setCommissionTiers] = useState<TripCommissionTier[]>(() =>
    getDefaultTripTiers()
  );
  const [tierEditRows, setTierEditRows] = useState<TripTierEditRow[]>(() =>
    tiersToEditRows(getDefaultTripTiers())
  );
  const [tierSaving, setTierSaving] = useState(false);

  const loadCommissionTiers = useCallback(async () => {
    const response = await tripApi.getCommissionTiers();
    if (response.success && response.data) {
      const parsed = parseTripTiersFromApi(response.data);
      setCommissionTiers(parsed);
      setTierEditRows(tiersToEditRows(parsed));
    }
  }, []);

  useEffect(() => {
    void loadCommissionTiers();
  }, [loadCommissionTiers]);

  const handleSaveCommissionTiers = async () => {
    setTierSaving(true);
    try {
      const response = await tripApi.updateCommissionTiers(editRowsToApiPayload(tierEditRows));
      if (response.success) {
        notify.success('Trip commission tiers updated');
        await loadCommissionTiers();
      } else {
        notify.error(response.error || 'Failed to update tier fees');
      }
    } catch {
      notify.error('Failed to update tier fees');
    } finally {
      setTierSaving(false);
    }
  };
  const [showDriverRegDialog, setShowDriverRegDialog] = useState(false);
  const [showVehicleRegDialog, setShowVehicleRegDialog] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<TripRecord | null>(null);
  const [dialogPassengers, setDialogPassengers] = useState<TripRecord[]>([]);
  const [passengersLoading, setPassengersLoading] = useState(false);
  const [showPassengersDialog, setShowPassengersDialog] = useState(false);
  const [newTrip, setNewTrip] = useState({
    routeFrom: '',
    routeTo: '',
    departureDate: '',
    departureTime: '',
    vehicle: '',
    driver: '',
    driverId: '',
    fare: ''
  });
  const [newDriver, setNewDriver] = useState({
    name: '',
    phone: '',
    email: '',
    licenseNumber: '',
    licenseExpiry: '',
    experience: ''
  });
  const [newVehicle, setNewVehicle] = useState({
    registrationNumber: '',
    make: '',
    model: '',
    year: '',
    capacity: '',
    fuelType: ''
  });
  const [passengerBooking, setPassengerBooking] = useState({
    tripId: '',
    ...EMPTY_PASSENGER_BOOKING_FORM,
  });
  const [passengerBookingMethod, setPassengerBookingMethod] =
    useState<PassengerBookingMethod>('manual');

  const patchPassengerBookingForm = (updates: Partial<PassengerBookingFormValues>) => {
    if (updates.phone !== undefined) {
      setPassengerProfileFound(false);
    }
    setPassengerBooking((prev) => ({ ...prev, ...updates }));
  };

  const clearPassengerFormFields = () => {
    setPassengerBooking((prev) => ({
      tripId: prev.tripId,
      ...EMPTY_PASSENGER_BOOKING_FORM,
    }));
    setPassengerProfileFound(false);
  };

  const resetPassengerBookingForm = () => {
    setPassengerBooking({ tripId: '', ...EMPTY_PASSENGER_BOOKING_FORM });
    setBookingQueue([]);
    setPassengerProfileFound(false);
    setDuplicateTripBooking(false);
    setPassengerBookingMethod('manual');
  };

  const openBookPassengerModal = (tripId: string | number) => {
    setPassengerBooking({
      tripId: String(tripId),
      ...EMPTY_PASSENGER_BOOKING_FORM,
    });
    setBookingQueue([]);
    setPassengerProfileFound(false);
    setDuplicateTripBooking(false);
    setShowPassengerBookDialog(true);
  };

  const [passengerPhoneLookup, setPassengerPhoneLookup] = useState(false);
  const [passengerProfileFound, setPassengerProfileFound] = useState(false);
  const [bookingTripManifest, setBookingTripManifest] = useState<TripRecord[]>([]);
  const [duplicateTripBooking, setDuplicateTripBooking] = useState(false);
  const [bookingQueue, setBookingQueue] = useState<QueuedPassengerBooking[]>([]);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [sessionCompleting, setSessionCompleting] = useState(false);
  const passengerLookupSeq = useRef(0);

  useEffect(() => {
    if (!passengerBooking.tripId) {
      setBookingTripManifest([]);
      setDuplicateTripBooking(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const response = await passengerApi.getTripPassengers(
          String(passengerBooking.tripId)
        );
        if (cancelled) return;
        if (response.success && response.data !== undefined) {
          setBookingTripManifest(
            parseListResponse<TripRecord>(response.data, 'passengers')
          );
        } else {
          setBookingTripManifest([]);
        }
      } catch {
        if (!cancelled) setBookingTripManifest([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [passengerBooking.tripId]);

  useEffect(() => {
    const phone = passengerBooking.phone.trim();
    setDuplicateTripBooking(
      passengerBooking.tripId
        ? isPhoneBookedForTrip(phone, bookingTripManifest, bookingQueue)
        : false
    );
  }, [passengerBooking.phone, passengerBooking.tripId, bookingTripManifest, bookingQueue]);

  useEffect(() => {
    if (!showPassengerBookDialog) return;
    const phone = passengerBooking.phone.trim();
    const digits = normalizePhoneDigits(phone);
    if (digits.length < 9) {
      setPassengerProfileFound(false);
      return;
    }

    const seq = ++passengerLookupSeq.current;
    const timer = window.setTimeout(async () => {
      setPassengerPhoneLookup(true);
      try {
        const found = await fetchPassengerByPhone(phone);
        if (seq !== passengerLookupSeq.current) return;
        if (!found) {
          setPassengerProfileFound(false);
          return;
        }
        setPassengerProfileFound(true);
        setPassengerBooking((prev) => ({
          ...prev,
          name: found.name ? String(found.name) : prev.name,
          email: found.email ? String(found.email) : prev.email,
          emergencyContactName: found.emergencyContactName
            ? String(found.emergencyContactName)
            : prev.emergencyContactName,
          emergencyContactPhone: found.emergencyContactPhone
            ? String(found.emergencyContactPhone)
            : prev.emergencyContactPhone,
          emergencyContactRelationship: found.emergencyContactRelationship
            ? String(found.emergencyContactRelationship)
            : prev.emergencyContactRelationship,
        }));
      } catch {
        if (seq === passengerLookupSeq.current) {
          setPassengerProfileFound(false);
        }
      } finally {
        if (seq === passengerLookupSeq.current) {
          setPassengerPhoneLookup(false);
        }
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [passengerBooking.phone, showPassengerBookDialog]);

  const userTrips = trips;
  const seatStatsForTrip = useCallback(
    (trip: TripRecord) =>
      getTripSeatStats(trip, {
        passengers:
          String(trip.id) === String(passengerBooking.tripId)
            ? bookingTripManifest
            : undefined,
      }),
    [passengerBooking.tripId, bookingTripManifest]
  );

  const activeBookingTrip = useMemo(
    () => userTrips.find((t) => String(t.id) === String(passengerBooking.tripId)),
    [userTrips, passengerBooking.tripId]
  );
  const availableDrivers = drivers.filter((d) =>
    isDriverSchedulable(d as Record<string, unknown>)
  );

  const driversForTripHistory = useMemo(() => {
    const source = historyDrivers.length > 0 ? historyDrivers : drivers;
    return source.filter((d) => {
      const status = String(d.status ?? 'active');
      return status !== 'suspended';
    });
  }, [historyDrivers, drivers]);

  const driverOptionId = (d: TripRecord) => String(d.id ?? d.driverId ?? '');
  const driverOptionLabel = (d: TripRecord) =>
    String(d.name ?? d.fullName ?? (driverOptionId(d) || 'Driver'));
  const availableVehicles = vehicles.filter((v) =>
    isVehicleSchedulable(v as Record<string, unknown>)
  );

  const vehiclesForScheduling = useMemo(() => {
    const merged = new Map<string, TripRecord>();
    for (const v of availableVehicles) {
      if (!isVehicleSchedulable(v as Record<string, unknown>)) continue;
      const key = vehicleRegistrationKey(v);
      if (!key) continue;
      merged.set(key, v);
    }
    return Array.from(merged.values());
  }, [availableVehicles]);

  const canManageVehicles = hasPermission('manage_vehicles');
  const canManageDrivers = hasPermission('manage_drivers');

  const openPassengersDialog = async (trip: TripRecord) => {
    setSelectedTrip(trip);
    setShowPassengersDialog(true);
    setPassengersLoading(true);
    try {
      const response = await passengerApi.getTripPassengers(String(trip.id));
      if (response.success && response.data !== undefined) {
        setDialogPassengers(parseListResponse<TripRecord>(response.data, 'passengers'));
      } else {
        setDialogPassengers([]);
      }
    } catch {
      setDialogPassengers([]);
    } finally {
      setPassengersLoading(false);
    }
  };

  // Calculate tier statistics with corrected calculations
  const tierStats = commissionTiers.map((tier) => {
    const tierTrips = userTrips.filter((trip) => {
      const tripTier = calculateTierInfo(commissionTiers, trip.fare, 1);
      return tripTier.tier.id === tier.id;
    });

    const totalRevenue = tierTrips.reduce((sum, trip) => sum + trip.fare * trip.booked, 0);
    const totalCommission = tierTrips.reduce(
      (sum, trip) => sum + tier.commission * trip.booked,
      0
    );
    
    return {
      ...tier,
      tripCount: tierTrips.length,
      totalRevenue,
      totalCommission,
      netRevenue: totalRevenue - totalCommission
    };
  });

  const awaitingStationPick =
    dataEntry.needsPicker && deferListUntilStationPicked(user, dataEntry.stationId);

  const totalTrips = tripsPagination?.totalItems ?? userTrips.length;
  const scheduledCount = userTrips.filter((t) => t.status === 'scheduled').length;
  const totalPassengersBooked = userTrips.reduce((sum, trip) => sum + Number(trip.booked ?? 0), 0);
  const totalCommissionPage = tierStats.reduce((sum, tier) => sum + tier.totalCommission, 0);
  const totalNetRevenuePage = tierStats.reduce((sum, tier) => sum + tier.netRevenue, 0);

  const handleScheduleTrip = async () => {
    if (!newTrip.routeFrom || !newTrip.routeTo || !newTrip.departureDate || !newTrip.departureTime || !newTrip.fare) {
      notify.error('Please fill in all required trip fields');
      return;
    }

    const selectedVehicle = vehiclesForScheduling.find(
      (v) => vehicleRegistrationKey(v) === newTrip.vehicle
    );
    const driverId =
      newTrip.driverId ||
      driverIdForSchedule(newTrip.driver, selectedVehicle, drivers);
    const vehicleId = selectedVehicle?.id != null ? String(selectedVehicle.id) : undefined;

    if (!vehicleId) {
      notify.error('Please select a valid vehicle');
      return;
    }
    if (!driverId) {
      notify.error('Please select a driver');
      return;
    }

    if (dataEntry.needsPicker && !dataEntry.requireStationId()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await tripApi.create({
        routeFrom: newTrip.routeFrom,
        routeTo: newTrip.routeTo,
        departureDate: newTrip.departureDate,
        departureTime: newTrip.departureTime,
        vehicleId,
        driverId,
        fare: parseFloat(newTrip.fare),
      });

      if (response.success) {
        setNewTrip({
          routeFrom: '',
          routeTo: '',
          departureDate: '',
          departureTime: '',
          vehicle: '',
          driver: '',
          driverId: '',
          fare: '',
        });
        setShowBookDialog(false);
        notify.success('Trip scheduled successfully');
        await refreshTrips();
      } else {
        notify.error(response.error ?? 'Failed to schedule trip');
      }
    } catch {
      notify.error('Failed to schedule trip');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterDriver = async () => {
    if (!newDriver.name || !newDriver.phone || !newDriver.licenseNumber) {
      notify.error('Please fill in all required driver fields');
      return;
    }

    const sid = dataEntry.requireStationId();
    if (!sid) return;

    setIsSubmitting(true);
    try {
      const response = await driverApi.create(
        toDriverApiPayload({
          ...newDriver,
          stationId: sid,
        })
      );

      if (response.success) {
        setNewDriver({
          name: '',
          phone: '',
          email: '',
          licenseNumber: '',
          licenseExpiry: '',
          experience: '',
        });
        setShowDriverRegDialog(false);
        notify.success(`Driver ${newDriver.name} registered successfully`);
        await refreshDrivers();
      } else {
        notify.error(response.error ?? 'Failed to register driver');
      }
    } catch {
      notify.error('Failed to register driver');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterVehicle = async () => {
    if (!newVehicle.registrationNumber || !newVehicle.make || !newVehicle.model || !newVehicle.capacity) {
      notify.error('Please fill in all required vehicle fields');
      return;
    }

    const sid = dataEntry.requireStationId();
    if (!sid) return;

    setIsSubmitting(true);
    try {
      const response = await vehicleApi.create({
        registrationNumber: newVehicle.registrationNumber,
        capacity: parseInt(newVehicle.capacity),
        make: newVehicle.make,
        model: newVehicle.model,
        year: parseInt(newVehicle.year) || undefined,
        fuelType: newVehicle.fuelType,
        stationId: sid,
      });

      if (response.success) {
        setNewVehicle({
          registrationNumber: '',
          make: '',
          model: '',
          year: '',
          capacity: '',
          fuelType: '',
        });
        setShowVehicleRegDialog(false);
        notify.success(`Vehicle ${newVehicle.registrationNumber} registered successfully`);
        await refreshVehicles();
      } else {
        notify.error(response.error ?? 'Failed to register vehicle');
      }
    } catch {
      notify.error('Failed to register vehicle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const buildPassengerBookInput = (
    entry: PassengerBookingFormValues,
    trip: TripRecord
  ): BookPassengerInput => {
    const sid =
      dataEntry.effectiveStationId ||
      String(trip.stationId ?? '') ||
      user?.stationId ||
      '';
    const stationLabel =
      dataEntry.selectedStation?.name ||
      user?.stationName ||
      String(trip.stationName ?? 'Station');

    return {
      tripId: String(trip.id),
      passengerName: entry.name,
      passengerPhone: entry.phone,
      passengerEmail: entry.email,
      routeFrom: String(trip.routeFrom),
      routeTo: String(trip.routeTo),
      departureTime: getTripDepartureIso(trip) || String(trip.departureTime ?? ''),
      arrivalTime: trip.arrivalTime as string | undefined,
      fare: Number(trip.fare),
      vehicle: String(trip.vehicle),
      driver: String(trip.driver),
      stationId: sid,
      stationName: stationLabel,
      seats: entry.seats,
      emergencyContactName: entry.emergencyContactName,
      emergencyContactPhone: entry.emergencyContactPhone,
      emergencyContactRelationship: entry.emergencyContactRelationship,
      ...(entry.biometricReference?.trim()
        ? { biometricReference: entry.biometricReference.trim() }
        : {}),
    };
  };

  const handleBookAndPrintPassenger = async () => {
    const hasStoredEmergency = Boolean(
      passengerBooking.emergencyContactName?.trim() &&
        passengerBooking.emergencyContactPhone?.trim() &&
        passengerBooking.emergencyContactRelationship?.trim()
    );
    const validationOpts = {
      returningPassenger: passengerProfileFound,
      hasStoredEmergency,
    };
    const validationError =
      passengerBookingMethod === 'biometric'
        ? validateBiometricPassengerBooking(passengerBooking, validationOpts)
        : validatePassengerBookingForm(passengerBooking, validationOpts);
    if (validationError) {
      notify.error(validationError);
      return;
    }
    if (
      duplicateTripBooking ||
      isPhoneBookedForTrip(passengerBooking.phone, bookingTripManifest, bookingQueue)
    ) {
      notify.error('This phone number is already on this trip');
      return;
    }
    if (!passengerBooking.tripId) {
      notify.error('Please select a valid trip');
      return;
    }

    const trip = trips.find((t) => String(t.id) === String(passengerBooking.tripId));
    if (!trip) {
      notify.error('Please select a valid trip');
      return;
    }
    const seatStats = seatStatsForTrip(trip);
    if (!seatStats.canBook) {
      notify.error('This trip is full — no seats remaining');
      await refreshTrips();
      return;
    }
    const seatsRequested = Math.max(1, Number(passengerBooking.seats ?? 1));
    if (seatsRequested > seatStats.remaining) {
      notify.error(`Only ${seatStats.remaining} seat${seatStats.remaining === 1 ? '' : 's'} left on this trip`);
      return;
    }

    const sid =
      dataEntry.effectiveStationId || String(trip.stationId ?? '') || dataEntry.requireStationId();
    if (!sid) return;

    setBulkSubmitting(true);
    try {
      const { ticket, seatsBooked, updatedTrip } = await issueETicket(
        buildPassengerBookInput(passengerBooking, trip),
        {
          printTicket: true,
          sendSms: false,
        }
      );

      setBookingQueue((prev) => [
        ...prev,
        { ...passengerBooking, queueId: createQueueId(), ticketId: ticket.id },
      ]);
      clearPassengerFormFields();

      await refreshTrips();
      const manifestRes = await passengerApi.getTripPassengers(String(trip.id));
      if (manifestRes.success && manifestRes.data !== undefined) {
        const manifest = parseListResponse<TripRecord>(manifestRes.data, 'passengers');
        setBookingTripManifest(manifest);
        const tripId = String(trip.id);
        const manifestSeats = sumPassengerSeatsFromManifest(manifest);
        const mergedTrip = mergeTripSeatUpdateFromApi(trip, updatedTrip, seatsBooked);
        const bookedSeats =
          manifestSeats > 0 ? manifestSeats : getTripSeatStats(mergedTrip).booked;
        setTripBookedSeatOverrides((prev) => ({ ...prev, [tripId]: bookedSeats }));
        const cap = Number(trip.capacity ?? 0);
        if (cap > 0 && bookedSeats >= cap) {
          notify.success('Trip is now fully booked', {
            description: 'Status updated to Fully booked.',
          });
        }
      }
    } catch {
      // issueETicket shows errors
    } finally {
      setBulkSubmitting(false);
    }
  };

  const closePassengerBookDialog = (force = false) => {
    if (!force && (bulkSubmitting || sessionCompleting)) {
      return;
    }
    setShowPassengerBookDialog(false);
    resetPassengerBookingForm();
  };

  const handleBookingSessionDone = async () => {
    if (bulkSubmitting || sessionCompleting) return;
    setSessionCompleting(true);
    try {
      await completePassengerBookingSession(bookingQueue);
      closePassengerBookDialog(true);
    } finally {
      setSessionCompleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = TRIP_OPERATION_STATUSES.find((s) => s.value === status);
    return (
      <Badge className={statusInfo?.color || 'bg-gray-100 text-gray-800'}>
        {statusInfo?.label || tripStatusLabel(status)}
      </Badge>
    );
  };

  const stationScopedStaff = isStationOperationsRole(user?.role);

  useEffect(() => {
    if (!showBookDialog || !stationScopedStaff) return;
    const origin = user?.stationName?.trim();
    if (!origin) return;
    setNewTrip((prev) =>
      prev.routeFrom && prev.routeFrom !== origin
        ? prev
        : { ...prev, routeFrom: origin }
    );
  }, [showBookDialog, stationScopedStaff, user?.stationName]);

  const scheduleVehicle = vehiclesForScheduling.find(
    (v) => vehicleRegistrationKey(v) === newTrip.vehicle
  );
  const scheduleCapacity = Number(scheduleVehicle?.capacity ?? 0);
  const scheduleFare = parseFloat(newTrip.fare) || 0;
  const scheduleFullCoachCommission = useMemo(() => {
    if (scheduleFare <= 0 || scheduleCapacity <= 0) return null;
    return calculateTierInfo(commissionTiers, scheduleFare, scheduleCapacity);
  }, [commissionTiers, scheduleFare, scheduleCapacity]);

  const stationExpectedCommission = useMemo(() => {
    return userTrips.reduce((sum, trip) => {
      const cap = Number(trip.capacity ?? 0);
      const fare = Number(trip.fare ?? 0);
      if (cap <= 0 || fare <= 0) return sum;
      return sum + calculateTierInfo(commissionTiers, fare, cap).totalCommission;
    }, 0);
  }, [userTrips, commissionTiers]);

  const [driverHistoryDriverId, setDriverHistoryDriverId] = useState('');
  const [driverHistorySearch, setDriverHistorySearch] = useState('');
  const [driverHistoryTrips, setDriverHistoryTrips] = useState<TripRecord[]>([]);
  const [driverHistoryLoading, setDriverHistoryLoading] = useState(false);
  const [journeyActionTripId, setJourneyActionTripId] = useState<string | null>(null);

  const tripStationContext = () =>
    dataEntry.selectedStation?.name || user?.stationName || 'RISE Station';

  const loadDriverTripHistory = useCallback(async () => {
    if (!driverHistoryDriverId) {
      notify.error('Select a driver first');
      return;
    }
    setDriverHistoryLoading(true);
    try {
      const response = await tripApi.getAll({
        driverId: driverHistoryDriverId,
        search: driverHistorySearch.trim() || undefined,
        limit: 100,
        ...listParamsForDataEntry(user, dataEntry.effectiveStationId),
      });
      if (response.success && response.data) {
        const list = parseListResponse<TripRecord>(response.data, 'trips').map(normalizeTrip);
        setDriverHistoryTrips(list);
      } else {
        setDriverHistoryTrips([]);
      }
    } catch {
      setDriverHistoryTrips([]);
      notify.error('Failed to load driver trip history');
    } finally {
      setDriverHistoryLoading(false);
    }
  }, [driverHistoryDriverId, driverHistorySearch, user, dataEntry.effectiveStationId]);

  const handleTripOperationStatus = async (
    tripId: string,
    status: string,
    statusReason?: string
  ) => {
    if (tripStatusRequiresReason(status) && !statusReason?.trim()) {
      notify.error('A reason is required for this status');
      return;
    }
    try {
      const response = await tripApi.updateStatus(tripId, status, statusReason?.trim());
      if (response.success) {
        notify.success('Trip status updated');
        await refreshTrips();
      } else {
        notify.error(formatApiError(response.error, 'Failed to update status'));
      }
    } catch {
      notify.error('Failed to update status');
    }
  };

  const handleStartJourneyForTrip = async (tripId: string, trip: TripRecord) => {
    setJourneyActionTripId(tripId);
    try {
      const result = await startTripJourneyAndPrint({
        tripId,
        trip,
        stationName: tripStationContext(),
        branchPhone: user?.phone,
      });
      if (!result.ok) {
        notify.error(result.error ?? 'Could not start journey');
        return;
      }
      notify.success('Journey started — police receipt check sent to printer');
      await refreshTrips();
    } finally {
      setJourneyActionTripId(null);
    }
  };

  const handlePrintPoliceCheck = async (tripId: string, trip: TripRecord) => {
    setJourneyActionTripId(tripId);
    try {
      const result = await printPoliceCheckForTrip({
        tripId,
        trip,
        stationName: tripStationContext(),
        branchPhone: user?.phone,
      });
      if (!result.ok) {
        notify.error(result.error ?? 'Could not print police check');
        return;
      }
      notify.info('Police receipt check sent to printer');
    } finally {
      setJourneyActionTripId(null);
    }
  };

  const TripCard = ({ trip }: { trip: any }) => {
    const tierInfo = calculateTierInfo(commissionTiers, trip.fare, trip.booked);
    
    return (
      <Card className="rounded-xl ring-1 ring-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Route className="h-5 w-5" />
                <span>{trip.routeFrom} → {trip.routeTo}</span>
              </CardTitle>
              <p className="text-sm text-gray-600">{trip.id}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {getStatusBadge(trip.status)}
              <TierBadge fare={trip.fare} tiers={commissionTiers} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="flex items-center space-x-1 mb-1">
                <Clock className="h-3 w-3" />
                <span>Departure: {formatTripDepartureDisplay(trip)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Bus className="h-3 w-3" />
                <span>Vehicle: {trip.vehicle}</span>
              </div>
            </div>
            <div>
              <p className="font-medium text-gray-700">Driver</p>
              <p>{trip.driver}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-700">Capacity</p>
              <p>{trip.capacity}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Booked</p>
              <p>{trip.booked}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Available</p>
              <p className={trip.available === 0 ? 'text-red-600' : 'text-green-600'}>
                {trip.available}
              </p>
            </div>
          </div>

          {/* Updated Revenue Display */}
          <div className="space-y-3 p-3 bg-muted rounded-lg text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-gray-700">Trip Revenue</p>
                <p className="text-lg font-bold">₵{tierInfo.tripRevenue.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">₵{trip.fare} × {trip.booked} passengers</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Total Commission</p>
                <p className="text-lg font-bold text-[#193cb8]">₵{tierInfo.totalCommission.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">₵{tierInfo.commissionPerPassenger.toFixed(2)} × {trip.booked} passengers</p>
              </div>
            </div>
            <div className="pt-2 border-t">
              <p className="font-medium text-gray-700">Net Revenue</p>
              <p className="text-xl font-bold text-green-600">₵{tierInfo.netRevenue.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Trip revenue minus total commission</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm">
              <p className="text-muted-foreground">Per passenger net: ₵{trip.booked > 0 ? (tierInfo.netRevenue / trip.booked).toFixed(2) : '0.00'}</p>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => openPassengersDialog(trip)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              {getTripSeatStats(trip).canBook && (
                <Button 
                  size="sm"
                  onClick={() => openBookPassengerModal(trip.id)}
                >
                  Book
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (tripsLoading && trips.length === 0 && !tripsError && !awaitingStationPick) {
    return (
      <div className="p-6 min-h-[420px] rise-dashboard-page">
        <RisePreloader variant="page" label="Loading trips…" />
      </div>
    );
  }

  return (
    <div className="min-h-full rise-dashboard-page">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {dataEntry.needsPicker && (
        <DataEntryStationBanner
          stationId={dataEntry.stationId}
          onStationIdChange={dataEntry.setStationId}
          stations={dataEntry.stations}
          loading={dataEntry.loading}
          loadError={dataEntry.loadError}
          onRetry={() => void dataEntry.reloadStations()}
          description={dataEntry.pickerDescription}
        />
      )}

      {stationScopedStaff && stationExpectedCommission > 0 && (
        <Alert className="border-[#193cb8]/30 bg-[#193cb8]/5">
          <DollarSign className="h-4 w-4" />
          <AlertDescription>
            Expected RISE commission if all scheduled trips sell out at full capacity:{' '}
            <strong>₵{stationExpectedCommission.toFixed(2)}</strong> (remit to RISE after trips
            complete).
          </AlertDescription>
        </Alert>
      )}

      <PageHeader
        title="Trip registration"
        description={pageDescription}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refreshTrips({ toastOnError: true })}
              disabled={tripsLoading || awaitingStationPick}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${tripsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowTierGuide(true)}>
              <Info className="h-4 w-4 mr-2" />
              Tier guide
            </Button>
            <Button
              className="shadow-sm"
              disabled={awaitingStationPick}
              onClick={() => setShowBookDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Schedule trip
            </Button>
          </>
        }
      />

      {tripsError ? (
        <RiseStatusAlert type="error" title="Could not load trips">
          {tripsError}
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => void refreshTrips({ toastOnError: true })}
          >
            Try again
          </Button>
        </RiseStatusAlert>
      ) : null}

      <Dialog open={showTierGuide} onOpenChange={setShowTierGuide}>
            <DialogContent className="max-w-2xl rounded-2xl">
              <DialogHeader>
                <DialogTitle>Commission Tier System</DialogTitle>
                <DialogDescription>
                  Understanding the fare-based commission structure for RISE transport services
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Alert>
                  <DollarSign className="h-4 w-4" />
                  <AlertDescription>
                    Commission fees are automatically calculated based on trip fare ranges and collected per passenger booking.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-3">
                  {commissionTiers.map((tier) => (
                    <Card key={tier.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className={tier.color}>
                          {tier.name}
                        </Badge>
                        <span className="font-bold text-lg">₵{tier.commission.toFixed(2)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{tier.description}</p>
                      <p className="text-sm">
                        <strong>Fare Range:</strong> ₵{tier.minFare} -{' '}
                        {tier.maxFare == null ? '∞' : `₵${tier.maxFare}`}
                      </p>
                    </Card>
                  ))}
                </div>

                {isSuperAdmin() && (
                  <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
                    <div>
                      <h4 className="font-medium">Edit tier fees</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Changes apply system-wide for trip commission calculations.
                      </p>
                    </div>
                    {tierEditRows.map((row, index) => (
                      <div
                        key={row.tierLevel}
                        className="grid grid-cols-1 gap-3 rounded-md border bg-background p-3 sm:grid-cols-2 lg:grid-cols-3"
                      >
                        <div className="space-y-1">
                          <Label>Name</Label>
                          <Input
                            value={row.name}
                            onChange={(e) => {
                              const next = [...tierEditRows];
                              next[index] = { ...row, name: e.target.value };
                              setTierEditRows(next);
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Min fare (₵)</Label>
                          <Input
                            value={row.minFare}
                            onChange={(e) => {
                              const next = [...tierEditRows];
                              next[index] = { ...row, minFare: e.target.value };
                              setTierEditRows(next);
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Max fare (₵)</Label>
                          <Input
                            placeholder="No max"
                            value={row.maxFare}
                            onChange={(e) => {
                              const next = [...tierEditRows];
                              next[index] = { ...row, maxFare: e.target.value };
                              setTierEditRows(next);
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Fee / passenger (₵)</Label>
                          <Input
                            value={row.commission}
                            onChange={(e) => {
                              const next = [...tierEditRows];
                              next[index] = { ...row, commission: e.target.value };
                              setTierEditRows(next);
                            }}
                          />
                        </div>
                        <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                          <Label>Description</Label>
                          <Input
                            value={row.description}
                            onChange={(e) => {
                              const next = [...tierEditRows];
                              next[index] = { ...row, description: e.target.value };
                              setTierEditRows(next);
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="p-4 bg-[#193cb8]/10 rounded-lg">
                  <h4 className="font-medium mb-2">How It Works</h4>
                  <ul className="text-sm space-y-1 text-[#193cb8]">
                    <li>• Commission is charged per passenger per trip</li>
                    <li>• Tiers are determined by the trip fare amount</li>
                    <li>• <strong>Trip Revenue = Fare × Total Passengers</strong></li>
                    <li>• <strong>Total Commission = Commission Rate × Total Passengers</strong></li>
                    <li>• <strong>Net Revenue = Trip Revenue - Total Commission</strong></li>
                  </ul>
                </div>
              </div>
              {isSuperAdmin() && (
                <DialogFooter>
                  <Button
                    type="button"
                    className="w-full sm:w-auto bg-[#193cb8] hover:bg-[#152f94]"
                    onClick={() => void handleSaveCommissionTiers()}
                    disabled={tierSaving}
                  >
                    {tierSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      'Save tier configuration'
                    )}
                  </Button>
                </DialogFooter>
              )}
            </DialogContent>
      </Dialog>

      <Dialog open={showBookDialog} onOpenChange={setShowBookDialog}>
            <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden rounded-2xl sm:max-w-2xl">
              <DialogHeader className="border-b border-border/80 bg-gradient-to-br from-muted/50 to-background px-6 py-5">
                <div className="flex items-start gap-4 pr-6">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
                    <Route className="h-5 w-5" strokeWidth={2.25} />
                  </span>
                  <div className="space-y-1 min-w-0">
                    <DialogTitle className="text-xl font-semibold tracking-tight">
                      Schedule trip
                    </DialogTitle>
                    <DialogDescription className="text-sm leading-relaxed">
                      Set route, departure, vehicle, driver, and fare. Passengers can book once the
                      trip is on the schedule.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <DialogBody className="px-6 py-5 space-y-4 max-h-[min(58vh,520px)]">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="from">From</Label>
                    <Input
                      id="from"
                      value={newTrip.routeFrom}
                      onChange={(e) => setNewTrip({ ...newTrip, routeFrom: e.target.value })}
                      placeholder="Origin city or station"
                      readOnly={stationScopedStaff}
                      className={stationScopedStaff ? 'bg-muted' : undefined}
                    />
                    {stationScopedStaff && (
                      <p className="text-xs text-muted-foreground mt-1">
                        From is set to your operating station
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="to">To</Label>
                    <Input
                      id="to"
                      value={newTrip.routeTo}
                      onChange={(e) => setNewTrip({ ...newTrip, routeTo: e.target.value })}
                      placeholder="Destination city or station"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newTrip.departureDate}
                      onChange={(e) => setNewTrip({...newTrip, departureDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={newTrip.departureTime}
                      onChange={(e) => setNewTrip({...newTrip, departureTime: e.target.value})}
                    />
                  </div>
                </div>
                
                {/* Enhanced Vehicle Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="vehicle">Vehicle</Label>
                    {canManageVehicles ? (
                    <Dialog open={showVehicleRegDialog} onOpenChange={setShowVehicleRegDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <CarFront className="h-4 w-4 mr-1" />
                          Register Vehicle
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Quick Vehicle Registration</DialogTitle>
                          <DialogDescription>
                            Register a new vehicle for trip scheduling. For detailed management, visit the Vehicles section.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="vehicleReg">Registration Number</Label>
                            <Input
                              id="vehicleReg"
                              value={newVehicle.registrationNumber}
                              onChange={(e) => setNewVehicle({...newVehicle, registrationNumber: e.target.value})}
                              placeholder="GV-123-20"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="vehicleMake">Make</Label>
                              <Input
                                id="vehicleMake"
                                value={newVehicle.make}
                                onChange={(e) => setNewVehicle({...newVehicle, make: e.target.value})}
                                placeholder="Hyundai"
                              />
                            </div>
                            <div>
                              <Label htmlFor="vehicleModel">Model</Label>
                              <Input
                                id="vehicleModel"
                                value={newVehicle.model}
                                onChange={(e) => setNewVehicle({...newVehicle, model: e.target.value})}
                                placeholder="County"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="vehicleYear">Year</Label>
                              <Input
                                id="vehicleYear"
                                type="number"
                                value={newVehicle.year}
                                onChange={(e) => setNewVehicle({...newVehicle, year: e.target.value})}
                                placeholder="2024"
                              />
                            </div>
                            <div>
                              <Label htmlFor="vehicleCapacity">Capacity</Label>
                              <Input
                                id="vehicleCapacity"
                                type="number"
                                value={newVehicle.capacity}
                                onChange={(e) => setNewVehicle({...newVehicle, capacity: e.target.value})}
                                placeholder="35"
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="vehicleFuel">Fuel Type</Label>
                            <Select value={newVehicle.fuelType} onValueChange={(value) => setNewVehicle({...newVehicle, fuelType: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select fuel type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Diesel">Diesel</SelectItem>
                                <SelectItem value="Petrol">Petrol</SelectItem>
                                <SelectItem value="CNG">CNG</SelectItem>
                                <SelectItem value="Electric">Electric</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={handleRegisterVehicle} className="flex-1">
                              Register Vehicle
                            </Button>
                            <Button variant="outline" asChild>
                              <a href="#vehicles" className="flex items-center gap-1">
                                <ExternalLink className="h-4 w-4" />
                                Full Management
                              </a>
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    ) : null}
                  </div>
                  <VehicleSearchSelect
                    hideLabel
                    vehicles={vehiclesForScheduling.map((vehicle) => {
                      const reg = vehicleRegistrationKey(vehicle);
                      return {
                        id: String(vehicle.id ?? reg),
                        registration: reg,
                        capacity:
                          vehicle.capacity != null ? Number(vehicle.capacity) : undefined,
                        make: vehicle.make != null ? String(vehicle.make) : undefined,
                        model: vehicle.model != null ? String(vehicle.model) : undefined,
                        driverName: driverNameForVehicle(vehicle, drivers) || undefined,
                      };
                    })}
                    value={newTrip.vehicle}
                    loading={vehiclesLoading}
                    emptyMessage={
                      canManageVehicles
                        ? 'No vehicles available — register one above or add fleet under Vehicles'
                        : 'No vehicles found — contact operations to register fleet'
                    }
                    onValueChange={(value) => {
                      const vehicle = vehiclesForScheduling.find(
                        (v) => vehicleRegistrationKey(v) === value
                      );
                      const assignedDriver = driverNameForVehicle(vehicle, drivers);
                      const driverMatch = drivers.find(
                        (d) => String(d.name) === assignedDriver
                      );
                      setNewTrip({
                        ...newTrip,
                        vehicle: value,
                        driver: assignedDriver,
                        driverId: driverMatch ? String(driverMatch.id) : '',
                      });
                    }}
                  />
                </div>
                
                {/* Enhanced Driver Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="driver">Driver</Label>
                    {canManageDrivers ? (
                    <Dialog open={showDriverRegDialog} onOpenChange={setShowDriverRegDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <UserPlus className="h-4 w-4 mr-1" />
                          Register Driver
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Quick Driver Registration</DialogTitle>
                          <DialogDescription>
                            Register a new driver for trip scheduling. For detailed management, visit the Drivers section.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="driverName">Full Name</Label>
                            <Input
                              id="driverName"
                              value={newDriver.name}
                              onChange={(e) => setNewDriver({...newDriver, name: e.target.value})}
                              placeholder="Kwame Asante"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="driverPhone">Phone</Label>
                              <Input
                                id="driverPhone"
                                value={newDriver.phone}
                                onChange={(e) => setNewDriver({...newDriver, phone: e.target.value})}
                                placeholder="+233 XX XXX XXXX"
                              />
                            </div>
                            <div>
                              <Label htmlFor="driverEmail">Email</Label>
                              <Input
                                id="driverEmail"
                                type="email"
                                value={newDriver.email}
                                onChange={(e) => setNewDriver({...newDriver, email: e.target.value})}
                                placeholder="driver@email.com"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="driverLicense">License Number</Label>
                              <Input
                                id="driverLicense"
                                value={newDriver.licenseNumber}
                                onChange={(e) => setNewDriver({...newDriver, licenseNumber: e.target.value})}
                                placeholder="DL-GH-XXXXXX"
                              />
                            </div>
                            <div>
                              <Label htmlFor="driverExpiry">License Expiry</Label>
                              <Input
                                id="driverExpiry"
                                type="date"
                                value={newDriver.licenseExpiry}
                                onChange={(e) => setNewDriver({...newDriver, licenseExpiry: e.target.value})}
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="driverExperience">Years of Experience</Label>
                            <Input
                              id="driverExperience"
                              type="number"
                              value={newDriver.experience}
                              onChange={(e) => setNewDriver({...newDriver, experience: e.target.value})}
                              placeholder="5"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={handleRegisterDriver} className="flex-1">
                              Register Driver
                            </Button>
                            <Button variant="outline" asChild>
                              <a href="#drivers" className="flex items-center gap-1">
                                <ExternalLink className="h-4 w-4" />
                                Full Management
                              </a>
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    ) : null}
                  </div>
                  <DriverSearchSelect
                    hideLabel
                    drivers={availableDrivers
                      .map((d) => {
                        const id = driverRecordId(d as Record<string, unknown>);
                        if (!id) return null;
                        return {
                          id,
                          name: driverOptionLabel(d),
                          licenseNumber:
                            d.licenseNumber != null ? String(d.licenseNumber) : undefined,
                          phone: d.phone != null ? String(d.phone) : undefined,
                          photoUrl: d.photoUrl != null ? String(d.photoUrl) : undefined,
                        };
                      })
                      .filter((d): d is NonNullable<typeof d> => d != null)}
                    value={newTrip.driverId}
                    emptyMessage="No drivers match — register a driver or check availability"
                    onValueChange={(driverId) => {
                      const driver = availableDrivers.find(
                        (d) =>
                          driverRecordId(d as Record<string, unknown>) === String(driverId)
                      );
                      setNewTrip({
                        ...newTrip,
                        driverId,
                        driver: driver ? String(driver.name) : '',
                      });
                    }}
                  />
                </div>
                
                <div>
                  <Label htmlFor="fare">Fare (₵)</Label>
                  <Input
                    id="fare"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={newTrip.fare}
                    onChange={(e) => setNewTrip({...newTrip, fare: e.target.value})}
                    placeholder="45.00"
                  />
                </div>

                {newTrip.fare && parseFloat(newTrip.fare) > 0 && (
                  <TierInfoCard fare={parseFloat(newTrip.fare)} tiers={commissionTiers} />
                )}
                {scheduleFullCoachCommission && (
                  <Alert className="border-[#193cb8]/30 bg-[#193cb8]/5">
                    <Calculator className="h-4 w-4" />
                    <AlertDescription>
                      If this vehicle fills all{' '}
                      <strong>{scheduleCapacity} seats</strong> at ₵{scheduleFare.toFixed(2)} per
                      passenger, RISE commission (amount station remits) is{' '}
                      <strong>
                        ₵{scheduleFullCoachCommission.totalCommission.toFixed(2)}
                      </strong>
                      .
                    </AlertDescription>
                  </Alert>
                )}

              </DialogBody>
              <DialogFooter className="gap-2 sm:gap-2 bg-muted/20">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowBookDialog(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleScheduleTrip()}
                  disabled={isSubmitting}
                  className="min-w-[140px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Scheduling…
                    </>
                  ) : (
                    <>
                      <Route className="h-4 w-4 mr-2" />
                      Schedule trip
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
      </Dialog>

      {!awaitingStationPick ? (
        <section className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-4 sm:p-5 ring-1 ring-border/40">
          <h2 className="text-sm font-semibold tracking-tight mb-4">Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            <DashboardStatCard
              title="Trips"
              value={totalTrips}
              icon={Route}
              accent="blue"
              hint="Total in registry"
            />
            <DashboardStatCard
              title="Scheduled"
              value={scheduledCount}
              icon={CheckCircle}
              accent="emerald"
              hint="On this page"
            />
            <DashboardStatCard
              title="Passengers"
              value={totalPassengersBooked}
              icon={Users}
              accent="amber"
              hint="Seats booked (page)"
            />
            <DashboardStatCard
              title="Commission"
              value={`₵${totalCommissionPage.toFixed(2)}`}
              icon={DollarSign}
              accent="violet"
              hint={`Net ₵${totalNetRevenuePage.toFixed(2)} on page`}
            />
          </div>
        </section>
      ) : null}

      {!awaitingStationPick &&
      (availableDrivers.length === 0 || vehiclesForScheduling.length === 0) ? (
        <RiseStatusAlert type="warning" title="Fleet required before scheduling">
          {availableDrivers.length === 0 && vehiclesForScheduling.length === 0
            ? canManageVehicles || canManageDrivers
              ? 'Register drivers and vehicles before scheduling trips.'
              : 'No drivers or vehicles are assigned to your station yet — contact your station manager.'
            : availableDrivers.length === 0
              ? canManageDrivers
                ? 'Register drivers before scheduling trips.'
                : 'No drivers available — contact your station manager.'
              : canManageVehicles
                ? 'Add vehicles to your station fleet before scheduling trips.'
                : 'No vehicles at your station — contact your station manager.'}
        </RiseStatusAlert>
      ) : null}

      {!awaitingStationPick ? (
        <section className="rounded-2xl border border-border/60 bg-card/30 p-4 sm:p-5 ring-1 ring-border/40 space-y-4">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Commission by tier</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Revenue and RISE commission for trips on this page, grouped by fare tier.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {tierStats.map((tierStat) => (
              <Card key={tierStat.id} className="rounded-xl shadow-sm ring-1 ring-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={tierStat.color}>
                      {tierStat.name}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{tierStat.tripCount} trips</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-muted-foreground text-xs">Trip revenue</p>
                      <p className="font-medium tabular-nums">₵{tierStat.totalRevenue.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Commission</p>
                      <p className="font-medium text-primary tabular-nums">
                        ₵{tierStat.totalCommission.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-muted-foreground text-xs">Net revenue</p>
                    <p className="font-medium text-green-600 tabular-nums">
                      ₵{tierStat.netRevenue.toFixed(2)}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">{tierStat.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <Dialog
        open={showPassengerBookDialog}
        onOpenChange={(open) => {
          if (open) setShowPassengerBookDialog(true);
          else closePassengerBookDialog();
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Book passengers</DialogTitle>
            <DialogDescription>
              {activeBookingTrip ? (
                <>
                  {String(activeBookingTrip.routeFrom ?? '')} →{' '}
                  {String(activeBookingTrip.routeTo ?? '')} ·{' '}
                  {activeBookingTrip.departureTime
                    ? formatTripDepartureDisplay(activeBookingTrip)
                    : ''}
                </>
              ) : (
                'Each passenger is booked and their ticket prints as you add them.'
              )}
            </DialogDescription>
          </DialogHeader>
          <PassengerBookingEntry
            method={passengerBookingMethod}
            onMethodChange={setPassengerBookingMethod}
            idPrefix="trip-book"
            values={passengerBooking}
            onChange={patchPassengerBookingForm}
            showSeatCount
            maxSeats={
              activeBookingTrip
                ? seatStatsForTrip(activeBookingTrip).remaining
                : 99
            }
            showNotes
            phoneLookup={passengerPhoneLookup}
            profileFound={passengerProfileFound}
            duplicateOnTrip={duplicateTripBooking}
          />
          <PassengerBookingQueuePanel queue={bookingQueue} />
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              className="flex-1"
              onClick={() => void handleBookAndPrintPassenger()}
              disabled={duplicateTripBooking || !passengerBooking.tripId || bulkSubmitting}
            >
              {bulkSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Booking…
                </>
              ) : (
                'Book & print ticket'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => void handleBookingSessionDone()}
              disabled={bulkSubmitting || sessionCompleting}
            >
              {sessionCompleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending SMS…
                </>
              ) : (
                'Done'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="rounded-2xl shadow-sm ring-1 ring-border/50 overflow-hidden">
        <CardHeader className="space-y-4 border-b border-border/60 bg-muted/20 pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Trip schedule</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {awaitingStationPick
                  ? 'Select a station above to load trips'
                  : `${totalTrips} trip${totalTrips === 1 ? '' : 's'} · search and filter`}
              </p>
            </div>
            {!awaitingStationPick ? (
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto lg:min-w-[520px]">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Route, trip ID, vehicle…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-10 bg-background/80"
                  />
                </div>
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="h-10 w-full sm:w-[150px] bg-background/80"
                  aria-label="Departure date"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-10 w-full sm:w-[160px] bg-background/80">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All status</SelectItem>
                    {TRIP_OPERATION_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className={tripsLoading ? 'opacity-60 pointer-events-none transition-opacity' : ''}>
            {awaitingStationPick ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                Pick a station to view and schedule trips for that terminal.
              </div>
            ) : userTrips.length === 0 ? (
              <div className="py-16 text-center">
                <Route className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm font-medium">No trips found</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  {searchTerm.trim() || statusFilter !== 'all' || dateFilter
                    ? 'Adjust filters or clear search.'
                    : 'Schedule a trip to open bookings for passengers.'}
                </p>
                {!searchTerm.trim() && statusFilter === 'all' && !dateFilter ? (
                  <Button className="mt-4" onClick={() => setShowBookDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule trip
                  </Button>
                ) : null}
              </div>
            ) : (
              <>
                <div className="hidden lg:block">
                  <ScrollableTable
                    className="border-0 shadow-none ring-0"
                    maxHeightClass="max-h-[min(70vh,560px)]"
                    minWidthClass="min-w-[1200px]"
                  >
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Route</TableHead>
                  <TableHead>Departure</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Fare</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Trip Revenue</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Net Revenue</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userTrips.map((trip) => {
                  const tierInfo = calculateTierInfo(commissionTiers, trip.fare, trip.booked);
                  return (
                    <TableRow key={trip.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{trip.routeFrom} → {trip.routeTo}</p>
                          <p className="text-sm text-gray-500">{trip.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{formatTripDepartureDisplay(trip)}</p>
                        </div>
                      </TableCell>
                      <TableCell>{trip.vehicle}</TableCell>
                      <TableCell>{trip.driver}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{trip.booked}/{trip.capacity}</p>
                          <p className={`text-xs ${trip.available === 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {trip.available} available
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 min-w-[140px]">
                          {getStatusBadge(String(trip.status ?? 'scheduled'))}
                          {trip.statusReason ? (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {String(trip.statusReason)}
                            </p>
                          ) : null}
                          <Select
                            value={String(trip.status ?? 'scheduled')}
                            onValueChange={(value) => {
                              if (value === 'journey_started') {
                                void handleStartJourneyForTrip(String(trip.id), trip);
                                return;
                              }
                              if (tripStatusRequiresReason(value)) {
                                const reason = window.prompt(
                                  `Reason (required for ${tripStatusLabel(value)}):`
                                );
                                if (!reason?.trim()) return;
                                void handleTripOperationStatus(
                                  String(trip.id),
                                  value,
                                  reason.trim()
                                );
                                return;
                              }
                              void handleTripOperationStatus(String(trip.id), value);
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Update status" />
                            </SelectTrigger>
                            <SelectContent>
                              {TRIP_OPERATION_STATUSES.map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                  {s.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell>₵{trip.fare}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={tierInfo.tier.color}>
                          {tierInfo.tier.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">₵{tierInfo.tripRevenue.toFixed(2)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-[#193cb8]">₵{tierInfo.totalCommission.toFixed(2)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-green-600">₵{tierInfo.netRevenue.toFixed(2)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openPassengersDialog(trip)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {getTripSeatStats(trip).canBook && (
                            <Button 
                              size="sm"
                              onClick={() => openBookPassengerModal(trip.id)}
                            >
                              Book
                            </Button>
                          )}
                          {canStartTripJourney(trip) && (
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={journeyActionTripId === String(trip.id)}
                              onClick={() => void handleStartJourneyForTrip(String(trip.id), trip)}
                            >
                              {journeyActionTripId === String(trip.id) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Bus className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          {canPrintPoliceCheck(trip) && (
                            <Button
                              size="sm"
                              variant="outline"
                              title="Print police receipt check"
                              disabled={journeyActionTripId === String(trip.id)}
                              onClick={() => void handlePrintPoliceCheck(String(trip.id), trip)}
                            >
                              {journeyActionTripId === String(trip.id) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Shield className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
                  </ScrollableTable>
                </div>
                <div className="lg:hidden grid grid-cols-1 gap-3">
                  {userTrips.map((trip) => (
                    <TripCard key={String(trip.id)} trip={trip} />
                  ))}
                </div>
              </>
            )}
          </div>
          {!awaitingStationPick ? (
            <TablePagination
              page={tripsPage}
              pagination={tripsPagination}
              onPageChange={setTripsPage}
              loading={tripsLoading}
              itemLabel="trips"
              pageSize={tripsPageSize}
              onPageSizeChange={setTripsPageSize}
              alwaysShow
            />
          ) : null}
        </CardContent>
      </Card>

      {/* Passengers Dialog */}
      <Dialog open={showPassengersDialog} onOpenChange={setShowPassengersDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Trip Passengers</DialogTitle>
            <DialogDescription>
              Passenger list for {selectedTrip?.routeFrom} → {selectedTrip?.routeTo}
            </DialogDescription>
          </DialogHeader>
          {selectedTrip && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <p>Trip ID: {selectedTrip.id}</p>
                <p>Departure: {formatTripDepartureDisplay(selectedTrip)}</p>
                <p>Passengers: {selectedTrip.booked}/{selectedTrip.capacity}</p>
              </div>

              {/* Revenue Summary */}
              {selectedTrip.booked > 0 && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Trip Revenue</p>
                      <p className="font-medium">₵{calculateTierInfo(commissionTiers, selectedTrip.fare, selectedTrip.booked).tripRevenue.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Commission</p>
                      <p className="font-medium text-[#193cb8]">₵{calculateTierInfo(commissionTiers, selectedTrip.fare, selectedTrip.booked).totalCommission.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Net Revenue</p>
                      <p className="font-medium text-green-600">₵{calculateTierInfo(commissionTiers, selectedTrip.fare, selectedTrip.booked).netRevenue.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t">
                    <TierBadge fare={selectedTrip.fare} tiers={commissionTiers} showCommission={true} />
                  </div>
                </div>
              )}

              {passengersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-[#193cb8]" />
                </div>
              ) : dialogPassengers.length > 0 ? (
                <ScrollArea className="max-h-[min(50vh,420px)] pr-3">
                <div className="space-y-3">
                  {dialogPassengers.map((passenger: TripRecord, index: number) => (
                    <div key={index} className="p-4 bg-gray-50 rounded border">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Passenger Information</h4>
                          <p className="font-medium">{String(passenger.name ?? '')}</p>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Phone className="h-3 w-3" />
                            {String(passenger.phone ?? '')}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Ticket: {String(passenger.ticketId ?? '')}</p>
                        </div>
                        
                        {passenger.emergencyContact && typeof passenger.emergencyContact === 'object' ? (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Emergency Contact</h4>
                          <p className="font-medium">{String((passenger.emergencyContact as TripRecord).name ?? '')}</p>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Phone className="h-3 w-3" />
                            {String((passenger.emergencyContact as TripRecord).phone ?? '')}
                          </div>
                          <p className="text-xs text-gray-500 mt-1 capitalize">
                            {String((passenger.emergencyContact as TripRecord).relationship ?? '')}
                          </p>
                        </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
                </ScrollArea>
              ) : (
                <p className="text-center text-gray-500 py-8">No passengers booked yet</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card className="rounded-2xl shadow-sm ring-1 ring-border/50 overflow-hidden">
        <CardHeader className="border-b border-border/60 bg-muted/20">
          <CardTitle className="text-lg font-semibold">Driver trip history</CardTitle>
          <p className="text-sm text-muted-foreground">
            Search trips by driver to see success or failure and reasons
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <DriverSearchSelect
                label="Driver"
                value={driverHistoryDriverId}
                disabled={historyDriversLoading}
                placeholder={
                  historyDriversLoading ? 'Loading drivers…' : 'Search driver by name or ID…'
                }
                emptyMessage="No drivers found for your station. Register drivers under Fleet → Drivers."
                drivers={driversForTripHistory
                  .map((d) => {
                    const id = driverOptionId(d);
                    if (!id) return null;
                    return {
                      id,
                      name: driverOptionLabel(d),
                      licenseNumber:
                        d.licenseNumber != null ? String(d.licenseNumber) : undefined,
                      phone: d.phone != null ? String(d.phone) : undefined,
                    };
                  })
                  .filter((d): d is NonNullable<typeof d> => d != null)}
                onValueChange={setDriverHistoryDriverId}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Search route / trip ID</Label>
              <div className="flex gap-2">
                <Input
                  value={driverHistorySearch}
                  onChange={(e) => setDriverHistorySearch(e.target.value)}
                  placeholder="Accra, TRIP-…"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={driverHistoryLoading}
                  onClick={() => void loadDriverTripHistory()}
                >
                  {driverHistoryLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Search'
                  )}
                </Button>
              </div>
            </div>
          </div>
          {driverHistoryTrips.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Route</TableHead>
                  <TableHead>Departure</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {driverHistoryTrips.map((trip) => (
                  <TableRow key={String(trip.id)}>
                    <TableCell>
                      {trip.routeFrom} → {trip.routeTo}
                    </TableCell>
                    <TableCell>{formatTripDepartureDisplay(trip)}</TableCell>
                    <TableCell>{getStatusBadge(String(trip.status ?? ''))}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {trip.statusReason ? String(trip.statusReason) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No trips loaded yet.</p>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}