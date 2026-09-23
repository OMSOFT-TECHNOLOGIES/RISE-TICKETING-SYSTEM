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
  Shield
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
import { Label } from './ui/label';
import { usePageAction } from './context/PageActionContext';
import { notify } from './utils/notify';
import { useAuth } from './AuthContext';
import { tripApi, passengerApi, ticketApi, parseListResponse, formatApiError } from './utils/api';
import { isGlobalDataScope, listParamsForDataEntry } from './utils/stationScope';
import { useDataEntryStation } from './shared/hooks/useDataEntryStation';
import { DataEntryStationBanner } from './shared/DataEntryStationBanner';
import { buildETicketUrl, issueETicket } from './utils/eTicket';
import { downloadCsv } from './utils/helpers';
import {
  fetchPassengerByPhone,
  normalizePhoneDigits,
} from './utils/passengerLookup';
import {
  createQueueId,
  isPhoneBookedForTrip,
  validatePassengerBookingForm,
  type QueuedPassengerBooking,
} from './shared/bulkPassengerBooking';
import { PassengerBookingQueuePanel } from './shared/PassengerBookingQueuePanel';
import { useEntityList } from './shared/hooks/useEntityList';
import {
  EMPTY_PASSENGER_BOOKING_FORM,
  PassengerBookingFormFields,
  type PassengerBookingFormValues,
} from './shared/PassengerBookingFormFields';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu';

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

function formatTripForDisplay(trip: TripRecord): TripRecord {
  const routeFrom = String(trip.routeFrom ?? '');
  const routeTo = String(trip.routeTo ?? '');
  const routeParts = String(trip.route ?? '').split(/\s*(?:→|to)\s*/i);
  const departure = String(trip.departureTime ?? '');
  return {
    ...trip,
    route: trip.route ?? `${routeFrom || routeParts[0]?.trim() || 'Unknown'} to ${routeTo || routeParts[1]?.trim() || 'Unknown'}`,
    date: departure.split('T')[0] ?? '',
    time: departure.split('T')[1]?.substring(0, 5) ?? '',
    driver: trip.driver ?? trip.driverName ?? '',
    vehicle: trip.vehicle ?? trip.vehicleRegistration ?? '',
    passengerCount: Number(trip.passengerCount ?? trip.booked ?? trip.bookedSeats ?? 0),
    capacity: Number(trip.capacity ?? 0),
    status: trip.status === 'on_road' ? 'in-progress' : trip.status,
  };
}

export function PassengerManagement() {
  const { user } = useAuth();
  const { pendingAction, clearAction } = usePageAction();
  const isGlobalUser = isGlobalDataScope(user?.role);
  const dataEntry = useDataEntryStation();

  const fetchTrips = useCallback(
    () => tripApi.getAll(listParamsForDataEntry(user, dataEntry.effectiveStationId, { limit: 200 })),
    [user, dataEntry.effectiveStationId]
  );

  const { items: rawTrips, loading: tripsLoading, refresh: refreshTrips } = useEntityList<TripRecord>({
    fetchFn: fetchTrips,
    entityKey: 'trips',
    errorMessage: 'Failed to load trips',
  });

  const trips = useMemo(() => rawTrips.map(formatTripForDisplay), [rawTrips]);
  const [passengers, setPassengers] = useState<PassengerRecord[]>([]);
  const [passengersLoading, setPassengersLoading] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');
  const [activeTab, setActiveTab] = useState('trips');
  const [showAddDialog, setShowAddDialog] = useState(false);
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
  const addPhoneLookupSeq = useRef(0);

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
  };
  const [detailPassenger, setDetailPassenger] = useState<PassengerRecord | null>(null);
  const [contactPassenger, setContactPassenger] = useState<PassengerRecord | null>(null);
  const [contactMessage, setContactMessage] = useState('');
  const [contactSending, setContactSending] = useState(false);
  const [exporting, setExporting] = useState(false);

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

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const filteredTrips = trips.filter((trip) => {
    const tripDate = String(trip.date ?? '');
    const matchesDate =
      dateFilter === 'all' ||
      (dateFilter === 'today' && tripDate === today) ||
      (dateFilter === 'yesterday' && tripDate === yesterday);

    const route = String(trip.route ?? '').toLowerCase();
    const driver = String(trip.driver ?? '').toLowerCase();
    const vehicle = String(trip.vehicle ?? '').toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch =
      route.includes(query) || driver.includes(query) || vehicle.includes(query);

    return matchesDate && matchesSearch;
  });

  const selectedTripData = trips.find((trip) => trip.id === selectedTrip);
  const tripPassengers = passengers;

  const filteredPassengers = tripPassengers.filter((passenger) => {
    const matchesStatus =
      statusFilter === 'all' || field(passenger, 'status') === statusFilter;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      field(passenger, 'name').toLowerCase().includes(query) ||
      field(passenger, 'phone').includes(searchQuery) ||
      field(passenger, 'email').toLowerCase().includes(query) ||
      field(passenger, 'seatNumber').toLowerCase().includes(query);

    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Completed</Badge>;
      case 'in-progress':
        return <Badge className="bg-[#193cb8]/10 text-[#193cb8] hover:bg-[#193cb8]/20">In Progress</Badge>;
      case 'scheduled':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Scheduled</Badge>;
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

  const buildBookInputFromEntry = (
    entry: PassengerBookingFormValues,
    trip: TripRecord
  ) => {
    const routeText = String(trip.route ?? '');
    const [routeFrom, routeTo] = routeText.split(/\s+to\s+/i);
    const fare = parseFloat(entry.fare) || Number(trip.fare ?? trip.totalFare ?? 45);
    const departureTime = trip.departureTime
      ? String(trip.departureTime)
      : `${trip.date}T${trip.time}:00`;

    return {
      tripId: String(trip.id),
      passengerName: entry.name,
      passengerPhone: entry.phone,
      passengerEmail: entry.email,
      routeFrom: entry.boardingPoint || routeFrom || '',
      routeTo: entry.dropoffPoint || routeTo || '',
      departureTime,
      seatNumber: entry.seatNumber,
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
    };
  };

  const handleBookAndPrintPassenger = async () => {
    if (!newPassenger.tripId) {
      notify.error('Please select a trip');
      return;
    }
    const validationError = validatePassengerBookingForm(newPassenger);
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

    const sid =
      dataEntry.effectiveStationId ||
      String(trip.stationId ?? '') ||
      dataEntry.requireStationId();
    if (!sid) return;

    setAddBulkSubmitting(true);
    try {
      await issueETicket(buildBookInputFromEntry(newPassenger, trip), {
        printTicket: true,
      });

      setAddBookingQueue((prev) => [
        ...prev,
        { ...newPassenger, queueId: createQueueId() },
      ]);
      clearAddPassengerFormFields();

      setSelectedTrip(newPassenger.tripId);
      setActiveTab('passengers');
      await refreshTrips();
      const manifestRes = await passengerApi.getTripPassengers(newPassenger.tripId);
      if (manifestRes.success && manifestRes.data !== undefined) {
        setAddTripManifest(
          parseListResponse<PassengerRecord>(manifestRes.data, 'passengers')
        );
      }
    } catch {
      // issueETicket shows errors
    } finally {
      setAddBulkSubmitting(false);
    }
  };

  const closeAddPassengerDialog = (force = false) => {
    if (!force && addBulkSubmitting) {
      return;
    }
    setShowAddDialog(false);
    resetAddPassengerForm();
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

  if (tripsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
        <Loader2 className="h-8 w-8 animate-spin text-[#193cb8] mb-4" />
        <p className="text-muted-foreground">Loading trips...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Passenger Management</h1>
          <p className="text-muted-foreground">
            Book passengers on trips — an e-ticket link is sent automatically via SMS
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Passenger
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="trips">Trip Selection</TabsTrigger>
          <TabsTrigger value="passengers" disabled={!selectedTrip}>
            Passenger Details
            {selectedTrip && (
              <Badge variant="secondary" className="ml-2">
                {tripPassengers.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Trip Selection Tab */}
        <TabsContent value="trips" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Select Trip
              </CardTitle>
              <CardDescription>
                Choose a trip to view its passenger details and manage bookings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search trips by route, driver, or vehicle..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="all">All Dates</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Trips Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredTrips.map((trip) => (
                  <Card 
                    key={trip.id} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedTrip === trip.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedTrip(trip.id)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{trip.route}</h3>
                          {getStatusBadge(trip.status)}
                        </div>
                        
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{trip.date} at {trip.time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{trip.passengerCount}/{trip.capacity} passengers</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{trip.driver}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <span className="text-sm font-medium">{trip.vehicle}</span>
                          <Button 
                            size="sm" 
                            variant={selectedTrip === trip.id ? "default" : "outline"}
                          >
                            {selectedTrip === trip.id ? "Selected" : "Select"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredTrips.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No trips found matching your criteria</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Passenger Details Tab */}
        <TabsContent value="passengers" className="space-y-6">
          {selectedTripData && (
            <>
              {/* Trip Summary */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h2 className="text-xl font-semibold">{selectedTripData.route}</h2>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {selectedTripData.date} at {selectedTripData.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {selectedTripData.passengerCount}/{selectedTripData.capacity}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedTripData.status)}
                      <Button
                        onClick={() => void exportPassengerList()}
                        variant="outline"
                        size="sm"
                        disabled={exporting || filteredPassengers.length === 0}
                      >
                        {exporting ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        Export List
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Passenger Filters and Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Passenger List</CardTitle>
                  <CardDescription>
                    Manage and track passengers for this trip
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search passengers..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-[150px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="boarded">Boarded</SelectItem>
                        <SelectItem value="checked-in">Checked In</SelectItem>
                        <SelectItem value="no-show">No Show</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {passengersLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-[#193cb8]" />
                    </div>
                  ) : (
                  <>
                  {/* Passengers Table */}
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
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
                        {filteredPassengers.map((passenger) => (
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
                                {getStatusBadge(field(passenger, 'status'))}
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
                  </div>

                  {filteredPassengers.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No passengers found matching your criteria</p>
                    </div>
                  )}
                  </>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
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
                    {getStatusBadge(field(detailPassenger, 'status'))}
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
                <Button className="flex-1" onClick={() => setDetailPassenger(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
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

      <Dialog
        open={showAddDialog}
        onOpenChange={(open) => {
          if (open) setShowAddDialog(true);
          else closeAddPassengerDialog();
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add passengers</DialogTitle>
            <DialogDescription>
              Each passenger is booked and their ticket prints as you add them.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-trip">Trip *</Label>
              <Select
                value={newPassenger.tripId || undefined}
                onValueChange={(value) =>
                  setNewPassenger((prev) => ({ ...prev, tripId: value }))
                }
              >
                <SelectTrigger id="add-trip">
                  <SelectValue placeholder="Select trip" />
                </SelectTrigger>
                <SelectContent>
                  {trips
                    .filter((trip) => trip.status !== 'completed' && trip.status !== 'arrived')
                    .map((trip) => (
                      <SelectItem key={String(trip.id)} value={String(trip.id)}>
                        {String(trip.route)} — {String(trip.date)} {String(trip.time)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <PassengerBookingFormFields
              idPrefix="add-passenger"
              values={newPassenger}
              onChange={patchNewPassengerForm}
              showSeatNumber
              showRoutePoints
              showFare
              phoneLookup={addPhoneLookup}
              profileFound={addProfileFound}
              duplicateOnTrip={addDuplicateOnTrip}
            />
            <PassengerBookingQueuePanel queue={addBookingQueue} />
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                className="flex-1"
                onClick={() => void handleBookAndPrintPassenger()}
                disabled={addDuplicateOnTrip || !newPassenger.tripId || addBulkSubmitting}
              >
                {addBulkSubmitting ? (
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
                onClick={() => closeAddPassengerDialog()}
                disabled={addBulkSubmitting}
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}