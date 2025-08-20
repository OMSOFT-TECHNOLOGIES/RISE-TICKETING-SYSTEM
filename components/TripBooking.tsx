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
  Shield,
  DollarSign,
  TrendingUp,
  Calculator,
  Info,
  UserPlus,
  CarFront,
  ExternalLink
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';

// Tier system configuration
const TIER_SYSTEM = [
  {
    id: 1,
    name: 'Tier 1',
    minFare: 0.01,
    maxFare: 29,
    commission: 0.50,
    color: 'bg-green-100 text-green-800 border-green-200',
    description: 'Basic routes - Local & short distance'
  },
  {
    id: 2,
    name: 'Tier 2', 
    minFare: 30,
    maxFare: 59,
    commission: 1.00,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Medium routes - Inter-district'
  },
  {
    id: 3,
    name: 'Tier 3',
    minFare: 60,
    maxFare: Infinity,
    commission: 2.00,
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Premium routes - Long distance'
  }
];

// Function to calculate tier and commission with proper passenger count
const calculateTierInfo = (fare: number, passengerCount: number = 1) => {
  const tier = TIER_SYSTEM.find(t => fare >= t.minFare && fare <= t.maxFare);
  const commissionPerPassenger = tier ? tier.commission : 0;
  const totalCommission = commissionPerPassenger * passengerCount;
  const tripRevenue = fare * passengerCount;
  const netRevenue = tripRevenue - totalCommission;
  
  return {
    tier: tier || TIER_SYSTEM[0],
    commissionPerPassenger,
    totalCommission,
    tripRevenue,
    netRevenue,
    farePerPassenger: fare,
    passengerCount
  };
};

// Mock data for trips with tier information
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
  },
  {
    id: 'TRP004',
    routeFrom: 'Accra Central',
    routeTo: 'Tarkwa',
    departureTime: '2024-01-20T16:00:00',
    arrivalTime: '2024-01-20T19:30:00',
    vehicle: 'GV-789-22',
    driver: 'Akosua Frimpong',
    capacity: 25,
    booked: 18,
    available: 7,
    fare: 25,
    status: 'scheduled',
    stationId: 'STA001',
    passengers: []
  },
  {
    id: 'TRP005',
    routeFrom: 'Kumasi Main',
    routeTo: 'Wa',
    departureTime: '2024-01-20T07:00:00',
    arrivalTime: '2024-01-20T14:30:00',
    vehicle: 'KU-456-20',
    driver: 'Yaw Boateng',
    capacity: 20,
    booked: 15,
    available: 5,
    fare: 85,
    status: 'scheduled',
    stationId: 'STA002',
    passengers: []
  }
];

// Mock drivers data - In real app this would come from DriverManagement
const mockDrivers = [
  { id: 'DRV001', name: 'Kwame Asante', status: 'active', stationId: 'STA001' },
  { id: 'DRV002', name: 'Ama Osei', status: 'active', stationId: 'STA001' },
  { id: 'DRV003', name: 'Kofi Mensah', status: 'active', stationId: 'STA002' },
  { id: 'DRV004', name: 'Akosua Frimpong', status: 'active', stationId: 'STA001' },
  { id: 'DRV005', name: 'Yaw Boateng', status: 'active', stationId: 'STA002' }
];

// Mock vehicles data - In real app this would come from VehicleManagement  
const mockVehicles = [
  { id: 'VEH001', registrationNumber: 'GV-123-20', capacity: 35, status: 'active', stationId: 'STA001' },
  { id: 'VEH002', registrationNumber: 'GV-456-21', capacity: 30, status: 'active', stationId: 'STA001' },
  { id: 'VEH003', registrationNumber: 'KU-789-19', capacity: 18, status: 'active', stationId: 'STA002' },
  { id: 'VEH004', registrationNumber: 'GV-789-22', capacity: 25, status: 'active', stationId: 'STA001' },
  { id: 'VEH005', registrationNumber: 'KU-456-20', capacity: 20, status: 'active', stationId: 'STA002' }
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

// Tier Badge Component
const TierBadge = ({ fare, showCommission = false }: { fare: number; showCommission?: boolean }) => {
  const tierInfo = calculateTierInfo(fare, 1);
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
const TierInfoCard = ({ fare }: { fare: number }) => {
  const tierInfo = calculateTierInfo(fare, 1); // Preview for single passenger
  const progressPercentage = Math.min((fare / 100) * 100, 100);
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-blue-600" />
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
            <p className="text-lg font-bold text-blue-600">₵{tierInfo.commissionPerPassenger.toFixed(2)}</p>
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
        
        <div className="p-2 bg-blue-50 rounded text-xs text-blue-800">
          <strong>Example for full trip:</strong> If 30 passengers book at ₵{fare}/passenger, you'll earn ₵{(fare * 30).toFixed(2)} in revenue and pay ₵{(tierInfo.commissionPerPassenger * 30).toFixed(2)} in commission, netting ₵{((fare - tierInfo.commissionPerPassenger) * 30).toFixed(2)}.
        </div>
      </CardContent>
    </Card>
  );
};

export function TripBooking() {
  const { user } = useAuth();
  const [trips, setTrips] = useState(mockTrips);
  const [drivers, setDrivers] = useState(mockDrivers);
  const [vehicles, setVehicles] = useState(mockVehicles);
  const [showBookDialog, setShowBookDialog] = useState(false);
  const [showTierGuide, setShowTierGuide] = useState(false);
  const [showDriverRegDialog, setShowDriverRegDialog] = useState(false);
  const [showVehicleRegDialog, setShowVehicleRegDialog] = useState(false);
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

  // Filter drivers and vehicles by station unless admin
  const availableDrivers = isAdmin ? drivers.filter(d => d.status === 'active') : drivers.filter(d => d.stationId === user?.stationId && d.status === 'active');
  const availableVehicles = isAdmin ? vehicles.filter(v => v.status === 'active') : vehicles.filter(v => v.stationId === user?.stationId && v.status === 'active');

  // Calculate tier statistics with corrected calculations
  const tierStats = TIER_SYSTEM.map(tier => {
    const tierTrips = userTrips.filter(trip => {
      const tripTier = calculateTierInfo(trip.fare, 1);
      return tripTier.tier.id === tier.id;
    });
    
    const totalRevenue = tierTrips.reduce((sum, trip) => sum + (trip.fare * trip.booked), 0);
    const totalCommission = tierTrips.reduce((sum, trip) => sum + (tier.commission * trip.booked), 0);
    
    return {
      ...tier,
      tripCount: tierTrips.length,
      totalRevenue,
      totalCommission,
      netRevenue: totalRevenue - totalCommission
    };
  });

  const handleScheduleTrip = () => {
    const trip = {
      ...newTrip,
      id: `TRP${String(trips.length + 1).padStart(3, '0')}`,
      departureTime: `${newTrip.departureDate}T${newTrip.departureTime}:00`,
      arrivalTime: `${newTrip.departureDate}T${newTrip.departureTime}:00`,
      capacity: 35,
      booked: 0,
      available: 35,
      status: 'scheduled',
      stationId: user?.stationId || 'STA001',
      passengers: [],
      fare: parseFloat(newTrip.fare)
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

  const handleRegisterDriver = () => {
    const driver = {
      id: `DRV${String(drivers.length + 1).padStart(3, '0')}`,
      name: newDriver.name,
      status: 'active',
      stationId: user?.stationId || 'STA001',
      phone: newDriver.phone,
      email: newDriver.email,
      licenseNumber: newDriver.licenseNumber,
      licenseExpiry: newDriver.licenseExpiry,
      experience: parseInt(newDriver.experience) || 0
    };
    setDrivers([...drivers, driver]);
    setNewDriver({
      name: '',
      phone: '',
      email: '',
      licenseNumber: '',
      licenseExpiry: '',
      experience: ''
    });
    setShowDriverRegDialog(false);
  };

  const handleRegisterVehicle = () => {
    const vehicle = {
      id: `VEH${String(vehicles.length + 1).padStart(3, '0')}`,
      registrationNumber: newVehicle.registrationNumber,
      capacity: parseInt(newVehicle.capacity),
      status: 'active',
      stationId: user?.stationId || 'STA001',
      make: newVehicle.make,
      model: newVehicle.model,
      year: parseInt(newVehicle.year),
      fuelType: newVehicle.fuelType
    };
    setVehicles([...vehicles, vehicle]);
    setNewVehicle({
      registrationNumber: '',
      make: '',
      model: '',
      year: '',
      capacity: '',
      fuelType: ''
    });
    setShowVehicleRegDialog(false);
  };

  const handleBookPassenger = () => {
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

  const TripCard = ({ trip }: { trip: any }) => {
    const tierInfo = calculateTierInfo(trip.fare, trip.booked);
    
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
              <TierBadge fare={trip.fare} />
            </div>
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
                <p className="text-lg font-bold text-blue-600">₵{tierInfo.totalCommission.toFixed(2)}</p>
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
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trip Booking & Management</h1>
          <p className="text-gray-600">
            {isAdmin 
              ? 'Manage all trips across RISE stations with tier-based commission system' 
              : `Manage trips for ${user?.stationName}`
            }
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
                  {TIER_SYSTEM.map((tier) => (
                    <Card key={tier.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className={tier.color}>
                          {tier.name}
                        </Badge>
                        <span className="font-bold text-lg">₵{tier.commission.toFixed(2)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{tier.description}</p>
                      <p className="text-sm">
                        <strong>Fare Range:</strong> ₵{tier.minFare} - {tier.maxFare === Infinity ? '∞' : `₵${tier.maxFare}`}
                      </p>
                    </Card>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-2">How It Works</h4>
                  <ul className="text-sm space-y-1 text-blue-800">
                    <li>• Commission is charged per passenger per trip</li>
                    <li>• Tiers are determined by the trip fare amount</li>
                    <li>• <strong>Trip Revenue = Fare × Total Passengers</strong></li>
                    <li>• <strong>Total Commission = Commission Rate × Total Passengers</strong></li>
                    <li>• <strong>Net Revenue = Trip Revenue - Total Commission</strong></li>
                  </ul>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showBookDialog} onOpenChange={setShowBookDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Trip
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
                  <Select value={newTrip.vehicle} onValueChange={(value) => setNewTrip({...newTrip, vehicle: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableVehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.registrationNumber}>
                          {vehicle.registrationNumber} ({vehicle.capacity} seats)
                        </SelectItem>
                      ))}
                      {availableVehicles.length === 0 && (
                        <SelectItem value="" disabled>No vehicles available - Register one above</SelectItem>
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
                  <Select value={newTrip.driver} onValueChange={(value) => setNewTrip({...newTrip, driver: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select driver" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDrivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.name}>
                          {driver.name}
                        </SelectItem>
                      ))}
                      {availableDrivers.length === 0 && (
                        <SelectItem value="" disabled>No drivers available - Register one above</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
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
                  <TierInfoCard fare={parseFloat(newTrip.fare)} />
                )}

                <Button onClick={handleScheduleTrip} className="w-full">
                  Schedule Trip
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
            <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold">
              ₵{tierStats.reduce((sum, tier) => sum + tier.totalCommission, 0).toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">Total Commission</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-blue-600" />
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
                  <p className="font-medium text-blue-600">₵{tierStat.totalCommission.toFixed(2)}</p>
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
                  const tierInfo = calculateTierInfo(trip.fare, trip.booked);
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
                        <Badge variant="outline" className={tierInfo.tier.color}>
                          {tierInfo.tier.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">₵{tierInfo.tripRevenue.toFixed(2)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-blue-600">₵{tierInfo.totalCommission.toFixed(2)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-green-600">₵{tierInfo.netRevenue.toFixed(2)}</span>
                      </TableCell>
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
                  );
                })}
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

              {/* Revenue Summary */}
              {selectedTrip.booked > 0 && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Trip Revenue</p>
                      <p className="font-medium">₵{calculateTierInfo(selectedTrip.fare, selectedTrip.booked).tripRevenue.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Commission</p>
                      <p className="font-medium text-blue-600">₵{calculateTierInfo(selectedTrip.fare, selectedTrip.booked).totalCommission.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Net Revenue</p>
                      <p className="font-medium text-green-600">₵{calculateTierInfo(selectedTrip.fare, selectedTrip.booked).netRevenue.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t">
                    <TierBadge fare={selectedTrip.fare} showCommission={true} />
                  </div>
                </div>
              )}

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
                          <p className="text-xs text-gray-500 mt-1">Ticket: {passenger.ticketId}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Emergency Contact</h4>
                          <p className="font-medium">{passenger.emergencyContact.name}</p>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Phone className="h-3 w-3" />
                            {passenger.emergencyContact.phone}
                          </div>
                          <p className="text-xs text-gray-500 mt-1 capitalize">
                            {passenger.emergencyContact.relationship}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No passengers booked yet</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}