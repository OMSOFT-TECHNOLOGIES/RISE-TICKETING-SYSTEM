import React, { useState } from 'react';
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
  User
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu';

// Mock data for trips and passengers
const mockTrips = [
  {
    id: 'TR001',
    route: 'Accra to Kumasi',
    date: '2024-08-07',
    time: '08:00',
    driver: 'Kwame Asante',
    vehicle: 'GV-123-20',
    status: 'completed',
    passengerCount: 45,
    capacity: 50
  },
  {
    id: 'TR002',
    route: 'Kumasi to Tamale',
    date: '2024-08-07',
    time: '14:30',
    driver: 'Ama Serwaa',
    vehicle: 'GV-456-20',
    status: 'in-progress',
    passengerCount: 38,
    capacity: 45
  },
  {
    id: 'TR003',
    route: 'Takoradi to Accra',
    date: '2024-08-07',
    time: '10:15',
    driver: 'Kofi Mensah',
    vehicle: 'GV-789-20',
    status: 'scheduled',
    passengerCount: 42,
    capacity: 50
  },
  {
    id: 'TR004',
    route: 'Cape Coast to Accra',
    date: '2024-08-06',
    time: '16:00',
    driver: 'Akosua Frimpong',
    vehicle: 'GV-321-20',
    status: 'completed',
    passengerCount: 35,
    capacity: 40
  }
];

const mockPassengers = [
  {
    id: 'P001',
    tripId: 'TR001',
    name: 'Joseph Akwetey',
    phone: '+233 24 123 4567',
    email: 'joseph.akwetey@email.com',
    seatNumber: 'A12',
    ticketId: 'TK001234',
    boardingPoint: 'Circle',
    dropoffPoint: 'Kejetia',
    fare: 45.00,
    status: 'checked-in',
    bookingDate: '2024-08-05',
    age: 28,
    gender: 'Male'
  },
  {
    id: 'P002',
    tripId: 'TR001',
    name: 'Mary Osei',
    phone: '+233 26 987 6543',
    email: 'mary.osei@email.com',
    seatNumber: 'B05',
    ticketId: 'TK001235',
    boardingPoint: 'Mallam',
    dropoffPoint: 'Adum',
    fare: 45.00,
    status: 'boarded',
    bookingDate: '2024-08-04',
    age: 34,
    gender: 'Female'
  },
  {
    id: 'P003',
    tripId: 'TR001',
    name: 'Emmanuel Adjei',
    phone: '+233 20 555 1234',
    email: 'emmanuel.adjei@email.com',
    seatNumber: 'C08',
    ticketId: 'TK001236',
    boardingPoint: 'Achimota',
    dropoffPoint: 'Tech Junction',
    fare: 45.00,
    status: 'no-show',
    bookingDate: '2024-08-06',
    age: 31,
    gender: 'Male'
  },
  {
    id: 'P004',
    tripId: 'TR002',
    name: 'Grace Amponsah',
    phone: '+233 24 777 8888',
    email: 'grace.amponsah@email.com',
    seatNumber: 'A03',
    ticketId: 'TK001237',
    boardingPoint: 'Kejetia',
    dropoffPoint: 'Central Market',
    fare: 65.00,
    status: 'boarded',
    bookingDate: '2024-08-06',
    age: 29,
    gender: 'Female'
  }
];

export function PassengerManagement() {
  const [selectedTrip, setSelectedTrip] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');

  const filteredTrips = mockTrips.filter(trip => {
    const matchesDate = dateFilter === 'all' || 
      (dateFilter === 'today' && trip.date === '2024-08-07') ||
      (dateFilter === 'yesterday' && trip.date === '2024-08-06');
    
    const matchesSearch = trip.route.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.driver.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.vehicle.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesDate && matchesSearch;
  });

  const selectedTripData = mockTrips.find(trip => trip.id === selectedTrip);
  const tripPassengers = mockPassengers.filter(passenger => passenger.tripId === selectedTrip);

  const filteredPassengers = tripPassengers.filter(passenger => {
    const matchesStatus = statusFilter === 'all' || passenger.status === statusFilter;
    const matchesSearch = passenger.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      passenger.phone.includes(searchQuery) ||
      passenger.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      passenger.seatNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Completed</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">In Progress</Badge>;
      case 'scheduled':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Scheduled</Badge>;
      case 'boarded':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Boarded</Badge>;
      case 'checked-in':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Checked In</Badge>;
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

  const exportPassengerList = () => {
    const data = filteredPassengers.map(passenger => ({
      Name: passenger.name,
      'Seat Number': passenger.seatNumber,
      'Ticket ID': passenger.ticketId,
      Phone: passenger.phone,
      Email: passenger.email,
      'Boarding Point': passenger.boardingPoint,
      'Drop-off Point': passenger.dropoffPoint,
      Fare: `₵${passenger.fare}`,
      Status: passenger.status,
      'Booking Date': passenger.bookingDate
    }));
    
    console.log('Exporting passenger data:', data);
    // In a real app, this would trigger a CSV/Excel download
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Passenger Management</h1>
        <p className="text-muted-foreground">
          View and manage passengers for scheduled and completed trips
        </p>
      </div>

      <Tabs defaultValue="trips" className="space-y-6">
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
                      <Button onClick={exportPassengerList} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
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
                          <TableRow key={passenger.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs">
                                    {getUserInitials(passenger.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{passenger.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {passenger.ticketId}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{passenger.seatNumber}</TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 text-sm">
                                  <Phone className="h-3 w-3" />
                                  {passenger.phone}
                                </div>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Mail className="h-3 w-3" />
                                  {passenger.email}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{passenger.boardingPoint}</div>
                                <div className="text-muted-foreground">→ {passenger.dropoffPoint}</div>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">₵{passenger.fare}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(passenger.status)}
                                {getStatusBadge(passenger.status)}
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
                                  <DropdownMenuItem>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
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
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}