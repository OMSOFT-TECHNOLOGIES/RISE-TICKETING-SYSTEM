import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useAuth } from './AuthContext';
import {
  Ticket,
  Search,
  Download,
  QrCode,
  MapPin,
  Clock,
  Bus,
  Calendar,
  CheckCircle,
  Star,
  MessageSquare,
  Send,
  ThumbsUp,
  Smartphone,
  RefreshCw,
  SlidersHorizontal,
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
} from './ui/dialog';
import { cn } from './ui/utils';
import { PageHeader } from './shared/PageHeader';
import { DashboardStatCard } from './Dashboard/DashboardStatCard';
import { RisePreloader, RiseStatusAlert } from './shared/feedback';
import { ScrollableTable } from './shared/ScrollableTable';
import { SmsStatusBadge, TicketStatusBadge } from './PassengerTickets/ticketStatus';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { notify } from './utils/notify';
import {
  printETicket,
  resendETicketSms,
  TICKET_ISSUED_EVENT,
  type ETicket,
} from './utils/eTicket';
import { ticketApi } from './utils/api';
import { useDataEntryStation } from './shared/hooks/useDataEntryStation';
import { DataEntryStationBanner } from './shared/DataEntryStationBanner';
import {
  deferListUntilStationPicked,
  emptyPaginatedListPayload,
  mustSelectStationForDataEntry,
} from './utils/stationScope';
import { usePaginatedEntityList } from './shared/hooks/usePaginatedEntityList';
import { TablePagination } from './shared/TablePagination';
import { formatTicketDateTime, formatTripDepartureDisplay } from './utils/tripDateTime';

const TICKET_DIALOG_TAB_CLASS = 'justify-center gap-1.5 px-3 text-sm font-medium';

const ticketStatuses = [
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'pending', label: 'Pending' },
  { value: 'used', label: 'Used' },
  { value: 'cancelled', label: 'Cancelled' },
];

const complaintCategories = [
  { value: 'vehicle_condition', label: 'Vehicle Condition' },
  { value: 'driver_behavior', label: 'Driver Behavior' },
  { value: 'delay', label: 'Delay/Schedule' },
  { value: 'trip_cancellation', label: 'Trip Cancellation' },
  { value: 'customer_service', label: 'Customer Service' },
  { value: 'pricing', label: 'Pricing/Billing' },
  { value: 'safety', label: 'Safety Concerns' },
  { value: 'other', label: 'Other' }
];

export function PassengerTickets() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const dataEntry = useDataEntryStation();
  const usesStationPicker = mustSelectStationForDataEntry(user?.role);
  const listStationId = usesStationPicker
    ? dataEntry.effectiveStationId
    : isAdmin
      ? undefined
      : user?.stationId;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const fetchTickets = useCallback(
    (page: number, limit: number) => {
      if (deferListUntilStationPicked(user, dataEntry.stationId)) {
        return Promise.resolve({
          success: true,
          data: emptyPaginatedListPayload('tickets', limit),
        });
      }
      return ticketApi.getAll({
        ...(listStationId ? { stationId: listStationId } : {}),
        page,
        limit,
        search: searchTerm.trim() || undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
      });
    },
    [user, dataEntry.stationId, listStationId, searchTerm, selectedStatus]
  );

  const {
    items: tickets,
    loading,
    error,
    refresh,
    setItems: setTickets,
    page,
    setPage,
    pagination,
    pageSize,
    setPageSize,
  } = usePaginatedEntityList<ETicket>({
    fetchFn: fetchTickets,
    entityKey: 'tickets',
    errorMessage: 'Failed to load tickets',
    resetPageDeps: [searchTerm, selectedStatus, listStationId],
  });
  const [selectedTicket, setSelectedTicket] = useState<ETicket | null>(null);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [resendingSms, setResendingSms] = useState(false);

  useEffect(() => {
    const onTicketIssued = (event: Event) => {
      const ticket = (event as CustomEvent<ETicket>).detail;
      setTickets((prev) => [ticket, ...prev.filter((t) => t.id !== ticket.id)]);
      refresh();
    };
    window.addEventListener(TICKET_ISSUED_EVENT, onTicketIssued);
    return () => window.removeEventListener(TICKET_ISSUED_EVENT, onTicketIssued);
  }, [refresh, setTickets]);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [complaintForm, setComplaintForm] = useState({
    category: '',
    description: '',
    priority: 'medium'
  });

  const userTickets = useMemo(() => {
    if (isAdmin) return tickets;
    if (usesStationPicker) {
      if (!dataEntry.effectiveStationId) return [];
      return tickets;
    }
    if (user?.stationId) {
      return tickets.filter((t) => t.stationId === user.stationId);
    }
    return tickets;
  }, [tickets, isAdmin, usesStationPicker, dataEntry.effectiveStationId, user?.stationId]);

  const handleResendSms = useCallback(async (ticket: ETicket) => {
    setResendingSms(true);
    try {
      const updated = await resendETicketSms(ticket);
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setSelectedTicket(updated);
    } finally {
      setResendingSms(false);
    }
  }, []);

  const handlePrintTicket = (ticket: ETicket) => {
    printETicket(ticket);
  };

  const handleRating = async (ticketId: string, ratingValue: number) => {
    const response = await ticketApi.submitRating(ticketId, ratingValue);
    if (response.success) {
      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === ticketId
            ? { ...ticket, rating: ratingValue, ratingDate: new Date().toISOString() }
            : ticket
        )
      );
      notify.success(`Thank you for rating your trip ${ratingValue} star${ratingValue !== 1 ? 's' : ''}!`);
    } else {
      notify.error(response.error ?? 'Failed to submit rating');
    }
  };

  const handleComplaintSubmit = async (ticketId: string) => {
    if (!complaintForm.category || !complaintForm.description.trim()) {
      notify.error('Please fill in all required fields');
      return;
    }

    const response = await ticketApi.submitComplaint(ticketId, {
      category: complaintForm.category,
      description: complaintForm.description,
      priority: complaintForm.priority,
    });

    if (response.success) {
      const newComplaint = {
        id: `CMP${Date.now()}`,
        category: complaintForm.category,
        description: complaintForm.description,
        submittedDate: new Date().toISOString(),
        status: 'pending',
        priority: complaintForm.priority,
        response: null,
      };

      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === ticketId ? { ...ticket, complaint: newComplaint } : ticket
        )
      );

      setComplaintForm({ category: '', description: '', priority: 'medium' });
      notify.success('Your complaint has been submitted successfully');
    } else {
      notify.error(response.error ?? 'Failed to submit complaint');
    }
  };

  const renderStarRating = (currentRating: number, onRate: (rating: number) => void, interactive: boolean = true) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onRate(star)}
            onMouseEnter={() => interactive && setHoveredRating(star)}
            onMouseLeave={() => interactive && setHoveredRating(0)}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          >
            <Star
              className={`h-5 w-5 ${
                star <= (hoveredRating || currentRating)
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
        {currentRating > 0 && (
          <span className="ml-2 text-sm text-muted-foreground">
            {currentRating} star{currentRating !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    );
  };

  const canRateOrComplain = (ticket: any) => {
    return ticket.status === 'used' || ticket.status === 'cancelled';
  };

  const totalListed = pagination?.totalItems ?? userTickets.length;
  const confirmedCount = userTickets.filter((t) => t.status === 'confirmed').length;
  const ratedCount = userTickets.filter((t) => t.rating).length;
  const complaintCount = userTickets.filter((t) => t.complaint).length;
  const hasActiveFilters = selectedStatus !== 'all' || Boolean(searchTerm.trim());
  const awaitingStationPick = usesStationPicker && !dataEntry.effectiveStationId;

  const TicketCard = ({ ticket }: { ticket: ETicket }) => (
    <Card className="rounded-xl ring-1 ring-border/50 border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Ticket className="h-5 w-5" />
              <span>{ticket.id}</span>
            </CardTitle>
            <p className="text-sm text-gray-600">{ticket.passengerName}</p>
          </div>
          <div className="flex items-center space-x-2">
            <TicketStatusBadge status={ticket.status} />
            {ticket.complaint && (
              <Badge variant="outline" className="text-orange-600">
                <MessageSquare className="h-3 w-3 mr-1" />
                Complaint
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-[#193cb8]" />
            <span className="text-sm">{ticket.routeFrom} → {ticket.routeTo}</span>
          </div>
          <span className="text-sm font-medium">₵{ticket.fare}</span>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>{formatTicketDateTime(ticket.departureTime).date}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>{formatTicketDateTime(ticket.departureTime).time}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-1">
            <Bus className="h-3 w-3" />
            <span>
              {(ticket.seats ?? 1) > 1
                ? `${ticket.seats} seats · ${ticket.seatNumber}`
                : `Seat ${ticket.seatNumber}`}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <span>Vehicle: {ticket.vehicle}</span>
          </div>
        </div>

        {ticket.rating && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Your Rating:</span>
            {renderStarRating(ticket.rating, () => {}, false)}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-xs text-gray-500">
            Booked: {new Date(ticket.bookingDate).toLocaleDateString()}
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSelectedTicket(ticket);
                setRating(ticket.rating || 0);
                setShowTicketDialog(true);
              }}
            >
              <QrCode className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handlePrintTicket(ticket)}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading && userTickets.length === 0 && !error) {
    return (
      <div className="p-6 min-h-[420px] rise-dashboard-page">
        <RisePreloader variant="page" label="Loading tickets…" />
      </div>
    );
  }

  const headerDescription = isAdmin
    ? 'View e-tickets issued across RISE stations.'
    : usesStationPicker
      ? dataEntry.selectedStation
        ? `E-tickets for ${dataEntry.selectedStation.name}.`
        : 'Select a station to view e-tickets for that terminal.'
      : `E-tickets for ${user?.stationName ?? 'your station'}.`;

  return (
    <div className="min-h-full rise-dashboard-page">
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {dataEntry.needsPicker ? (
          <DataEntryStationBanner
            stationId={dataEntry.stationId}
            onStationIdChange={dataEntry.setStationId}
            stations={dataEntry.stations}
            loading={dataEntry.loading}
            loadError={dataEntry.loadError}
            onRetry={() => void dataEntry.reloadStations()}
            description={dataEntry.pickerDescription}
          />
        ) : null}

        <PageHeader
          title="Passenger tickets"
          description={headerDescription}
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refresh({ toastOnError: true })}
              disabled={loading}
            >
              <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
              Refresh
            </Button>
          }
        />

        {error ? (
          <RiseStatusAlert type="error" title="Could not load tickets">
            {error}
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => void refresh({ toastOnError: true })}
            >
              Try again
            </Button>
          </RiseStatusAlert>
        ) : null}

        <RiseStatusAlert type="info" title="Automatic e-tickets">
          E-tickets are issued when a passenger is booked. The ticket link is sent by SMS — book from{' '}
          <strong>Trip registration</strong> or <strong>Passenger management</strong>.
        </RiseStatusAlert>

        <section className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-4 sm:p-5 ring-1 ring-border/40">
          <h2 className="text-sm font-semibold tracking-tight mb-4">Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            <DashboardStatCard
              title="Tickets (this page)"
              value={totalListed}
              icon={Ticket}
              accent="blue"
              hint={`${userTickets.length} shown here`}
            />
            <DashboardStatCard
              title="Confirmed"
              value={confirmedCount}
              icon={CheckCircle}
              accent="emerald"
              hint="Active bookings"
            />
            <DashboardStatCard
              title="Rated trips"
              value={ratedCount}
              icon={Star}
              accent="amber"
              hint="Passenger feedback"
            />
            <DashboardStatCard
              title="Complaints"
              value={complaintCount}
              icon={MessageSquare}
              accent="violet"
              hint="Open or resolved"
            />
          </div>
        </section>

        <Card className="rounded-2xl shadow-sm ring-1 ring-border/50 overflow-hidden border-0">
          <CardHeader className="space-y-4 border-b border-border/60 bg-muted/20 pb-4">
            <div>
              <CardTitle className="text-lg font-semibold">Ticket registry</CardTitle>
              <CardDescription className="mt-1">
                {totalListed} ticket{totalListed === 1 ? '' : 's'} · search and filter
              </CardDescription>
            </div>
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Ticket ID, passenger, phone, route…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10 bg-background/80"
                />
              </div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-[180px] h-10 bg-background/80">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  {ticketStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasActiveFilters ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 text-muted-foreground"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedStatus('all');
                  }}
                >
                  Clear
                </Button>
              ) : null}
            </div>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
              Open a ticket to view QR details, resend SMS, rate the trip, or file a complaint.
            </p>
          </CardHeader>
          <CardContent className="pt-6 px-4 sm:px-6 pb-6">
            <div className={loading ? 'opacity-60 pointer-events-none transition-opacity' : ''}>
              {awaitingStationPick ? (
                <div className="py-16 text-center text-sm text-muted-foreground">
                  Pick a station to view e-tickets for that terminal.
                </div>
              ) : userTickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <Ticket className="h-10 w-10 text-muted-foreground/50 mb-3" />
                  <p className="text-sm font-medium">No tickets match your criteria</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    {hasActiveFilters
                      ? 'Adjust filters or clear search.'
                      : 'Tickets appear when passengers are booked on trips.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="hidden lg:block">
                    <ScrollableTable
                      className="border-0 shadow-none ring-0"
                      maxHeightClass="max-h-[min(70vh,560px)]"
                      minWidthClass="min-w-[1000px]"
                    >
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead>Ticket ID</TableHead>
                            <TableHead>Passenger</TableHead>
                            <TableHead>Route</TableHead>
                            <TableHead>Departure</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Rating</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userTickets.map((ticket) => (
                            <TableRow key={ticket.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{ticket.id}</p>
                                  <p className="text-xs text-muted-foreground font-mono truncate max-w-[140px]">
                                    {ticket.qrCode}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{ticket.passengerName}</p>
                                  <p className="text-sm text-muted-foreground">{ticket.passengerPhone}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="text-sm">
                                    {ticket.routeFrom} → {ticket.routeTo}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{ticket.vehicle}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="text-sm">{formatTicketDateTime(ticket.departureTime).date}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatTicketDateTime(ticket.departureTime).time}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <TicketStatusBadge status={ticket.status} />
                                  {ticket.complaint ? (
                                    <Badge variant="outline" className="text-orange-700 border-orange-300/80">
                                      <MessageSquare className="h-3 w-3 mr-1" aria-hidden />
                                      <span className="sr-only">Has complaint</span>
                                    </Badge>
                                  ) : null}
                                </div>
                              </TableCell>
                              <TableCell>
                                {ticket.rating ? (
                                  renderStarRating(ticket.rating, () => {}, false)
                                ) : (
                                  <span className="text-sm text-muted-foreground">Not rated</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    aria-label="View ticket"
                                    onClick={() => {
                                      setSelectedTicket(ticket);
                                      setRating(ticket.rating || 0);
                                      setShowTicketDialog(true);
                                    }}
                                  >
                                    <QrCode className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    aria-label="Download ticket"
                                    onClick={() => handlePrintTicket(ticket)}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollableTable>
                  </div>
                  <div className="lg:hidden grid grid-cols-1 gap-3">
                    {userTickets.map((ticket) => (
                      <TicketCard key={ticket.id} ticket={ticket} />
                    ))}
                  </div>
                </>
              )}
            </div>
            {!awaitingStationPick ? (
              <TablePagination
                page={page}
                pagination={pagination}
                onPageChange={setPage}
                loading={loading}
                itemLabel="tickets"
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
                alwaysShow
              />
            ) : null}
          </CardContent>
        </Card>

      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden rounded-2xl max-h-[min(90dvh,calc(100%-2rem))] flex flex-col">
          <DialogHeader className="border-b border-border/80 bg-gradient-to-br from-muted/50 to-background px-6 py-5 shrink-0">
            <DialogTitle className="text-xl font-semibold tracking-tight">
              Ticket details
              {selectedTicket ? (
                <span className="block text-sm font-normal text-muted-foreground mt-1 font-mono">
                  {selectedTicket.id}
                </span>
              ) : null}
            </DialogTitle>
            <DialogDescription>QR code, trip info, ratings, and complaints</DialogDescription>
          </DialogHeader>
          {selectedTicket ? (
            <Tabs defaultValue="details" className="flex flex-col flex-1 min-h-0">
              <div className="px-6 pt-4 shrink-0">
                <div className="rise-segment-tabs w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="details" className={TICKET_DIALOG_TAB_CLASS}>
                      Details
                    </TabsTrigger>
                    <TabsTrigger value="rating" className={TICKET_DIALOG_TAB_CLASS}>
                      Rating
                    </TabsTrigger>
                    <TabsTrigger value="complaint" className={TICKET_DIALOG_TAB_CLASS}>
                      Complaint
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>

              <DialogBody className="px-6 py-4 flex-1 overflow-y-auto max-h-[min(58vh,520px)]">
              <TabsContent value="details" className="mt-0 space-y-4">
                <div className="text-center p-6 rounded-xl border border-border/60 bg-muted/30">
                  <QrCode className="h-16 w-16 mx-auto mb-2 text-muted-foreground/70" />
                  <p className="text-sm font-mono break-all">{selectedTicket.qrCode}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-600">Ticket ID:</span>
                      <p className="font-medium">{selectedTicket.id}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Passenger:</span>
                      <p className="font-medium">{selectedTicket.passengerName}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Phone:</span>
                      <p>{selectedTicket.passengerPhone}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Route:</span>
                      <p>{selectedTicket.routeFrom} → {selectedTicket.routeTo}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Seats booked:</span>
                      <p>{selectedTicket.seats ?? 1}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Seat assignment:</span>
                      <p>{selectedTicket.seatNumber}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-600">Departure:</span>
                      <p>{formatTripDepartureDisplay({ departureTime: selectedTicket.departureTime })}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Vehicle:</span>
                      <p>{selectedTicket.vehicle}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Driver:</span>
                      <p>{selectedTicket.driver}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Fare:</span>
                      <p className="font-medium">₵{selectedTicket.fare}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <div className="mt-1">
                        <TicketStatusBadge status={selectedTicket.status} />
                      </div>
                    </div>
                    {selectedTicket.eTicketUrl && (
                      <div>
                        <span className="text-gray-600">E-Ticket URL:</span>
                        <a
                          href={selectedTicket.eTicketUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#193cb8] text-xs break-all hover:underline block mt-1"
                        >
                          {selectedTicket.eTicketUrl}
                        </a>
                      </div>
                    )}
                    {selectedTicket.smsStatus && (
                      <div>
                        <span className="text-gray-600">SMS Delivery:</span>
                        <div className="mt-1 flex items-center gap-2">
                          <SmsStatusBadge status={selectedTicket.smsStatus} />
                          {selectedTicket.smsSentAt && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(selectedTicket.smsSentAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {selectedTicket.eTicketUrl && (
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={resendingSms}
                    onClick={() => handleResendSms(selectedTicket)}
                  >
                    <Smartphone className="h-4 w-4 mr-2" />
                    {resendingSms ? 'Sending…' : 'Resend E-Ticket SMS'}
                  </Button>
                )}

                {selectedTicket.notes && (
                  <div>
                    <span className="text-gray-600">Notes:</span>
                    <p className="mt-1 text-sm">{selectedTicket.notes}</p>
                  </div>
                )}
              </TabsContent>

              {/* Rating Tab */}
              <TabsContent value="rating" className="space-y-4">
                <div className="text-center space-y-4">
                  <h3 className="text-lg font-medium">Rate Your Trip</h3>
                  <p className="text-sm text-muted-foreground">
                    How was your experience with this trip?
                  </p>
                  
                  {canRateOrComplain(selectedTicket) ? (
                    <div className="space-y-4">
                      {renderStarRating(rating, setRating, !selectedTicket.rating)}
                      
                      {!selectedTicket.rating && (
                        <Button 
                          onClick={() => handleRating(selectedTicket.id, rating)}
                          disabled={rating === 0}
                          className="w-full"
                        >
                          <ThumbsUp className="h-4 w-4 mr-2" />
                          Submit Rating
                        </Button>
                      )}
                      
                      {selectedTicket.rating && (
                        <div className="p-4 bg-green-50 rounded-lg">
                          <div className="flex items-center justify-center space-x-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="text-green-700">Thank you for rating this trip!</span>
                          </div>
                          <p className="text-sm text-green-600 mt-1">
                            Rated on {new Date(selectedTicket.ratingDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-600">
                        You can only rate completed or cancelled trips.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Complaint Tab */}
              <TabsContent value="complaint" className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Submit a Complaint</h3>
                  
                  {selectedTicket.complaint ? (
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">Your Complaint</h4>
                          <Badge 
                            variant={selectedTicket.complaint.status === 'resolved' ? 'default' : 'secondary'}
                            className={selectedTicket.complaint.status === 'resolved' ? 'bg-green-100 text-green-700' : ''}
                          >
                            {selectedTicket.complaint.status.charAt(0).toUpperCase() + selectedTicket.complaint.status.slice(1)}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm text-gray-600">Category:</span>
                            <p className="text-sm">{complaintCategories.find(c => c.value === selectedTicket.complaint.category)?.label}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">Description:</span>
                            <p className="text-sm">{selectedTicket.complaint.description}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">Submitted:</span>
                            <p className="text-sm">{new Date(selectedTicket.complaint.submittedDate).toLocaleString()}</p>
                          </div>
                          {selectedTicket.complaint.response && (
                            <div className="mt-4 p-3 bg-[#193cb8]/10 rounded-lg">
                              <span className="text-sm font-medium text-[#193cb8]">Admin Response:</span>
                              <p className="text-sm text-[#193cb8] mt-1">{selectedTicket.complaint.response}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : canRateOrComplain(selectedTicket) ? (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Please describe any issues you experienced during your trip.
                      </p>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="complaint-category">Category</Label>
                          <Select 
                            value={complaintForm.category} 
                            onValueChange={(value) => setComplaintForm({...complaintForm, category: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select complaint category" />
                            </SelectTrigger>
                            <SelectContent>
                              {complaintCategories.map((category) => (
                                <SelectItem key={category.value} value={category.value}>
                                  {category.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="complaint-description">Description</Label>
                          <Textarea
                            id="complaint-description"
                            placeholder="Please describe the issue in detail..."
                            value={complaintForm.description}
                            onChange={(e) => setComplaintForm({...complaintForm, description: e.target.value})}
                            rows={4}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="complaint-priority">Priority</Label>
                          <Select 
                            value={complaintForm.priority} 
                            onValueChange={(value) => setComplaintForm({...complaintForm, priority: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <Button 
                          onClick={() => handleComplaintSubmit(selectedTicket.id)}
                          className="w-full"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Submit Complaint
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-600">
                        You can only submit complaints for completed or cancelled trips.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
              </DialogBody>
            </Tabs>
          ) : null}

          <DialogFooter className="px-6 py-4 border-t border-border/80 bg-muted/20 sm:justify-stretch gap-2">
            <Button
              type="button"
              onClick={() => selectedTicket && handlePrintTicket(selectedTicket)}
              className="flex-1 sm:flex-none"
              disabled={!selectedTicket}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowTicketDialog(false)}
              className="flex-1 sm:flex-none"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}