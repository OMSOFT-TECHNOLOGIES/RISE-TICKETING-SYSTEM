import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Search, 
  Filter, 
  Download, 
  Users, 
  MapPin, 
  Clock, 
  Phone, 
  Mail,
  Calendar,
  MoreHorizontal,
  Eye,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  UserPlus,
  Loader2,
  Shield,
  Pencil,
  Trash2,
  Bus,
  RefreshCw,
  Route,
  Ticket,
  ArrowLeft,
} from 'lucide-react';
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { PageHeader } from './shared/PageHeader';
import { DashboardStatCard } from './Dashboard/DashboardStatCard';
import { ScrollableTable } from './shared/ScrollableTable';
import { RisePreloader, RiseStatusAlert } from './shared/feedback';
import { AddPassengersDialog } from './PassengerManagement/AddPassengersDialog';
import { Label } from './ui/label';
import { usePageAction } from './context/PageActionContext';
import { notify } from './utils/notify';
import { useAuth } from './AuthContext';
import { tripApi, passengerApi, ticketApi, parseListResponse, formatApiError } from './utils/api';
import {
  deferListUntilStationPicked,
  emptyPaginatedListPayload,
  listParamsForDataEntry,
  mustSelectStationForDataEntry,
} from './utils/stationScope';
import { formatStationRefId } from './utils/stationPicker';
import { useDataEntryStation } from './shared/hooks/useDataEntryStation';
import { DataEntryStationBanner } from './shared/DataEntryStationBanner';
import { useClientPagination } from './shared/hooks/useClientPagination';
import { TablePagination } from './shared/TablePagination';
import { buildETicketUrl, issueETicket } from './utils/eTicket';
import { downloadCsv } from './utils/helpers';
import {
  fetchPassengerByPhone,
  normalizePhoneDigits,
} from './utils/passengerLookup';
import {
  completePassengerBookingSession,
  createQueueId,
  isPhoneBookedForTrip,
  validateBiometricPassengerBooking,
  validatePassengerBookingForm,
  type QueuedPassengerBooking,
} from './shared/bulkPassengerBooking';
import { useEntityList } from './shared/hooks/useEntityList';
import {
  EMPTY_PASSENGER_BOOKING_FORM,
  PassengerBookingFormFields,
  type PassengerBookingFormValues,
} from './shared/PassengerBookingFormFields';
import type { PassengerBookingMethod } from './shared/PassengerBookingEntry';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu';
import {
  getTripSeatStats,
  mergeTripSeatUpdateFromApi,
  patchTripWithBookedSeats,
  sumPassengerSeatsFromManifest,
} from './utils/tripSeats';
import {
  formatTripDepartureDisplay,
  getTripDepartureIso,
  localCalendarDateKey,
  tripCalendarDateKey,
} from './utils/tripDateTime';
import {
  filterTripsForBookingList,
  isBranchManagerRole,
  isTripClosedForNewBookings,
} from './utils/tripPassengerVisibility';
import {
  canPrintPoliceCheck,
  canStartTripJourney,
  printPoliceCheckForTrip,
  startTripJourneyAndPrint,
} from './utils/tripJourney';
import { TRIP_OPERATION_STATUSES, tripStatusLabel } from './constants/tripOperationStatus';
import { printDriverBookingSummary, summaryFromTrip } from './utils/driverBookingSummary';
import { Progress } from './ui/progress';
import { cn } from './ui/utils';

type TripRecord = Record<string, unknown>;
type PassengerRecord = Record<string, unknown>;

function field(record: PassengerRecord | TripRecord, key: string): string {
  const value = record[key];
  return value == null ? '' : String(value);
}

function emergencyFromPassenger(passenger: PassengerRecord): {
  name: string;
  phone: string;
  relationship: string;
} {
  const ec = passenger.emergencyContact;
  if (ec && typeof ec === 'object') {
    const nested = ec as Record<string, unknown>;
    return {
      name: nested.name != null ? String(nested.name) : field(passenger, 'emergencyContactName'),
      phone: nested.phone != null ? String(nested.phone) : field(passenger, 'emergencyContactPhone'),
      relationship:
        nested.relationship != null
          ? String(nested.relationship)
          : field(passenger, 'emergencyContactRelationship'),
    };
  }
  if (typeof ec === 'string' && ec) {
    return { name: '', phone: ec, relationship: '' };
  }
  return {
    name: field(passenger, 'emergencyContactName'),
    phone: field(passenger, 'emergencyContactPhone'),
    relationship: field(passenger, 'emergencyContactRelationship'),
  };
}

function tripFareString(trip: TripRecord): string {
  const amount = Number(trip.fare ?? trip.totalFare ?? trip.baseFare ?? 0);
  return amount > 0 ? String(amount) : '';
}

function formatTripForDisplay(trip: TripRecord): TripRecord {
  const routeFrom = String(trip.routeFrom ?? '');
  const routeTo = String(trip.routeTo ?? '');
  const routeParts = String(trip.route ?? '').split(/\s*(?:→|to)\s*/i);
  const departureIso = getTripDepartureIso(trip);
  const [datePart, timePart] = departureIso ? departureIso.split('T') : ['', ''];
  const calendarDate = tripCalendarDateKey(trip);
  return {
    ...trip,
    route: trip.route ?? `${routeFrom || routeParts[0]?.trim() || 'Unknown'} to ${routeTo || routeParts[1]?.trim() || 'Unknown'}`,
    date: calendarDate || datePart,
    time: timePart?.substring(0, 5) ?? '',
    departureDisplay: formatTripDepartureDisplay(trip),
    driver: trip.driver ?? trip.driverName ?? '',
    vehicle: trip.vehicle ?? trip.vehicleRegistration ?? '',
    ...(() => {
      const stats = getTripSeatStats(trip);
      return {
        passengerCount: stats.booked,
        capacity: stats.capacity,
        canBook: stats.canBook,
        isFull: stats.isFull,
      };
    })(),
    status: trip.status,
  };
}

function TripSeatMeter({ trip, compact }: { trip: TripRecord; compact?: boolean }) {
  const stats = getTripSeatStats(trip);
  const { capacity, booked, remaining } = stats;
  const pct = capacity > 0 ? Math.min(100, (booked / capacity) * 100) : 0;
  const full = capacity > 0 && remaining <= 0;

  if (compact) {
    return (
      <span className={cn('tabular-nums text-sm', full && 'text-destructive font-semibold')}>
        {booked}/{capacity}
      </span>
    );
  }

  return (
    <div className="space-y-1.5 min-w-[128px]">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="tabular-nums font-medium text-foreground">
          {booked}/{capacity} booked
        </span>
        <span className={cn('text-muted-foreground tabular-nums', full && 'text-destructive font-medium')}>
          {remaining} open
        </span>
      </div>
      <Progress value={pct} className={cn('h-1.5', full && '[&>div]:bg-destructive/70')} />
    </div>
  );
}

export function PassengerManagement() {
  const { user } = useAuth();
  const { pendingAction, clearAction } = usePageAction();
  const isBranchManager = isBranchManagerRole(user?.role);
  const dataEntry = useDataEntryStation();
  const needsStationPicker = mustSelectStationForDataEntry(user?.role);

  const fetchTrips = useCallback(async () => {
    if (deferListUntilStationPicked(user, dataEntry.stationId)) {
      return {
        success: true,
        data: emptyPaginatedListPayload('trips', 200),
      };
    }

    const stationSid = dataEntry.effectiveStationId
      ? formatStationRefId(dataEntry.effectiveStationId)
      : '';

    const response = await tripApi.getAll(
      listParamsForDataEntry(user, dataEntry.effectiveStationId, { limit: 500 })
    );

    if (!response.success || !stationSid || !needsStationPicker) {
      return response;
    }

    let rows = parseListResponse<TripRecord>(response.data, 'trips');
    const scoped = rows.filter((t) => formatStationRefId(t.stationId) === stationSid);
    if (scoped.length > 0) {
      return { success: true, data: { trips: scoped } };
    }

    const broad = await tripApi.getAll({ limit: 500 });
    if (broad.success && broad.data) {
      rows = parseListResponse<TripRecord>(broad.data, 'trips').filter(
        (t) => formatStationRefId(t.stationId) === stationSid
      );
      if (rows.length > 0) {
        return { success: true, data: { trips: rows } };
      }
    }

    return response;
  }, [user, dataEntry.stationId, dataEntry.effectiveStationId, needsStationPicker]);

  const {
    items: rawTrips,
    loading: tripsLoading,
    error: tripsError,
    refresh: refreshTrips,
  } = useEntityList<TripRecord>({
    fetchFn: fetchTrips,
    entityKey: 'trips',
    errorMessage: 'Failed to load trips',
  });

  const [tripBookedSeatOverrides, setTripBookedSeatOverrides] = useState<Record<string, number>>(
    {}
  );

  const trips = useMemo(() => {
    return rawTrips.map((trip) => {
      const override = tripBookedSeatOverrides[String(trip.id ?? '')];
      const base = override != null ? patchTripWithBookedSeats(trip, override) : trip;
      return formatTripForDisplay(base);
    });
  }, [rawTrips, tripBookedSeatOverrides]);
  const tripsForBooking = useMemo(
    () => filterTripsForBookingList(trips, isBranchManager),
    [trips, isBranchManager]
  );
  const [passengers, setPassengers] = useState<PassengerRecord[]>([]);
  const [passengersLoading, setPassengersLoading] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<string>('');
  const [tripSearchQuery, setTripSearchQuery] = useState('');
  const [manifestSearchQuery, setManifestSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState(() =>
    mustSelectStationForDataEntry(user?.role) ? 'all' : 'today'
  );
  const [activeTab, setActiveTab] = useState('trips');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addBookingMethod, setAddBookingMethod] = useState<PassengerBookingMethod>('manual');
  const [newPassenger, setNewPassenger] = useState({
    tripId: '',
    ...EMPTY_PASSENGER_BOOKING_FORM,
  });
  const [addPhoneLookup, setAddPhoneLookup] = useState(false);
  const [addProfileFound, setAddProfileFound] = useState(false);
  const [addDuplicateOnTrip, setAddDuplicateOnTrip] = useState(false);
  const [addTripManifest, setAddTripManifest] = useState<PassengerRecord[]>([]);
  const [addBookingQueue, setAddBookingQueue] = useState<QueuedPassengerBooking[]>([]);
  const [addBulkSubmitting, setAddBulkSubmitting] = useState(false);
  const [addSessionCompleting, setAddSessionCompleting] = useState(false);
  const addPhoneLookupSeq = useRef(0);
  const [addTripSearch, setAddTripSearch] = useState('');
  const [editPassenger, setEditPassenger] = useState<PassengerRecord | null>(null);
  const [editForm, setEditForm] = useState<PassengerBookingFormValues>({
    ...EMPTY_PASSENGER_BOOKING_FORM,
  });
  const [editSaving, setEditSaving] = useState(false);
  const [journeyStarting, setJourneyStarting] = useState(false);

  const patchNewPassengerForm = (updates: Partial<PassengerBookingFormValues>) => {
    if (updates.phone !== undefined) {
      setAddProfileFound(false);
    }
    setNewPassenger((prev) => ({ ...prev, ...updates }));
  };

  const clearAddPassengerFormFields = () => {
    setNewPassenger((prev) => ({
      tripId: prev.tripId,
      ...EMPTY_PASSENGER_BOOKING_FORM,
    }));
    setAddProfileFound(false);
  };

  const resetAddPassengerForm = () => {
    setNewPassenger({ tripId: '', ...EMPTY_PASSENGER_BOOKING_FORM });
    setAddProfileFound(false);
    setAddDuplicateOnTrip(false);
    setAddBookingQueue([]);
    setAddTripSearch('');
    setAddBookingMethod('manual');
  };
  const [detailPassenger, setDetailPassenger] = useState<PassengerRecord | null>(null);
  const [contactPassenger, setContactPassenger] = useState<PassengerRecord | null>(null);
  const [contactMessage, setContactMessage] = useState('');
  const [contactSending, setContactSending] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setSelectedTrip('');
    void refreshTrips();
  }, [dataEntry.effectiveStationId, refreshTrips]);

  useEffect(() => {
    if (!showAddDialog) return;
    const phone = newPassenger.phone.trim();
    const digits = normalizePhoneDigits(phone);
    if (digits.length < 9) {
      setAddProfileFound(false);
      return;
    }

    const seq = ++addPhoneLookupSeq.current;
    const timer = window.setTimeout(async () => {
      setAddPhoneLookup(true);
      try {
        const found = await fetchPassengerByPhone(phone);
        if (seq !== addPhoneLookupSeq.current) return;
        if (!found) {
          setAddProfileFound(false);
          return;
        }
        setAddProfileFound(true);
        setNewPassenger((prev) => ({
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
        if (seq === addPhoneLookupSeq.current) {
          setAddProfileFound(false);
        }
      } finally {
        if (seq === addPhoneLookupSeq.current) {
          setAddPhoneLookup(false);
        }
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [newPassenger.phone, showAddDialog]);

  useEffect(() => {
    if (!showAddDialog || !newPassenger.tripId) {
      setAddTripManifest([]);
      setAddDuplicateOnTrip(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const response = await passengerApi.getTripPassengers(newPassenger.tripId);
        if (cancelled) return;
        if (response.success && response.data !== undefined) {
          setAddTripManifest(parseListResponse<PassengerRecord>(response.data, 'passengers'));
        } else {
          setAddTripManifest([]);
        }
      } catch {
        if (!cancelled) setAddTripManifest([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [newPassenger.tripId, showAddDialog]);

  useEffect(() => {
    if (!showAddDialog || !newPassenger.tripId) return;
    const trip = trips.find((t) => String(t.id) === String(newPassenger.tripId));
    if (!trip) return;
    const fareStr = tripFareString(trip);
    const stationName =
      dataEntry.selectedStation?.name ||
      user?.stationName ||
      String(trip.stationName ?? '');
    setNewPassenger((prev) => ({
      ...prev,
      ...(fareStr && prev.fare !== fareStr ? { fare: fareStr } : {}),
      ...(stationName && !prev.boardingPoint?.trim()
        ? { boardingPoint: stationName }
        : {}),
    }));
  }, [
    showAddDialog,
    newPassenger.tripId,
    trips,
    dataEntry.selectedStation?.name,
    user?.stationName,
  ]);

  useEffect(() => {
    if (!showAddDialog) return;
    setAddDuplicateOnTrip(
      newPassenger.tripId
        ? isPhoneBookedForTrip(newPassenger.phone, addTripManifest, addBookingQueue)
        : false
    );
  }, [
    newPassenger.phone,
    newPassenger.tripId,
    addTripManifest,
    addBookingQueue,
    showAddDialog,
  ]);

  useEffect(() => {
    if (pendingAction === 'new-passenger') {
      setShowAddDialog(true);
      clearAction();
    }
  }, [pendingAction, clearAction]);

  useEffect(() => {
    if (!selectedTrip) {
      setPassengers([]);
      return;
    }

    let cancelled = false;
    const loadPassengers = async () => {
      setPassengersLoading(true);
      try {
        const response = await passengerApi.getTripPassengers(selectedTrip);
        if (!cancelled && response.success && response.data !== undefined) {
          setPassengers(parseListResponse<PassengerRecord>(response.data, 'passengers'));
        } else if (!cancelled) {
          setPassengers([]);
        }
      } catch {
        if (!cancelled) setPassengers([]);
      } finally {
        if (!cancelled) setPassengersLoading(false);
      }
    };

    loadPassengers();
    return () => {
      cancelled = true;
    };
  }, [selectedTrip]);

  const today = localCalendarDateKey();
  const yesterday = localCalendarDateKey(new Date(Date.now() - 86400000));

  const reloadManifest = useCallback(async () => {
    if (!selectedTrip) return;
    setPassengersLoading(true);
    try {
      const response = await passengerApi.getTripPassengers(selectedTrip);
      if (response.success && response.data !== undefined) {
        setPassengers(parseListResponse<PassengerRecord>(response.data, 'passengers'));
      }
    } finally {
      setPassengersLoading(false);
    }
  }, [selectedTrip]);

  const filteredTrips = tripsForBooking.filter((trip) => {
    const tripDate = String(trip.date ?? tripCalendarDateKey(trip) ?? '');
    const matchesDate =
      dateFilter === 'all' ||
      (dateFilter === 'today' && tripDate === today) ||
      (dateFilter === 'yesterday' && tripDate === yesterday);

    const route = String(trip.route ?? '').toLowerCase();
    const driver = String(trip.driver ?? '').toLowerCase();
    const vehicle = String(trip.vehicle ?? '').toLowerCase();
    const tripId = String(trip.id ?? '').toLowerCase();
    const query = tripSearchQuery.toLowerCase();

    const matchesSearch =
      !query ||
      route.includes(query) ||
      driver.includes(query) ||
      vehicle.includes(query) ||
      tripId.includes(query);
    
    return matchesDate && matchesSearch;
  });

  const selectedTripData = trips.find((trip) => String(trip.id) === String(selectedTrip));
  const tripPassengers = passengers;

  const selectedTripSeatStats = useMemo(() => {
    if (!selectedTripData) return null;
    return getTripSeatStats(selectedTripData);
  }, [selectedTripData]);

  const filteredPassengers = tripPassengers.filter((passenger) => {
    const matchesStatus =
      statusFilter === 'all' || field(passenger, 'status') === statusFilter;
    const query = manifestSearchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      field(passenger, 'name').toLowerCase().includes(query) ||
      field(passenger, 'phone').includes(manifestSearchQuery) ||
      field(passenger, 'email').toLowerCase().includes(query) ||
      field(passenger, 'seatNumber').toLowerCase().includes(query) ||
      field(passenger, 'ticketId').toLowerCase().includes(query);
    
    return matchesStatus && matchesSearch;
  });

  const passengerListResetKey = `${selectedTrip}|${manifestSearchQuery}|${statusFilter}`;
  const {
    paginatedItems: pagedPassengers,
    page: passengerPage,
    setPage: setPassengerPage,
    pagination: passengerPagination,
    pageSize: passengerPageSize,
    setPageSize: setPassengerPageSize,
  } = useClientPagination(filteredPassengers, undefined, passengerListResetKey);

  const awaitingStationPick =
    dataEntry.needsPicker && deferListUntilStationPicked(user, dataEntry.stationId);

  const pageDescription =
    'Book passengers on trips — e-ticket SMS is sent when you click Done after printing tickets.';

  const tripOverviewStats = useMemo(() => {
    let bookedSeats = 0;
    let openSeats = 0;
    for (const trip of filteredTrips) {
      const stats = getTripSeatStats(trip);
      bookedSeats += stats.booked;
      openSeats += stats.remaining;
    }
    return {
      tripCount: filteredTrips.length,
      bookedSeats,
      openSeats,
      manifestCount: selectedTrip ? tripPassengers.length : 0,
    };
  }, [filteredTrips, selectedTrip, tripPassengers.length]);

  const selectTrip = (tripId: string) => {
    setSelectedTrip(tripId);
    setManifestSearchQuery('');
    setStatusFilter('all');
    setActiveTab('passengers');
  };

  const openAddForSelectedTrip = () => {
    setNewPassenger({ ...EMPTY_PASSENGER_BOOKING_FORM, tripId: selectedTrip || '' });
    setAddTripSearch('');
    setShowAddDialog(true);
  };

  const getTripStatusBadge = (status: string) => {
    const statusInfo = TRIP_OPERATION_STATUSES.find((s) => s.value === status);
    if (statusInfo) {
      return (
        <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
      );
    }
    return <Badge variant="secondary">{tripStatusLabel(status)}</Badge>;
  };

  const getPassengerStatusBadge = (status: string) => {
    switch (status) {
      case 'boarded':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Boarded</Badge>;
      case 'checked-in':
        return <Badge className="bg-[#193cb8]/10 text-[#193cb8] hover:bg-[#193cb8]/20">Checked In</Badge>;
      case 'no-show':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">No Show</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'boarded':
      case 'checked-in':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'no-show':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const addDialogTrips = useMemo(() => {
    const query = addTripSearch.trim().toLowerCase();
    if (!query) return tripsForBooking;
    return tripsForBooking.filter((trip) => {
      const route = String(trip.route ?? '').toLowerCase();
      const driver = String(trip.driver ?? '').toLowerCase();
      const vehicle = String(trip.vehicle ?? '').toLowerCase();
      const id = String(trip.id ?? '').toLowerCase();
      const date = String(trip.date ?? '');
      const time = String(trip.time ?? '');
      return (
        route.includes(query) ||
        driver.includes(query) ||
        vehicle.includes(query) ||
        id.includes(query) ||
        date.includes(query) ||
        time.includes(query)
      );
    });
  }, [tripsForBooking, addTripSearch]);

  const addSelectedTrip = useMemo(
    () => trips.find((t) => String(t.id) === newPassenger.tripId),
    [trips, newPassenger.tripId]
  );

  const addSelectedTripFare = addSelectedTrip ? tripFareString(addSelectedTrip) : undefined;

  const addMaxSeats = newPassenger.tripId
    ? getTripSeatStats(addSelectedTrip ?? {}).remaining
    : 99;

  const openEditPassenger = (passenger: PassengerRecord) => {
    const emergency = emergencyFromPassenger(passenger);
    setEditForm({
      ...EMPTY_PASSENGER_BOOKING_FORM,
      name: field(passenger, 'name'),
      phone: field(passenger, 'phone'),
      email: field(passenger, 'email'),
      seatNumber: field(passenger, 'seatNumber'),
      boardingPoint: field(passenger, 'boardingPoint'),
      dropoffPoint: field(passenger, 'dropoffPoint'),
      fare: field(passenger, 'fare'),
      emergencyContactName: emergency.name,
      emergencyContactPhone: emergency.phone,
      emergencyContactRelationship: emergency.relationship,
    });
    setEditPassenger(passenger);
    setDetailPassenger(null);
  };

  const handleSavePassengerEdit = async () => {
    if (!editPassenger || !selectedTrip) return;
    const validationError = validatePassengerBookingForm(editForm, {
      returningPassenger: false,
      hasStoredEmergency: false,
    });
    if (validationError) {
      notify.error(validationError);
      return;
    }
    setEditSaving(true);
    try {
      const response = await passengerApi.updateTripPassenger(
        selectedTrip,
        field(editPassenger, 'id'),
        {
          name: editForm.name,
          phone: editForm.phone,
          email: editForm.email,
          seatNumber: editForm.seatNumber,
          boardingPoint: editForm.boardingPoint,
          dropoffPoint: editForm.dropoffPoint,
          emergencyContactName: editForm.emergencyContactName,
          emergencyContactPhone: editForm.emergencyContactPhone,
          emergencyContactRelationship: editForm.emergencyContactRelationship,
        }
      );
      if (!response.success) {
        notify.error(formatApiError(response.error, 'Failed to update passenger'));
        return;
      }
      notify.success('Passenger details updated');
      setEditPassenger(null);
      await reloadManifest();
    } finally {
      setEditSaving(false);
    }
  };

  const handleRemovePassengerFromTrip = async (passenger: PassengerRecord) => {
    if (!selectedTrip) return;
    if (
      !window.confirm(
        `Remove ${field(passenger, 'name')} from this trip? A seat will open for another booking.`
      )
    ) {
      return;
    }
    const response = await passengerApi.removeFromTrip(
      selectedTrip,
      field(passenger, 'id')
    );
    if (!response.success) {
      notify.error(formatApiError(response.error, 'Could not remove passenger'));
      return;
    }
    notify.success('Passenger removed — trip seats updated');
    await reloadManifest();
    await refreshTrips();
  };

  const handleStartJourneyAndPrintPoliceCheck = async () => {
    if (!selectedTrip || !selectedTripData) return;
    const stationName =
      dataEntry.selectedStation?.name || user?.stationName || 'RISE Station';
    const rawTrip =
      rawTrips.find((t) => String(t.id) === selectedTrip) ?? selectedTripData;
    const tripForAction = { ...selectedTripData, ...rawTrip, status: rawTrip.status };

    if (canPrintPoliceCheck(tripForAction)) {
      setJourneyStarting(true);
      try {
        const result = await printPoliceCheckForTrip({
          tripId: selectedTrip,
          trip: tripForAction,
          stationName,
          branchPhone: user?.phone,
        });
        if (!result.ok) {
          notify.error(result.error ?? 'Could not print police check');
          return;
        }
        notify.info('Police receipt check sent to printer');
      } finally {
        setJourneyStarting(false);
      }
      return;
    }

    setJourneyStarting(true);
    try {
      const result = await startTripJourneyAndPrint({
        tripId: selectedTrip,
        trip: tripForAction,
        stationName,
        branchPhone: user?.phone,
      });
      if (!result.ok) {
        notify.error(result.error ?? 'Failed to start journey');
        return;
      }
      notify.success('Journey started — police receipt check sent to printer');
      await refreshTrips();
    } finally {
      setJourneyStarting(false);
    }
  };

  const buildBookInputFromEntry = (
    entry: PassengerBookingFormValues,
    trip: TripRecord
  ) => {
    const routeText = String(trip.route ?? '');
    const [routeFrom, routeTo] = routeText.split(/\s+to\s+/i);
    const fare =
      parseFloat(entry.fare) ||
      Number(trip.fare ?? trip.totalFare ?? trip.baseFare ?? 45);
    const departureTime =
      getTripDepartureIso(trip) ||
      (trip.date && trip.time ? `${trip.date}T${trip.time}:00` : String(trip.departureTime ?? ''));

    return {
      tripId: String(trip.id),
      passengerName: entry.name,
      passengerPhone: entry.phone,
      passengerEmail: entry.email,
      routeFrom: entry.boardingPoint || routeFrom || '',
      routeTo: entry.dropoffPoint || routeTo || '',
      departureTime,
      seatNumber: entry.seatNumber,
      seats: Math.max(1, Number(entry.seats ?? 1)),
      fare,
      vehicle: String(trip.vehicle ?? ''),
      driver: String(trip.driver ?? ''),
      stationId:
        dataEntry.effectiveStationId ||
        String(trip.stationId ?? '') ||
        user?.stationId ||
        '',
      stationName:
        dataEntry.selectedStation?.name ||
        user?.stationName ||
        String(trip.stationName ?? 'Station'),
      emergencyContactName: entry.emergencyContactName,
      emergencyContactPhone: entry.emergencyContactPhone,
      emergencyContactRelationship: entry.emergencyContactRelationship,
      ...(entry.biometricReference?.trim()
        ? { biometricReference: entry.biometricReference.trim() }
        : {}),
    };
  };

  const handleBookAndPrintPassenger = async () => {
    if (!newPassenger.tripId) {
      notify.error('Please select a trip');
      return;
    }
    const hasStoredEmergency = Boolean(
      newPassenger.emergencyContactName?.trim() &&
        newPassenger.emergencyContactPhone?.trim() &&
        newPassenger.emergencyContactRelationship?.trim()
    );
    const validationOpts = {
      returningPassenger: addProfileFound,
      hasStoredEmergency,
    };
    const validationError =
      addBookingMethod === 'biometric'
        ? validateBiometricPassengerBooking(newPassenger, validationOpts)
        : validatePassengerBookingForm(newPassenger, validationOpts);
    if (validationError) {
      notify.error(validationError);
      return;
    }
    if (
      addDuplicateOnTrip ||
      isPhoneBookedForTrip(newPassenger.phone, addTripManifest, addBookingQueue)
    ) {
      notify.error('This phone number is already on this trip');
      return;
    }

    const trip = trips.find((t) => String(t.id) === String(newPassenger.tripId));
    if (!trip) {
      notify.error('Selected trip not found');
      return;
    }
    if (!isBranchManager && isTripClosedForNewBookings(trip)) {
      notify.error('This trip is full — contact your branch manager to make changes');
      await refreshTrips();
      return;
    }
    const seatStats = getTripSeatStats(trip);
    if (!seatStats.canBook) {
      notify.error('This trip is full — no seats remaining');
      await refreshTrips();
      return;
    }
    const seatsRequested = Math.max(1, Number(newPassenger.seats ?? 1));
    if (seatsRequested > seatStats.remaining) {
      notify.error(
        `Only ${seatStats.remaining} seat${seatStats.remaining === 1 ? '' : 's'} left on this trip`
      );
      return;
    }

    const sid =
      dataEntry.effectiveStationId ||
      String(trip.stationId ?? '') ||
      dataEntry.requireStationId();
    if (!sid) return;

    setAddBulkSubmitting(true);
    try {
      const { ticket, seatsBooked, updatedTrip } = await issueETicket(
        buildBookInputFromEntry(newPassenger, trip),
        {
          printTicket: true,
          sendSms: false,
        }
      );

      setAddBookingQueue((prev) => [
        ...prev,
        { ...newPassenger, queueId: createQueueId(), ticketId: ticket.id },
      ]);
      clearAddPassengerFormFields();

      setSelectedTrip(newPassenger.tripId);
      setActiveTab('passengers');
      await refreshTrips();
      const manifestRes = await passengerApi.getTripPassengers(newPassenger.tripId);
      if (manifestRes.success && manifestRes.data !== undefined) {
        const manifest = parseListResponse<PassengerRecord>(manifestRes.data, 'passengers');
        setAddTripManifest(manifest);
        const tripId = String(trip.id ?? newPassenger.tripId);
        const manifestSeats = sumPassengerSeatsFromManifest(manifest);
        const mergedTrip = mergeTripSeatUpdateFromApi(trip, updatedTrip, seatsBooked);
        const bookedSeats =
          manifestSeats > 0 ? manifestSeats : getTripSeatStats(mergedTrip).booked;
        setTripBookedSeatOverrides((prev) => ({ ...prev, [tripId]: bookedSeats }));
        const cap = Number(trip.capacity ?? 0);
        if (cap > 0 && bookedSeats >= cap) {
          notify.success('Trip is now fully booked', {
            description: 'Printing driver summary for police inspection.',
          });
          const origin =
            dataEntry.selectedStation?.name ||
            user?.stationName ||
            String(trip.stationName ?? 'RISE Station');
          printDriverBookingSummary(summaryFromTrip(trip, origin, bookedSeats));
        }
      }
    } catch {
      // issueETicket shows errors
    } finally {
      setAddBulkSubmitting(false);
    }
  };

  const closeAddPassengerDialog = (force = false) => {
    if (!force && (addBulkSubmitting || addSessionCompleting)) {
      return;
    }
    setShowAddDialog(false);
    resetAddPassengerForm();
  };

  const handleAddBookingSessionDone = async () => {
    if (addBulkSubmitting || addSessionCompleting) return;
    setAddSessionCompleting(true);
    try {
      await completePassengerBookingSession(addBookingQueue);
      closeAddPassengerDialog(true);
    } finally {
      setAddSessionCompleting(false);
    }
  };

  const exportPassengerList = async () => {
    if (!selectedTrip) {
      notify.error('Select a trip first');
      return;
    }
    if (filteredPassengers.length === 0) {
      notify.warning('No passengers to export');
      return;
    }

    setExporting(true);
    try {
      const tripLabel = selectedTripData
        ? String(selectedTripData.route ?? 'trip').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-')
        : 'trip';
      const datePart = selectedTripData?.date ?? today;
      const filename = `passengers-${tripLabel}-${datePart}.csv`;

      downloadCsv(
        filename,
        [
          'Name',
          'Phone',
          'Email',
          'Seat',
          'Ticket ID',
          'Boarding',
          'Drop-off',
          'Fare (GHS)',
          'Status',
          'Booking Date',
          'Emergency Contact Name',
          'Emergency Contact Phone',
          'Emergency Relationship',
        ],
        filteredPassengers.map((passenger) => {
          const emergency = emergencyFromPassenger(passenger);
          return [
            field(passenger, 'name'),
            field(passenger, 'phone'),
            field(passenger, 'email'),
            field(passenger, 'seatNumber'),
            field(passenger, 'ticketId'),
            field(passenger, 'boardingPoint'),
            field(passenger, 'dropoffPoint'),
            field(passenger, 'fare'),
            field(passenger, 'status'),
            field(passenger, 'bookingDate'),
            emergency.name,
            emergency.phone,
            emergency.relationship,
          ];
        })
      );
      notify.success('Passenger list exported');
    } finally {
      setExporting(false);
    }
  };

  const openContactDialog = (passenger: PassengerRecord) => {
    setContactPassenger(passenger);
    setContactMessage(
      `Hello ${field(passenger, 'name')}, this is ${user?.stationName ?? 'RISE'} regarding your trip on ${selectedTripData?.date ?? ''}.`
    );
  };

  const handleCallPassenger = () => {
    if (!contactPassenger) return;
    const phone = field(contactPassenger, 'phone').replace(/\s/g, '');
    if (!phone) {
      notify.error('No phone number on file');
      return;
    }
    window.open(`tel:${phone}`, '_self');
  };

  const handleEmailPassenger = () => {
    if (!contactPassenger) return;
    const email = field(contactPassenger, 'email');
    if (!email) {
      notify.error('No email address on file');
      return;
    }
    const subject = encodeURIComponent(
      `Trip update — ${selectedTripData?.route ?? 'RISE'}`
    );
    const body = encodeURIComponent(contactMessage);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_self');
  };

  const handleSendSmsToPassenger = async () => {
    if (!contactPassenger) return;
    const phone = field(contactPassenger, 'phone');
    const ticketId = field(contactPassenger, 'ticketId');
    if (!phone) {
      notify.error('No phone number on file');
      return;
    }

    setContactSending(true);
    try {
      if (ticketId) {
        const ticketRes = await ticketApi.getById(ticketId);
        if (ticketRes.success && ticketRes.data) {
          const ticket = ticketRes.data as Record<string, unknown>;
          const token = ticket.token != null ? String(ticket.token) : '';
          const eTicketUrl =
            ticket.eTicketUrl != null
              ? String(ticket.eTicketUrl)
              : token
                ? buildETicketUrl(token)
                : '';
          const smsRes = await ticketApi.sendSms(ticketId, {
            phone,
            eTicketUrl,
            message: contactMessage,
          });
          if (!smsRes.success) {
            notify.error(formatApiError(smsRes.error, 'Failed to send SMS'));
            return;
          }
          notify.success(`Message sent to ${phone}`);
          setContactPassenger(null);
          return;
        }
      }

      const smsUri = `sms:${phone.replace(/\s/g, '')}?body=${encodeURIComponent(contactMessage)}`;
      window.open(smsUri, '_self');
      notify.success('Opening SMS app with your message');
      setContactPassenger(null);
    } catch {
      notify.error('Failed to contact passenger');
    } finally {
      setContactSending(false);
    }
  };

  if (tripsLoading && rawTrips.length === 0 && !tripsError && !awaitingStationPick) {
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

      <PageHeader
        title="Passenger management"
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
            <Button
              className="shadow-sm"
              disabled={awaitingStationPick}
              onClick={() => setShowAddDialog(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add passenger
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

      {!awaitingStationPick ? (
        <section className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-4 sm:p-5 ring-1 ring-border/40">
          <h2 className="text-sm font-semibold tracking-tight mb-4">Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            <DashboardStatCard
              title="Trips"
              value={tripOverviewStats.tripCount}
              icon={Route}
              accent="blue"
              hint="Matching filters"
            />
            <DashboardStatCard
              title="Seats booked"
              value={tripOverviewStats.bookedSeats}
              icon={Users}
              accent="emerald"
              hint="On filtered trips"
            />
            <DashboardStatCard
              title="Open seats"
              value={tripOverviewStats.openSeats}
              icon={Ticket}
              accent="amber"
              hint="Available to book"
            />
            <DashboardStatCard
              title="Manifest"
              value={selectedTrip ? tripOverviewStats.manifestCount : '—'}
              icon={User}
              accent="violet"
              hint={selectedTrip ? 'Selected trip' : 'Pick a trip'}
            />
          </div>
        </section>
      ) : null}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-0">
        <Card className="rounded-2xl shadow-sm ring-1 ring-border/50 overflow-hidden">
          <div className="border-b border-border/60 bg-muted/10 px-4 sm:px-6 py-5">
            <div className="rise-segment-tabs w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="trips" className="justify-center gap-1.5 px-4">
                  <span>Trip selection</span>
                  {!awaitingStationPick ? (
                    <span className="rise-segment-tab-count">{filteredTrips.length}</span>
                  ) : null}
                </TabsTrigger>
                <TabsTrigger value="passengers" disabled={!selectedTrip} className="justify-center gap-1.5 px-4">
                  <span>Manifest</span>
                  {selectedTrip ? (
                    <span className="rise-segment-tab-count">{tripPassengers.length}</span>
                  ) : null}
                </TabsTrigger>
              </TabsList>
            </div>
            {!selectedTrip && activeTab === 'trips' ? (
              <p className="text-center text-xs text-muted-foreground mt-3 max-w-md mx-auto">
                Select a trip below to unlock the manifest tab
              </p>
            ) : null}
          </div>

        <TabsContent value="trips" className="mt-0 focus-visible:outline-none">
          <div className="px-4 sm:px-6 py-4 border-b border-border/50 bg-card/30 space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <p className="text-sm text-muted-foreground max-w-xl">
                {awaitingStationPick
                  ? 'Select a station above to load trips for that terminal.'
                  : 'Pick a departure to open its passenger manifest, export list, or start journey.'}
              </p>
              {!awaitingStationPick ? (
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto lg:min-w-[440px]">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Route, driver, vehicle, trip ID…"
                      value={tripSearchQuery}
                      onChange={(e) => setTripSearchQuery(e.target.value)}
                      className="pl-9 h-10 bg-background/80"
                    />
                  </div>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="h-10 w-full sm:w-[160px] bg-background/80">
                      <Calendar className="h-4 w-4 mr-2 shrink-0" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="yesterday">Yesterday</SelectItem>
                      <SelectItem value="all">All dates</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
            </div>
            {tripsLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Refreshing trips…
              </div>
            ) : null}
          </div>

          <div className="px-4 sm:px-6 py-6">
            <div className={tripsLoading ? 'opacity-60 pointer-events-none transition-opacity' : ''}>
              {awaitingStationPick ? (
                <div className="py-20 text-center text-sm text-muted-foreground">
                  <MapPin className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  Choose a station to see scheduled departures.
                </div>
              ) : !tripsLoading && filteredTrips.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <Route className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  {tripsForBooking.length === 0 ? (
                    <p className="text-sm max-w-md mx-auto">
                      No trips for {dataEntry.selectedStation?.name ?? 'this station'}. Schedule under
                      Trip registration.
                    </p>
                  ) : (
                    <p className="text-sm">No trips match your date or search.</p>
                  )}
                  {dateFilter !== 'all' && tripsForBooking.length > 0 ? (
                    <Button type="button" variant="link" className="mt-2" onClick={() => setDateFilter('all')}>
                      Show all dates ({tripsForBooking.length})
                    </Button>
                  ) : null}
                  {!isBranchManager && tripsForBooking.length > 0 ? (
                    <p className="text-xs mt-3 max-w-md mx-auto">
                      Fully booked trips appear here for branch managers only.
                    </p>
                  ) : null}
                </div>
              ) : (
                <>
                  <div className="hidden lg:block">
                    <ScrollableTable
                      className="border-0 shadow-none ring-0"
                      maxHeightClass="max-h-[min(65vh,520px)]"
                      minWidthClass="min-w-[920px]"
                    >
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead>Route</TableHead>
                            <TableHead>Departure</TableHead>
                            <TableHead>Vehicle & driver</TableHead>
                            <TableHead>Seats</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTrips.map((trip) => {
                            const id = String(trip.id);
                            const isSelected = selectedTrip === id;
                            return (
                              <TableRow
                                key={id}
                                className={cn(
                                  'cursor-pointer',
                                  isSelected && 'bg-primary/5 hover:bg-primary/5'
                                )}
                                onClick={() => selectTrip(id)}
                              >
                                <TableCell>
                                  <div className="flex items-start gap-3 min-w-0">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                      <Route className="h-4 w-4" />
                                    </span>
                                    <div className="min-w-0">
                                      <p className="font-medium truncate max-w-[220px]">{String(trip.route)}</p>
                                      <p className="text-xs text-muted-foreground font-mono truncate">{id}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm whitespace-nowrap">
                                  <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Clock className="h-3.5 w-3.5 shrink-0" />
                                    {String(trip.departureDisplay ?? `${trip.date} ${trip.time}`)}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <p className="text-sm font-medium truncate max-w-[140px]">{String(trip.vehicle || '—')}</p>
                                  <p className="text-xs text-muted-foreground truncate max-w-[140px]">{String(trip.driver || '—')}</p>
                                </TableCell>
                                <TableCell>
                                  <TripSeatMeter trip={trip} />
                                </TableCell>
                                <TableCell>{getTripStatusBadge(String(trip.status ?? ''))}</TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    size="sm"
                                    variant={isSelected ? 'default' : 'outline'}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      selectTrip(id);
                                    }}
                                  >
                                    {isSelected ? 'Viewing' : 'Open'}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </ScrollableTable>
                  </div>

                  <div className="lg:hidden grid gap-3 sm:grid-cols-2">
                    {filteredTrips.map((trip) => {
                      const id = String(trip.id);
                      const isSelected = selectedTrip === id;
                      return (
                        <Card
                          key={id}
                          className={cn(
                            'cursor-pointer rounded-xl shadow-sm ring-1 ring-border/50 transition-all active:scale-[0.99]',
                            isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                          )}
                          onClick={() => selectTrip(id)}
                        >
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold text-sm leading-snug line-clamp-2">{String(trip.route)}</p>
                              {getTripStatusBadge(String(trip.status ?? ''))}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3.5 w-3.5 shrink-0" />
                              {String(trip.date)} · {String(trip.time)}
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <p className="truncate">
                                <Bus className="h-3 w-3 inline mr-1" />
                                {String(trip.vehicle || '—')}
                              </p>
                              <p className="truncate">{String(trip.driver || '—')}</p>
                            </div>
                            <TripSeatMeter trip={trip} />
                            <Button
                              size="sm"
                              className="w-full"
                              variant={isSelected ? 'default' : 'secondary'}
                              onClick={(e) => {
                                e.stopPropagation();
                                selectTrip(id);
                              }}
                            >
                              {isSelected ? 'Viewing manifest' : 'Open manifest'}
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="passengers" className="mt-0 focus-visible:outline-none">
          {!selectedTripData ? (
            <div className="px-6 py-20 text-center text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">No trip selected</p>
              <p className="text-xs mt-1 mb-4">Choose a departure under Trip selection.</p>
              <Button variant="outline" size="sm" onClick={() => setActiveTab('trips')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to trips
              </Button>
            </div>
          ) : (
            <>
              <div className="border-b border-border/60 bg-gradient-to-br from-muted/40 to-card px-4 sm:px-6 py-5 space-y-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex gap-4 min-w-0">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
                      <Route className="h-6 w-6" strokeWidth={2} />
                    </span>
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg sm:text-xl font-semibold tracking-tight truncate">
                          {String(selectedTripData.route)}
                        </h2>
                        {getTripStatusBadge(String(selectedTripData.status ?? ''))}
                        {isTripClosedForNewBookings(selectedTripData) && isBranchManager ? (
                          <Badge variant="outline" className="text-amber-800 border-amber-300">
                            Full — manager edit
                          </Badge>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {String(selectedTripData.departureDisplay ?? `${selectedTripData.date} ${selectedTripData.time}`)}
                        </span>
                        <span className="inline-flex items-center gap-1.5 font-mono text-xs">
                          {String(selectedTrip)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Bus className="h-3.5 w-3.5" />
                          {String(selectedTripData.vehicle || '—')}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" />
                          {String(selectedTripData.driver || '—')}
                        </span>
                      </div>
                      {selectedTripSeatStats ? (
                        <div className="max-w-xs pt-1">
                          <TripSeatMeter trip={selectedTripData} />
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('trips')}>
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Change trip
                    </Button>
                    <Button size="sm" onClick={openAddForSelectedTrip}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add passenger
                    </Button>
                    {(canPrintPoliceCheck(selectedTripData) ||
                      canStartTripJourney(selectedTripData)) && (
                      <Button
                        variant="default"
                        size="sm"
                        disabled={journeyStarting || tripPassengers.length === 0}
                        onClick={() => void handleStartJourneyAndPrintPoliceCheck()}
                      >
                        {journeyStarting ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : canPrintPoliceCheck(selectedTripData) ? (
                          <Shield className="h-4 w-4 mr-2" />
                        ) : (
                          <Bus className="h-4 w-4 mr-2" />
                        )}
                        {canPrintPoliceCheck(selectedTripData)
                          ? 'Police check'
                          : 'Start journey'}
                      </Button>
                    )}
                    <Button
                      onClick={() => void exportPassengerList()}
                      variant="outline"
                      size="sm"
                      disabled={exporting || tripPassengers.length === 0}
                    >
                      {exporting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      Export
                    </Button>
                  </div>
                </div>
              </div>

              <div className="px-4 sm:px-6 py-4 border-b border-border/50 bg-card/30">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground tabular-nums">{tripPassengers.length}</span>{' '}
                    booked
                    {manifestSearchQuery || statusFilter !== 'all' ? (
                      <>
                        {' '}
                        ·{' '}
                        <span className="font-medium text-foreground tabular-nums">
                          {filteredPassengers.length}
                        </span>{' '}
                        shown
                      </>
                    ) : null}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto lg:min-w-[380px]">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Name, phone, seat, ticket…"
                        value={manifestSearchQuery}
                        onChange={(e) => setManifestSearchQuery(e.target.value)}
                        className="pl-9 h-10 bg-background/80"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-10 w-full sm:w-[150px] bg-background/80">
                        <Filter className="h-4 w-4 mr-2 shrink-0" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All status</SelectItem>
                        <SelectItem value="boarded">Boarded</SelectItem>
                        <SelectItem value="checked-in">Checked in</SelectItem>
                        <SelectItem value="no-show">No show</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="px-4 sm:px-6 py-6 space-y-4">
                  {passengersLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : filteredPassengers.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      {tripPassengers.length === 0 &&
                      !manifestSearchQuery &&
                      statusFilter === 'all' ? (
                        <>
                          <p className="text-sm font-medium">No passengers booked yet</p>
                          <p className="text-xs mt-1">Add the first booking for this departure.</p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium">No passengers match your filters</p>
                          <p className="text-xs mt-1">Clear search or change status.</p>
                        </>
                      )}
                      <Button className="mt-4" onClick={openAddForSelectedTrip}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add passenger
                      </Button>
                    </div>
                  ) : (
                  <>
                  <ScrollableTable
                    className="border-0 shadow-none ring-0"
                    maxHeightClass="max-h-[min(70vh,560px)]"
                    minWidthClass="min-w-[960px]"
                  >
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead>Passenger</TableHead>
                          <TableHead>Seat</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Route</TableHead>
                          <TableHead>Fare</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagedPassengers.map((passenger) => (
                          <TableRow key={String(passenger.id)}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs">
                                    {getUserInitials(field(passenger, 'name') || '?')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{field(passenger, 'name')}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {field(passenger, 'ticketId') || '—'}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {field(passenger, 'seatNumber') || '—'}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 text-sm">
                                  <Phone className="h-3 w-3" />
                                  {field(passenger, 'phone') || '—'}
                                </div>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Mail className="h-3 w-3" />
                                  {field(passenger, 'email') || '—'}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{field(passenger, 'boardingPoint') || '—'}</div>
                                <div className="text-muted-foreground">
                                  → {field(passenger, 'dropoffPoint') || '—'}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              ₵{field(passenger, 'fare') || '0'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(field(passenger, 'status'))}
                                {getPassengerStatusBadge(field(passenger, 'status'))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => setDetailPassenger(passenger)}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => openEditPassenger(passenger)}
                                  >
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit details
                                  </DropdownMenuItem>
                                  {isBranchManager && (
                                    <DropdownMenuItem
                                      className="text-red-600 focus:text-red-600"
                                      onClick={() => void handleRemovePassengerFromTrip(passenger)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Remove from trip
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => openContactDialog(passenger)}
                                  >
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Contact
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollableTable>

                  <TablePagination
                    page={passengerPage}
                    pagination={passengerPagination}
                    onPageChange={setPassengerPage}
                    itemLabel="passengers"
                    pageSize={passengerPageSize}
                    onPageSizeChange={setPassengerPageSize}
                    alwaysShow
                  />
                  </>
                  )}
              </div>
            </>
          )}
        </TabsContent>
        </Card>
      </Tabs>

      <Dialog
        open={detailPassenger != null}
        onOpenChange={(open) => {
          if (!open) setDetailPassenger(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Passenger Details</DialogTitle>
            <DialogDescription>
              {selectedTripData
                ? `${field(selectedTripData, 'route')} — ${field(selectedTripData, 'date')} ${field(selectedTripData, 'time')}`
                : 'Trip manifest entry'}
            </DialogDescription>
          </DialogHeader>
          {detailPassenger && (
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>
                    {getUserInitials(field(detailPassenger, 'name') || '?')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-base">{field(detailPassenger, 'name')}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getPassengerStatusBadge(field(detailPassenger, 'status'))}
    </div>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{field(detailPassenger, 'phone') || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{field(detailPassenger, 'email') || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Seat</p>
                  <p className="font-medium">{field(detailPassenger, 'seatNumber') || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ticket ID</p>
                  <p className="font-medium">{field(detailPassenger, 'ticketId') || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fare</p>
                  <p className="font-medium">₵{field(detailPassenger, 'fare') || '0'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Booked</p>
                  <p className="font-medium">{field(detailPassenger, 'bookingDate') || '—'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Route segment</p>
                  <p className="font-medium">
                    {field(detailPassenger, 'boardingPoint') || '—'} →{' '}
                    {field(detailPassenger, 'dropoffPoint') || '—'}
                  </p>
                </div>
              </div>
              {(() => {
                const emergency = emergencyFromPassenger(detailPassenger);
                if (!emergency.name && !emergency.phone && !emergency.relationship) {
                  return null;
                }
                return (
                  <>
                    <Separator />
                    <div>
                      <div className="flex items-center gap-2 text-red-600 font-medium mb-2">
                        <Shield className="h-4 w-4" />
                        Emergency contact
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-muted-foreground">Name</p>
                          <p>{emergency.name || '—'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Phone</p>
                          <p>{emergency.phone || '—'}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Relationship</p>
                          <p className="capitalize">{emergency.relationship || '—'}</p>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    openContactDialog(detailPassenger);
                    setDetailPassenger(null);
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contact
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    openEditPassenger(detailPassenger);
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button className="flex-1" onClick={() => setDetailPassenger(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={editPassenger != null}
        onOpenChange={(open) => {
          if (!open && !editSaving) setEditPassenger(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit passenger</DialogTitle>
            <DialogDescription>
              Update contact and emergency details for this manifest entry.
            </DialogDescription>
          </DialogHeader>
          <PassengerBookingFormFields
            idPrefix="edit-passenger"
            values={editForm}
            onChange={(updates) => setEditForm((prev) => ({ ...prev, ...updates }))}
            showSeatNumber
            showRoutePoints
            compactWhenProfileFound={false}
          />
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              className="flex-1"
              disabled={editSaving}
              onClick={() => void handleSavePassengerEdit()}
            >
              {editSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                'Save changes'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={editSaving}
              onClick={() => setEditPassenger(null)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={contactPassenger != null}
        onOpenChange={(open) => {
          if (!open) setContactPassenger(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Passenger</DialogTitle>
            <DialogDescription>
              {contactPassenger
                ? `${field(contactPassenger, 'name')} · ${field(contactPassenger, 'phone')}`
                : ''}
            </DialogDescription>
          </DialogHeader>
          {contactPassenger && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact-message">Message</Label>
                <Textarea
                  id="contact-message"
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  rows={4}
                  placeholder="Trip reminder or support message..."
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button type="button" variant="outline" onClick={handleCallPassenger}>
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleEmailPassenger}
                  disabled={!field(contactPassenger, 'email')}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleSendSmsToPassenger()}
                  disabled={contactSending || !field(contactPassenger, 'phone')}
                >
                  {contactSending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <MessageSquare className="h-4 w-4 mr-2" />
                  )}
                  Send SMS
                </Button>
              </div>
              {field(contactPassenger, 'ticketId') && (
                <p className="text-xs text-muted-foreground">
                  SMS will include the e-ticket link when a ticket is linked to this booking.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AddPassengersDialog
        open={showAddDialog}
        onOpenChange={(open) => {
          if (open) setShowAddDialog(true);
          else closeAddPassengerDialog();
        }}
        tripId={newPassenger.tripId}
        onTripIdChange={(id) => setNewPassenger((prev) => ({ ...prev, tripId: id }))}
        tripSearch={addTripSearch}
        onTripSearchChange={setAddTripSearch}
        tripOptions={addDialogTrips}
        selectedTrip={addSelectedTrip}
        selectedTripFare={addSelectedTripFare}
        isBranchManager={isBranchManager}
        onRefreshTrips={() => void refreshTrips()}
        tripsRefreshing={tripsLoading}
        bookingMethod={addBookingMethod}
        onBookingMethodChange={setAddBookingMethod}
        formValues={newPassenger}
        onFormChange={patchNewPassengerForm}
        maxSeats={addMaxSeats}
        fareReadOnly={Boolean(addSelectedTripFare)}
        phoneLookup={addPhoneLookup}
        profileFound={addProfileFound}
        duplicateOnTrip={addDuplicateOnTrip}
        queue={addBookingQueue}
        bulkSubmitting={addBulkSubmitting}
        sessionCompleting={addSessionCompleting}
        onCancel={() => closeAddPassengerDialog()}
        onDone={() => void handleAddBookingSessionDone()}
        onBookAndPrint={() => void handleBookAndPrintPassenger()}
      />
      </div>
    </div>
  );
}