import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
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
  User,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  AlertCircle,
  XCircle,
  Star,
  MessageSquare,
  Send,
  ThumbsUp,
  AlertTriangle,
  Smartphone,
  Loader2
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { notify } from './utils/notify';
import {
  printETicket,
  resendETicketSms,
  TICKET_ISSUED_EVENT,
  type ETicket,
} from './utils/eTicket';
import { ticketApi } from './utils/api';
import { useEntityList } from './shared/hooks/useEntityList';
import { Alert, AlertDescription } from './ui/alert';

const ticketStatuses = [
  { value: 'confirmed', label: 'Confirmed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
  { value: 'used', label: 'Used', color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle }
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
  const stationId = user?.stationId;

  const fetchTickets = useCallback(
    () => ticketApi.getAll(isAdmin ? undefined : { stationId }),
    [isAdmin, stationId]
  );

  const {
    items: tickets,
    loading,
    refresh,
    setItems: setTickets,
  } = useEntityList<ETicket>({
    fetchFn: fetchTickets,
    entityKey: 'tickets',
    errorMessage: 'Failed to load tickets',
  });

  const [searchTerm, setSearchTerm] = useState('');
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
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [complaintForm, setComplaintForm] = useState({
    category: '',
    description: '',
    priority: 'medium'
  });

  const userTickets = isAdmin ? tickets : tickets.filter((t) => t.stationId === user?.stationId);

  // Apply search and status filters
  const filteredTickets = userTickets.filter(ticket => {
    const matchesSearch = searchTerm === '' || 
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.passengerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.passengerPhone.includes(searchTerm) ||
      ticket.routeFrom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.routeTo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || ticket.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusInfo = ticketStatuses.find(s => s.value === status);
    const IconComponent = statusInfo?.icon || CheckCircle;
    return (
      <Badge className={statusInfo?.color || 'bg-gray-100 text-gray-800'}>
        <IconComponent className="h-3 w-3 mr-1" />
        {statusInfo?.label || status}
      </Badge>
    );
  };

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

  const getSmsBadge = (ticket: ETicket) => {
    if (ticket.smsStatus === 'sent') {
      return (
        <Badge className="bg-green-100 text-green-800">
          <Smartphone className="h-3 w-3 mr-1" />
          SMS Sent
        </Badge>
      );
    }
    if (ticket.smsStatus === 'failed') {
      return (
        <Badge className="bg-red-100 text-red-800">
          <Smartphone className="h-3 w-3 mr-1" />
          SMS Failed
        </Badge>
      );
    }
    return null;
  };

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

  const TicketCard = ({ ticket }: { ticket: any }) => (
    <Card className="hover:shadow-md transition-shadow">
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
            {getStatusBadge(ticket.status)}
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
            <span>{new Date(ticket.departureTime).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>{new Date(ticket.departureTime).toLocaleTimeString()}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-1">
            <Bus className="h-3 w-3" />
            <span>Seat {ticket.seatNumber}</span>
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
        <Loader2 className="h-8 w-8 animate-spin text-[#193cb8] mb-4" />
        <p className="text-muted-foreground">Loading tickets...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Passenger Tickets</h1>
        <p className="text-gray-600">
          {isAdmin
            ? 'View all e-tickets issued across RISE stations'
            : `E-tickets for ${user?.stationName}`}
        </p>
      </div>

      <Alert className="border-[#193cb8]/20 bg-[#193cb8]/5">
        <Smartphone className="h-4 w-4 text-[#193cb8]" />
        <AlertDescription>
          E-tickets are issued automatically when a passenger is booked on a trip. The ticket URL is sent to the passenger&apos;s phone via SMS — no manual issuing required. Book passengers from{' '}
          <strong>Trip Management</strong> or <strong>Passenger Management</strong>.
        </AlertDescription>
      </Alert>

      {/* Ticket Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Ticket className="h-8 w-8 mx-auto mb-2 text-[#193cb8]" />
            <p className="text-2xl font-bold">{userTickets.length}</p>
            <p className="text-sm text-gray-600">Total Tickets</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold">{userTickets.filter(t => t.status === 'confirmed').length}</p>
            <p className="text-sm text-gray-600">Confirmed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Star className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
            <p className="text-2xl font-bold">{userTickets.filter(t => t.rating).length}</p>
            <p className="text-sm text-gray-600">Rated Trips</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-orange-600" />
            <p className="text-2xl font-bold">{userTickets.filter(t => t.complaint).length}</p>
            <p className="text-sm text-gray-600">Complaints</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Search Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search by Ticket ID, Passenger Name, Phone, or Route</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Enter search term..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Filter by Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {ticketStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table for larger screens */}
      <div className="hidden lg:block">
        <Card>
          <CardHeader>
            <CardTitle>Ticket Registry ({filteredTickets.length} tickets)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket ID</TableHead>
                  <TableHead>Passenger</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Departure</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{ticket.id}</p>
                        <p className="text-sm text-gray-500">{ticket.qrCode}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{ticket.passengerName}</p>
                        <p className="text-sm text-gray-500">{ticket.passengerPhone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{ticket.routeFrom} → {ticket.routeTo}</p>
                        <p className="text-sm text-gray-500">{ticket.vehicle}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{new Date(ticket.departureTime).toLocaleDateString()}</p>
                        <p className="text-sm text-gray-500">{new Date(ticket.departureTime).toLocaleTimeString()}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(ticket.status)}
                        {ticket.complaint && (
                          <Badge variant="outline" className="text-orange-600">
                            <MessageSquare className="h-3 w-3 mr-1" />
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {ticket.rating ? (
                        renderStarRating(ticket.rating, () => {}, false)
                      ) : (
                        <span className="text-sm text-muted-foreground">Not rated</span>
                      )}
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Ticket Cards for mobile */}
      <div className="lg:hidden">
        <div className="mb-4">
          <p className="text-sm text-gray-600">{filteredTickets.length} tickets found</p>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {filteredTickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      </div>

      {/* Enhanced Ticket Details Dialog */}
      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ticket Details</DialogTitle>
            <DialogDescription>
              Complete ticket information, rating, and feedback
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <Tabs defaultValue="details" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="rating">Rating</TabsTrigger>
                <TabsTrigger value="complaint">Complaint</TabsTrigger>
              </TabsList>

              {/* Ticket Details Tab */}
              <TabsContent value="details" className="space-y-4">
                {/* QR Code placeholder */}
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <QrCode className="h-16 w-16 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm font-mono">{selectedTicket.qrCode}</p>
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
                      <span className="text-gray-600">Seat:</span>
                      <p>{selectedTicket.seatNumber}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-600">Departure:</span>
                      <p>{new Date(selectedTicket.departureTime).toLocaleString()}</p>
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
                      <div className="mt-1">{getStatusBadge(selectedTicket.status)}</div>
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
                          {getSmsBadge(selectedTicket)}
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
            </Tabs>
          )}
          
          <Separator />
          
          <div className="flex space-x-2">
            <Button 
              onClick={() => selectedTicket && handlePrintTicket(selectedTicket)}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowTicketDialog(false)}
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}