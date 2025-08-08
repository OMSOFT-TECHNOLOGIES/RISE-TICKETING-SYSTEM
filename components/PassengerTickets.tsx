import React, { useState } from 'react';
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
  AlertTriangle
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { toast } from 'sonner';

// Mock data for passenger tickets with ratings and complaints
const mockTickets = [
  {
    id: 'TKT001',
    tripId: 'TRP001',
    passengerName: 'John Doe',
    passengerPhone: '+233 24 111 1111',
    passengerEmail: 'john.doe@email.com',
    routeFrom: 'Accra Central',
    routeTo: 'Kumasi Main',
    departureTime: '2024-01-20T08:00:00',
    arrivalTime: '2024-01-20T12:30:00',
    seatNumber: 'A12',
    fare: 45,
    bookingDate: '2024-01-15T10:30:00',
    vehicle: 'GV-123-20',
    driver: 'Kwame Asante',
    status: 'used',
    qrCode: 'QR-TKT001-2024',
    stationId: 'STA001',
    stationName: 'Accra Central Station',
    notes: 'Window seat requested',
    rating: 4,
    ratingDate: '2024-01-20T13:00:00',
    complaint: null
  },
  {
    id: 'TKT002',
    tripId: 'TRP001',
    passengerName: 'Jane Smith',
    passengerPhone: '+233 26 222 2222',
    passengerEmail: 'jane.smith@email.com',
    routeFrom: 'Accra Central',
    routeTo: 'Kumasi Main',
    departureTime: '2024-01-20T08:00:00',
    arrivalTime: '2024-01-20T12:30:00',
    seatNumber: 'B05',
    fare: 45,
    bookingDate: '2024-01-16T14:20:00',
    vehicle: 'GV-123-20',
    driver: 'Kwame Asante',
    status: 'confirmed',
    qrCode: 'QR-TKT002-2024',
    stationId: 'STA001',
    stationName: 'Accra Central Station',
    notes: '',
    rating: null,
    ratingDate: null,
    complaint: null
  },
  {
    id: 'TKT003',
    tripId: 'TRP002',
    passengerName: 'Kwaku Mensah',
    passengerPhone: '+233 27 333 3333',
    passengerEmail: 'kwaku.mensah@email.com',
    routeFrom: 'Accra Central',
    routeTo: 'Cape Coast',
    departureTime: '2024-01-18T10:30:00',
    arrivalTime: '2024-01-18T13:00:00',
    seatNumber: 'C08',
    fare: 35,
    bookingDate: '2024-01-10T09:15:00',
    vehicle: 'GV-456-21',
    driver: 'Ama Osei',
    status: 'used',
    qrCode: 'QR-TKT003-2024',
    stationId: 'STA001',
    stationName: 'Accra Central Station',
    notes: 'Luggage: 2 bags',
    rating: 2,
    ratingDate: '2024-01-18T13:30:00',
    complaint: {
      id: 'CMP001',
      category: 'vehicle_condition',
      description: 'Air conditioning was not working during the trip. Very uncomfortable journey.',
      submittedDate: '2024-01-18T13:30:00',
      status: 'pending',
      priority: 'medium'
    }
  },
  {
    id: 'TKT004',
    tripId: 'TRP004',
    passengerName: 'Akosua Darko',
    passengerPhone: '+233 28 444 4444',
    passengerEmail: 'akosua.darko@email.com',
    routeFrom: 'Kumasi Main',
    routeTo: 'Accra Central',
    departureTime: '2024-01-25T15:00:00',
    arrivalTime: '2024-01-25T19:30:00',
    seatNumber: 'A01',
    fare: 45,
    bookingDate: '2024-01-19T16:45:00',
    vehicle: 'KU-789-19',
    driver: 'Kofi Mensah',
    status: 'cancelled',
    qrCode: 'QR-TKT004-2024',
    stationId: 'STA002',
    stationName: 'Kumasi Main Station',
    notes: 'Cancelled due to vehicle maintenance',
    rating: null,
    ratingDate: null,
    complaint: {
      id: 'CMP002',
      category: 'trip_cancellation',
      description: 'Trip was cancelled last minute without proper notice. I had to make alternative arrangements.',
      submittedDate: '2024-01-25T12:00:00',
      status: 'resolved',
      priority: 'high',
      response: 'We apologize for the inconvenience. A full refund has been processed and you have been contacted by our customer service team.'
    }
  }
];

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
  const [tickets, setTickets] = useState(mockTickets);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [complaintForm, setComplaintForm] = useState({
    category: '',
    description: '',
    priority: 'medium'
  });

  const isAdmin = user?.role === 'admin';
  
  // Filter tickets based on user role
  const userTickets = isAdmin 
    ? tickets 
    : tickets.filter(t => t.stationId === user?.stationId);

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

  const handlePrintTicket = (ticket: any) => {
    console.log('Printing ticket:', ticket.id);
    toast.success('Ticket download started');
  };

  const handleRating = (ticketId: string, ratingValue: number) => {
    setTickets(tickets.map(ticket => 
      ticket.id === ticketId 
        ? { ...ticket, rating: ratingValue, ratingDate: new Date().toISOString() }
        : ticket
    ));
    toast.success(`Thank you for rating your trip ${ratingValue} star${ratingValue !== 1 ? 's' : ''}!`);
  };

  const handleComplaintSubmit = (ticketId: string) => {
    if (!complaintForm.category || !complaintForm.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newComplaint = {
      id: `CMP${Date.now()}`,
      category: complaintForm.category,
      description: complaintForm.description,
      submittedDate: new Date().toISOString(),
      status: 'pending',
      priority: complaintForm.priority,
      response: null
    };

    setTickets(tickets.map(ticket => 
      ticket.id === ticketId 
        ? { ...ticket, complaint: newComplaint }
        : ticket
    ));

    setComplaintForm({ category: '', description: '', priority: 'medium' });
    toast.success('Your complaint has been submitted successfully');
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
            <MapPin className="h-4 w-4 text-blue-600" />
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Passenger Tickets</h1>
          <p className="text-gray-600">
            {isAdmin 
              ? 'View and manage all passenger tickets across RISE stations' 
              : `Manage passenger tickets for ${user?.stationName}`
            }
          </p>
        </div>
      </div>

      {/* Ticket Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Ticket className="h-8 w-8 mx-auto mb-2 text-blue-600" />
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
                  </div>
                </div>
                
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
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                              <span className="text-sm font-medium text-blue-700">Admin Response:</span>
                              <p className="text-sm text-blue-600 mt-1">{selectedTicket.complaint.response}</p>
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