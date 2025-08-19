import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from './AuthContext';
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
  Eye,
  Phone,
  Shield
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Textarea } from './ui/textarea';

// Mock data for trips
const mockTrips = [
  {
    id: 'TRP001',
    routeFrom: 'Accra Central',
    routeTo: 'Kumasi Main',
    departureTime: '2024-01-20T08:00:00',
    arrivalTime: '2024-01-20T12:30:00',
    vehicle: 'GV-123-20',
    driver: 'Kwame Asante',
    capacity: 35,
    booked: 28,
    available: 7,
    fare: 45,
    status: 'scheduled',
    stationId: 'STA001',
    passengers: [
      { 
        name: 'John Doe', 
        phone: '+233 24 111 1111', 
        ticketId: 'TKT001',
        emergencyContact: {
          name: 'Mary Doe',
          phone: '+233 20 123 4567',
          relationship: 'spouse'
        }
      },
      { 
        name: 'Jane Smith', 
        phone: '+233 26 222 2222', 
        ticketId: 'TKT002',
        emergencyContact: {
          name: 'Robert Smith',
          phone: '+233 24 987 6543',
          relationship: 'parent'
        }
      }
    ]
  },
  {
    id: 'TRP002',
    routeFrom: 'Accra Central',
    routeTo: 'Cape Coast',
    departureTime: '2024-01-20T10:30:00',
    arrivalTime: '2024-01-20T13:00:00',
    vehicle: 'GV-456-21',
    driver: 'Ama Osei',
    capacity: 30,
    booked: 30,
    available: 0,
    fare: 35,
    status: 'full',
    stationId: 'STA001',
    passengers: []
  },
  {
    id: 'TRP003',
    routeFrom: 'Kumasi Main',
    routeTo: 'Tamale',
    departureTime: '2024-01-20T14:00:00',
    arrivalTime: '2024-01-20T19:30:00',
    vehicle: 'KU-789-19',
    driver: 'Kofi Mensah',
    capacity: 18,
    booked: 12,
    available: 6,
    fare: 65,
    status: 'scheduled',
    stationId: 'STA002',
    passengers: []
  }
];

const ghanaDestinations = [
  'Accra Central', 'Kumasi Main', 'Cape Coast', 'Tamale', 'Takoradi',
  'Ho', 'Sunyani', 'Koforidua', 'Wa', 'Bolgatanga', 'Tarkwa', 'Tema'
];

const tripStatuses = [
  { value: 'scheduled', label: 'Scheduled', color: 'bg-blue-100 text-blue-800' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-green-100 text-green-800' },
  { value: 'completed', label: 'Completed', color: 'bg-gray-100 text-gray-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  { value: 'full', label: 'Full', color: 'bg-yellow-100 text-yellow-800' }
];

export function TripBooking() {
  const { user } = useAuth();
  const [trips, setTrips] = useState(mockTrips);
  const [showBookDialog, setShowBookDialog] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [showPassengersDialog, setShowPassengersDialog] = useState(false);
  const [newTrip, setNewTrip] = useState({
    routeFrom: '',
    routeTo: '',
    departureDate: '',
    departureTime: '',
    vehicle: '',
    driver: '',
    fare: ''
  });
  const [passengerBooking, setPassengerBooking] = useState({
    tripId: '',
    passengerName: '',
    passengerPhone: '',
    passengerEmail: '',
    seats: 1,
    notes: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: ''
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const userTrips = isAdmin ? trips : trips.filter(t => t.stationId === user?.stationId);

  const handleScheduleTrip = () => {
    const trip = {
      ...newTrip,
      id: `TRP${String(trips.length + 1).padStart(3, '0')}`,
      departureTime: `${newTrip.departureDate}T${newTrip.departureTime}:00`,
      arrivalTime: `${newTrip.departureDate}T${newTrip.departureTime}:00`, // Will be calculated
      capacity: 35, // Default capacity
      booked: 0,
      available: 35,
      status: 'scheduled',
      stationId: user?.stationId || 'STA001',
      passengers: [],
      fare: parseInt(newTrip.fare)
    };
    setTrips([...trips, trip]);
    setNewTrip({
      routeFrom: '',
      routeTo: '',
      departureDate: '',
      departureTime: '',
      vehicle: '',
      driver: '',
      fare: ''
    });
    setShowBookDialog(false);
  };

  const handleBookPassenger = () => {
    // Validate required fields
    if (!passengerBooking.passengerName || !passengerBooking.passengerPhone || 
        !passengerBooking.emergencyContactName || !passengerBooking.emergencyContactPhone || 
        !passengerBooking.emergencyContactRelationship) {
      alert('Please fill in all required fields including emergency contact information.');
      return;
    }
    const updatedTrips = trips.map(trip => {
      if (trip.id === passengerBooking.tripId) {
        const newPassenger = {
          name: passengerBooking.passengerName,
          phone: passengerBooking.passengerPhone,
          email: passengerBooking.passengerEmail,
          seats: passengerBooking.seats,
          ticketId: `TKT${Date.now()}`,
          emergencyContact: {
            name: passengerBooking.emergencyContactName,
            phone: passengerBooking.emergencyContactPhone,
            relationship: passengerBooking.emergencyContactRelationship
          }
        };
        return {
          ...trip,
          passengers: [...trip.passengers, newPassenger],
          booked: trip.booked + passengerBooking.seats,
          available: trip.available - passengerBooking.seats,
          status: trip.available - passengerBooking.seats === 0 ? 'full' : trip.status
        };
      }
      return trip;
    });
    setTrips(updatedTrips);
    setPassengerBooking({
      tripId: '',
      passengerName: '',
      passengerPhone: '',
      passengerEmail: '',
      seats: 1,
      notes: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelationship: ''
    });
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = tripStatuses.find(s => s.value === status);
    return (
      <Badge className={statusInfo?.color || 'bg-gray-100 text-gray-800'}>
        {statusInfo?.label || status}
      </Badge>
    );
  };

  const TripCard = ({ trip }: { trip: any }) => (
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
          {getStatusBadge(trip.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="flex items-center space-x-1 mb-1">
              <Clock className="h-3 w-3" />
              <span>Departure: {new Date(trip.departureTime).toLocaleString()}</span>
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

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm">
            <p className="font-medium text-gray-700">Fare: ₵{trip.fare}</p>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSelectedTrip(trip);
                setShowPassengersDialog(true);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {trip.available > 0 && (
              <Button 
                size="sm"
                onClick={() => {
                  setPassengerBooking({...passengerBooking, tripId: trip.id});
                }}
              >
                Book
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trip Booking & Management</h1>
          <p className="text-gray-600">
            {isAdmin 
              ? 'Manage all trips across RISE stations' 
              : `Manage trips for ${user?.stationName}`
            }
          </p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={showBookDialog} onOpenChange={setShowBookDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Trip
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
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
                    <Select value={newTrip.routeFrom} onValueChange={(value) => setNewTrip({...newTrip, routeFrom: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select origin" />
                      </SelectTrigger>
                      <SelectContent>
                        {ghanaDestinations.map((dest) => (
                          <SelectItem key={dest} value={dest}>{dest}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="to">To</Label>
                    <Select value={newTrip.routeTo} onValueChange={(value) => setNewTrip({...newTrip, routeTo: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select destination" />
                      </SelectTrigger>
                      <SelectContent>
                        {ghanaDestinations.map((dest) => (
                          <SelectItem key={dest} value={dest}>{dest}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                <div>
                  <Label htmlFor="vehicle">Vehicle</Label>
                  <Select value={newTrip.vehicle} onValueChange={(value) => setNewTrip({...newTrip, vehicle: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GV-123-20">GV-123-20 (35 seats)</SelectItem>
                      <SelectItem value="GV-456-21">GV-456-21 (30 seats)</SelectItem>
                      <SelectItem value="KU-789-19">KU-789-19 (18 seats)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="driver">Driver</Label>
                  <Select value={newTrip.driver} onValueChange={(value) => setNewTrip({...newTrip, driver: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select driver" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Kwame Asante">Kwame Asante</SelectItem>
                      <SelectItem value="Ama Osei">Ama Osei</SelectItem>
                      <SelectItem value="Kofi Mensah">Kofi Mensah</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="fare">Fare (₵)</Label>
                  <Input
                    id="fare"
                    type="number"
                    value={newTrip.fare}
                    onChange={(e) => setNewTrip({...newTrip, fare: e.target.value})}
                    placeholder="45"
                  />
                </div>
                <Button onClick={handleScheduleTrip} className="w-full">
                  Schedule Trip
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Trip Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Route className="h-8 w-8 mx-auto mb-2 text-blue-600" />
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
            <Users className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <p className="text-2xl font-bold">{userTrips.reduce((sum, trip) => sum + trip.booked, 0)}</p>
            <p className="text-sm text-gray-600">Total Passengers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
            <p className="text-2xl font-bold">{userTrips.filter(t => t.status === 'full').length}</p>
            <p className="text-sm text-gray-600">Full Trips</p>
          </CardContent>
        </Card>
      </div>

      {/* Passenger Booking Form */}
      {passengerBooking.tripId && (
        <Card>
          <CardHeader>
            <CardTitle>Book Passenger</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="passengerName">Passenger Name <span className="text-red-500">*</span></Label>
                <Input
                  id="passengerName"
                  value={passengerBooking.passengerName}
                  onChange={(e) => setPassengerBooking({...passengerBooking, passengerName: e.target.value})}
                  placeholder="Full name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="passengerPhone">Phone Number <span className="text-red-500">*</span></Label>
                <Input
                  id="passengerPhone"
                  value={passengerBooking.passengerPhone}
                  onChange={(e) => setPassengerBooking({...passengerBooking, passengerPhone: e.target.value})}
                  placeholder="+233 XX XXX XXXX"
                  required
                />
              </div>
              <div>
                <Label htmlFor="passengerEmail">Email (Optional)</Label>
                <Input
                  id="passengerEmail"
                  type="email"
                  value={passengerBooking.passengerEmail}
                  onChange={(e) => setPassengerBooking({...passengerBooking, passengerEmail: e.target.value})}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label htmlFor="seats">Number of Seats</Label>
                <Input
                  id="seats"
                  type="number"
                  min="1"
                  max="5"
                  value={passengerBooking.seats}
                  onChange={(e) => setPassengerBooking({...passengerBooking, seats: parseInt(e.target.value)})}
                />
              </div>
              
              {/* Emergency Contact Section */}
              <div className="md:col-span-2 border-t pt-4 mt-4">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="h-4 w-4 text-red-600" />
                  <h3 className="font-medium text-red-600">Emergency Contact Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emergencyContactName">Emergency Contact Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="emergencyContactName"
                      value={passengerBooking.emergencyContactName}
                      onChange={(e) => setPassengerBooking({...passengerBooking, emergencyContactName: e.target.value})}
                      placeholder="Full name of emergency contact"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyContactPhone">Emergency Contact Phone <span className="text-red-500">*</span></Label>
                    <Input
                      id="emergencyContactPhone"
                      value={passengerBooking.emergencyContactPhone}
                      onChange={(e) => setPassengerBooking({...passengerBooking, emergencyContactPhone: e.target.value})}
                      placeholder="+233 XX XXX XXXX"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="emergencyContactRelationship">Relationship to Passenger <span className="text-red-500">*</span></Label>
                    <Select 
                      value={passengerBooking.emergencyContactRelationship} 
                      onValueChange={(value) => setPassengerBooking({...passengerBooking, emergencyContactRelationship: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="spouse">Spouse</SelectItem>
                        <SelectItem value="child">Child</SelectItem>
                        <SelectItem value="sibling">Sibling</SelectItem>
                        <SelectItem value="friend">Friend</SelectItem>
                        <SelectItem value="guardian">Guardian</SelectItem>
                        <SelectItem value="relative">Other Relative</SelectItem>
                        <SelectItem value="colleague">Colleague</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={passengerBooking.notes}
                  onChange={(e) => setPassengerBooking({...passengerBooking, notes: e.target.value})}
                  placeholder="Any special requirements or notes"
                />
              </div>
              <div className="md:col-span-2 flex space-x-2">
                <Button onClick={handleBookPassenger}>
                  Confirm Booking
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setPassengerBooking({
                    tripId: '',
                    passengerName: '',
                    passengerPhone: '',
                    passengerEmail: '',
                    seats: 1,
                    notes: '',
                    emergencyContactName: '',
                    emergencyContactPhone: '',
                    emergencyContactRelationship: ''
                  })}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trips Table for larger screens */}
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
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userTrips.map((trip) => (
                  <TableRow key={trip.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{trip.routeFrom} → {trip.routeTo}</p>
                        <p className="text-sm text-gray-500">{trip.id}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{new Date(trip.departureTime).toLocaleDateString()}</p>
                        <p className="text-sm text-gray-500">{new Date(trip.departureTime).toLocaleTimeString()}</p>
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
                    <TableCell>{getStatusBadge(trip.status)}</TableCell>
                    <TableCell>₵{trip.fare}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedTrip(trip);
                            setShowPassengersDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {trip.available > 0 && (
                          <Button 
                            size="sm"
                            onClick={() => {
                              setPassengerBooking({...passengerBooking, tripId: trip.id});
                            }}
                          >
                            Book
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
                <p>Departure: {new Date(selectedTrip.departureTime).toLocaleString()}</p>
                <p>Passengers: {selectedTrip.booked}/{selectedTrip.capacity}</p>
              </div>
              {selectedTrip.passengers.length > 0 ? (
                <div className="space-y-3">
                  {selectedTrip.passengers.map((passenger: any, index: number) => (
                    <div key={index} className="p-4 bg-gray-50 rounded border">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Passenger Information</h4>
                          <p className="font-medium">{passenger.name}</p>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Phone className="h-3 w-3" />
                            {passenger.phone}
                          </div>
                          {passenger.email && (
                            <p className="text-sm text-gray-600">{passenger.email}</p>
                          )}
                          <p className="text-sm font-medium mt-1">Ticket: {passenger.ticketId}</p>
                          {passenger.seats && <p className="text-sm text-gray-600">{passenger.seats} seat(s)</p>}
                        </div>
                        
                        {passenger.emergencyContact && (
                          <div>
                            <div className="flex items-center gap-1 mb-2">
                              <Shield className="h-3 w-3 text-red-600" />
                              <h4 className="font-medium text-gray-900">Emergency Contact</h4>
                            </div>
                            <p className="font-medium">{passenger.emergencyContact.name}</p>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Phone className="h-3 w-3" />
                              {passenger.emergencyContact.phone}
                            </div>
                            <p className="text-sm text-gray-600 capitalize">
                              Relationship: {passenger.emergencyContact.relationship}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No passengers booked yet</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}