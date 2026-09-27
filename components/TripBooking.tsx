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
  MapPin, 
  Clock, 
  Users, 
  Bus,
  Calendar,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Eye,
  Phone,
  DollarSign,
  TrendingUp,
  Calculator,
  Info,
  UserPlus,
  CarFront,
  ExternalLink,
  Loader2,
  Shield
} from 'lucide-react';
import { Badge } from './ui/badge';
import {
  Dialog,
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
import { getTripSeatStats } from './utils/tripSeats';
import { notify } from './utils/notify';
import {
  tripApi,
  driverApi,
  vehicleApi,
  passengerApi,
  parseListResponse,
  formatApiError,
} from './utils/api';
import { isGlobalDataScope, listParamsForDataEntry } from './utils/stationScope';
import { useDataEntryStation } from './shared/hooks/useDataEntryStation';
import { DataEntryStationBanner } from './shared/DataEntryStationBanner';
import { toDriverApiPayload } from './utils/driverForm';
import { DriverSearchSelect } from './shared/DriverSearchSelect';
import { useEntityList } from './shared/hooks/useEntityList';
import { usePaginatedEntityList } from './shared/hooks/usePaginatedEntityList';
import { TablePagination } from './shared/TablePagination';
import {
  EMPTY_PASSENGER_BOOKING_FORM,
  PassengerBookingFormFields,
  type PassengerBookingFormValues,
} from './shared/PassengerBookingFormFields';
import {
  completePassengerBookingSession,
  createQueueId,
  isPhoneBookedForTrip,
  validatePassengerBookingForm,
  type QueuedPassengerBooking,
} from './shared/bulkPassengerBooking';
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

export function TripBooking() {
  const { user, isSuperAdmin } = useAuth();
  const { pendingAction, clearAction } = usePageAction();
  const isGlobalUser = isGlobalDataScope(user?.role);
  const stationId = user?.stationId;
  const dataEntry = useDataEntryStation();

  const fetchTrips = useCallback(
    (page: number, limit: number) =>
      tripApi.getAll(listParamsForDataEntry(user, dataEntry.effectiveStationId, { page, limit })),
    [user, dataEntry.effectiveStationId]
  );
  const fetchDrivers = useCallback(async () => {
    const params = listParamsForDataEntry(user, dataEntry.effectiveStationId);
    const response = await driverApi.getAvailable(params?.stationId);
    if (response.success && Array.isArray(response.data)) {
      return { ...response, data: { drivers: response.data } };
    }
    return response;
  }, [user, dataEntry.effectiveStationId]);
  const fetchVehicles = useCallback(
    () => vehicleApi.getAll(listParamsForDataEntry(user, dataEntry.effectiveStationId, { limit: 200 })),
    [user, dataEntry.effectiveStationId]
  );

  const {
    items: rawTrips,
    loading: tripsLoading,
    refresh: refreshTrips,
    isSubmitting,
    setIsSubmitting,
    page: tripsPage,
    setPage: setTripsPage,
    pagination: tripsPagination,
  } = usePaginatedEntityList<TripRecord>({
    fetchFn: fetchTrips,
    entityKey: 'trips',
    errorMessage: 'Failed to load trips',
  });
  const { items: drivers, loading: driversLoading, refresh: refreshDrivers } = useEntityList<TripRecord>({
    fetchFn: fetchDrivers,
    entityKey: 'drivers',
    errorMessage: 'Failed to load drivers',
  });
  const { items: vehicles, loading: vehiclesLoading, refresh: refreshVehicles } = useEntityList<TripRecord>({
    fetchFn: fetchVehicles,
    entityKey: 'vehicles',
    errorMessage: 'Failed to load vehicles',
  });

  const trips = useMemo(() => rawTrips.map(normalizeTrip), [rawTrips]);
  const loading = tripsLoading || driversLoading || vehiclesLoading;

  const [showBookDialog, setShowBookDialog] = useState(false);
  const [showPassengerBookDialog, setShowPassengerBookDialog] = useState(false);

  useEffect(() => {
    if (pendingAction === 'new-trip') {
      setShowBookDialog(true);
      clearAction();
    }
  }, [pendingAction, clearAction]);

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

  const userTrips = isGlobalUser ? trips : trips.filter((t) => t.stationId === user?.stationId);
  const activeBookingTrip = useMemo(
    () => userTrips.find((t) => String(t.id) === String(passengerBooking.tripId)),
    [userTrips, passengerBooking.tripId]
  );
  const availableDrivers = drivers.filter((d) => d.status === 'active' || !d.status);
  const availableVehicles = vehicles.filter((v) => v.status === 'active' || !v.status);

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

  const handleScheduleTrip = async () => {
    if (!newTrip.routeFrom || !newTrip.routeTo || !newTrip.departureDate || !newTrip.departureTime || !newTrip.fare) {
      notify.error('Please fill in all required trip fields');
      return;
    }

    const selectedVehicle = vehicles.find(
      (v) => String(v.registrationNumber) === newTrip.vehicle
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
    };
  };

  const handleBookAndPrintPassenger = async () => {
    const hasStoredEmergency = Boolean(
      passengerBooking.emergencyContactName?.trim() &&
        passengerBooking.emergencyContactPhone?.trim() &&
        passengerBooking.emergencyContactRelationship?.trim()
    );
    const validationError = validatePassengerBookingForm(passengerBooking, {
      returningPassenger: passengerProfileFound,
      hasStoredEmergency,
    });
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
    if (!getTripSeatStats(trip).canBook) {
      notify.error('This trip is full — no seats remaining');
      await refreshTrips();
      return;
    }

    const sid =
      dataEntry.effectiveStationId || String(trip.stationId ?? '') || dataEntry.requireStationId();
    if (!sid) return;

    setBulkSubmitting(true);
    try {
      const ticket = await issueETicket(buildPassengerBookInput(passengerBooking, trip), {
        printTicket: true,
        sendSms: false,
      });

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
        const cap = Number(trip.capacity ?? 0);
        if (cap > 0 && manifest.length >= cap) {
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

  const scheduleVehicle = vehicles.find(
    (v) => String(v.registrationNumber) === newTrip.vehicle
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
      <Card>
        <CardHeader>
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
        <Loader2 className="h-8 w-8 animate-spin text-[#193cb8] mb-4" />
        <p className="text-muted-foreground">Loading trips...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {dataEntry.needsPicker && (
        <DataEntryStationBanner
          stationId={dataEntry.stationId}
          onStationIdChange={dataEntry.setStationId}
          stations={dataEntry.stations}
          loading={dataEntry.loading}
          loadError={dataEntry.loadError}
          onRetry={() => void dataEntry.reloadStations()}
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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trip Booking & Management</h1>
          <p className="text-gray-600">
            {isGlobalUser
              ? 'Manage all trips across RISE stations with tier-based commission system'
              : `Manage trips for ${user?.stationName ?? 'your station'}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog open={showTierGuide} onOpenChange={setShowTierGuide}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Info className="h-4 w-4 mr-2" />
                Tier Guide
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
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
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Trip
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Schedule New Trip</DialogTitle>
                <DialogDescription>
                  Create a new trip schedule for passengers to book.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
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
                  </div>
                  <Select
                    value={newTrip.vehicle || undefined}
                    onValueChange={(value) => {
                      const vehicle = availableVehicles.find(
                        (v) => String(v.registrationNumber) === value
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
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableVehicles.length === 0 ? (
                        <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                          No vehicles available — register one above
                        </div>
                      ) : (
                        availableVehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.registrationNumber}>
                            {vehicle.registrationNumber} ({vehicle.capacity} seats)
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Enhanced Driver Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="driver">Driver</Label>
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
                  </div>
                  <DriverSearchSelect
                    drivers={availableDrivers.map((d) => ({
                      id: String(d.id),
                      name: String(d.name ?? ''),
                      licenseNumber: d.licenseNumber != null ? String(d.licenseNumber) : undefined,
                      phone: d.phone != null ? String(d.phone) : undefined,
                      photoUrl: d.photoUrl != null ? String(d.photoUrl) : undefined,
                    }))}
                    value={newTrip.driverId}
                    onValueChange={(driverId) => {
                      const driver = availableDrivers.find(
                        (d) => String(d.id) === String(driverId)
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

                <Button onClick={handleScheduleTrip} className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    'Schedule Trip'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Enhanced Trip Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Route className="h-8 w-8 mx-auto mb-2 text-[#193cb8]" />
            <p className="text-2xl font-bold">{userTrips.length}</p>
            <p className="text-sm text-gray-600">Total Trips</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold">{userTrips.filter(t => t.status === 'scheduled').length}</p>
            <p className="text-sm text-gray-600">Scheduled</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-[#193cb8]" />
            <p className="text-2xl font-bold">{userTrips.reduce((sum, trip) => sum + trip.booked, 0)}</p>
            <p className="text-sm text-gray-600">Total Passengers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold">
              ₵{tierStats.reduce((sum, tier) => sum + tier.totalCommission, 0).toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">Total Commission</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-[#193cb8]" />
            <p className="text-2xl font-bold">
              ₵{tierStats.reduce((sum, tier) => sum + tier.netRevenue, 0).toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">Net Revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Registration Status Alert */}
      {(availableDrivers.length === 0 || availableVehicles.length === 0) && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Registration Required:</strong> 
            {availableDrivers.length === 0 && availableVehicles.length === 0 
              ? " You need to register drivers and vehicles before scheduling trips."
              : availableDrivers.length === 0 
              ? " You need to register drivers before scheduling trips."
              : " You need to register vehicles before scheduling trips."
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Tier Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tierStats.map((tierStat) => (
          <Card key={tierStat.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={tierStat.color}>
                  {tierStat.name}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {tierStat.tripCount} trips
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Trip Revenue</p>
                  <p className="font-medium">₵{tierStat.totalRevenue.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Commission</p>
                  <p className="font-medium text-[#193cb8]">₵{tierStat.totalCommission.toFixed(2)}</p>
                </div>
              </div>
              <div className="pt-2 border-t">
                <p className="text-muted-foreground text-sm">Net Revenue</p>
                <p className="font-medium text-green-600">₵{tierStat.netRevenue.toFixed(2)}</p>
              </div>
              <p className="text-xs text-muted-foreground">{tierStat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

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
          <PassengerBookingFormFields
            idPrefix="trip-book"
            values={passengerBooking}
            onChange={patchPassengerBookingForm}
            showSeatCount
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

      {/* Enhanced Trips Table for larger screens */}
      <div className="hidden lg:block">
        <Card>
          <CardHeader>
            <CardTitle>Trip Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
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
            <TablePagination
              page={tripsPage}
              pagination={tripsPagination}
              onPageChange={setTripsPage}
              loading={tripsLoading}
              itemLabel="trips"
            />
          </CardContent>
        </Card>
      </div>

      {/* Trip Cards for mobile */}
      <div className="lg:hidden grid grid-cols-1 gap-4">
        {userTrips.map((trip) => (
          <TripCard key={trip.id} trip={trip} />
        ))}
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle>Driver trip history</CardTitle>
          <p className="text-sm text-muted-foreground">
            Search trips by driver to see success or failure and reasons
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Driver</Label>
              <Select value={driverHistoryDriverId} onValueChange={setDriverHistoryDriverId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select driver" />
                </SelectTrigger>
                <SelectContent>
                  {availableDrivers.map((d) => (
                    <SelectItem key={String(d.id)} value={String(d.id)}>
                      {String(d.name ?? d.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
  );
}