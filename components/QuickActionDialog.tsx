import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useAuth } from './AuthContext';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from './ui/dialog';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from './ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { 
  Plus, 
  Users, 
  Route, 
  Bus, 
  UserCheck, 
  MapPin,
  Ticket
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';

interface QuickActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickActionDialog({ open, onOpenChange }: QuickActionDialogProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('booking');

  // Trip Booking Form State
  const [tripForm, setTripForm] = useState({
    passengerName: '',
    passengerPhone: '',
    passengerEmail: '',
    route: '',
    departureDate: '',
    departureTime: '',
    seatPreference: '',
    notes: ''
  });

  // User Creation Form State (Admin only)
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'worker',
    stationId: '',
    password: ''
  });

  // Vehicle Registration Form State
  const [vehicleForm, setVehicleForm] = useState({
    registrationNumber: '',
    make: '',
    model: '',
    capacity: '',
    type: 'bus',
    stationId: user?.stationId || ''
  });

  const handleTripBooking = () => {
    if (!tripForm.passengerName || !tripForm.passengerPhone || !tripForm.route) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Simulate API call
    setTimeout(() => {
      toast.success(`Trip booked successfully for ${tripForm.passengerName}`);
      setTripForm({
        passengerName: '',
        passengerPhone: '',
        passengerEmail: '',
        route: '',
        departureDate: '',
        departureTime: '',
        seatPreference: '',
        notes: ''
      });
      onOpenChange(false);
    }, 500);
  };

  const handleUserCreation = () => {
    if (!userForm.name || !userForm.email || !userForm.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Simulate API call
    setTimeout(() => {
      toast.success(`User ${userForm.name} created successfully`);
      setUserForm({
        name: '',
        email: '',
        phone: '',
        role: 'worker',
        stationId: '',
        password: ''
      });
      onOpenChange(false);
    }, 500);
  };

  const handleVehicleRegistration = () => {
    if (!vehicleForm.registrationNumber || !vehicleForm.make || !vehicleForm.model) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Simulate API call
    setTimeout(() => {
      toast.success(`Vehicle ${vehicleForm.registrationNumber} registered successfully`);
      setVehicleForm({
        registrationNumber: '',
        make: '',
        model: '',
        capacity: '',
        type: 'bus',
        stationId: user?.stationId || ''
      });
      onOpenChange(false);
    }, 500);
  };

  const quickActions = user?.role === 'admin' ? [
    {
      id: 'user',
      title: 'Add User',
      description: 'Create new admin or worker account',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      id: 'booking',
      title: 'Book Trip',
      description: 'Quick passenger trip booking',
      icon: Route,
      color: 'text-green-600'
    },
    {
      id: 'vehicle',
      title: 'Add Vehicle',
      description: 'Register new vehicle',
      icon: Bus,
      color: 'text-purple-600'
    }
  ] : [
    {
      id: 'booking',
      title: 'Book Trip',
      description: 'Quick passenger trip booking',
      icon: Route,
      color: 'text-green-600'
    },
    {
      id: 'vehicle',
      title: 'Add Vehicle',
      description: 'Register new vehicle',
      icon: Bus,
      color: 'text-purple-600'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Quick Actions
          </DialogTitle>
          <DialogDescription>
            Quickly perform common tasks from anywhere in the system
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            {quickActions.map((action) => (
              <TabsTrigger 
                key={action.id} 
                value={action.id}
                className="flex items-center gap-2"
              >
                <action.icon className={`h-4 w-4 ${action.color}`} />
                <span className="hidden sm:inline">{action.title}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Trip Booking Tab */}
          <TabsContent value="booking" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Route className="h-5 w-5 text-green-600" />
                  Quick Trip Booking
                </CardTitle>
                <CardDescription>
                  Book a trip for a passenger quickly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="passenger-name">Passenger Name *</Label>
                    <Input
                      id="passenger-name"
                      value={tripForm.passengerName}
                      onChange={(e) => setTripForm({...tripForm, passengerName: e.target.value})}
                      placeholder="Enter passenger name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passenger-phone">Phone Number *</Label>
                    <Input
                      id="passenger-phone"
                      value={tripForm.passengerPhone}
                      onChange={(e) => setTripForm({...tripForm, passengerPhone: e.target.value})}
                      placeholder="+233 XX XXX XXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passenger-email">Email Address</Label>
                    <Input
                      id="passenger-email"
                      type="email"
                      value={tripForm.passengerEmail}
                      onChange={(e) => setTripForm({...tripForm, passengerEmail: e.target.value})}
                      placeholder="passenger@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="route">Route *</Label>
                    <Select value={tripForm.route} onValueChange={(value) => setTripForm({...tripForm, route: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select route" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="accra-kumasi">Accra → Kumasi</SelectItem>
                        <SelectItem value="accra-cape-coast">Accra → Cape Coast</SelectItem>
                        <SelectItem value="kumasi-tamale">Kumasi → Tamale</SelectItem>
                        <SelectItem value="accra-ho">Accra → Ho</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="departure-date">Departure Date</Label>
                    <Input
                      id="departure-date"
                      type="date"
                      value={tripForm.departureDate}
                      onChange={(e) => setTripForm({...tripForm, departureDate: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="departure-time">Departure Time</Label>
                    <Input
                      id="departure-time"
                      type="time"
                      value={tripForm.departureTime}
                      onChange={(e) => setTripForm({...tripForm, departureTime: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seat-preference">Seat Preference</Label>
                  <Select value={tripForm.seatPreference} onValueChange={(value) => setTripForm({...tripForm, seatPreference: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select seat preference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="window">Window Seat</SelectItem>
                      <SelectItem value="aisle">Aisle Seat</SelectItem>
                      <SelectItem value="front">Front Seats</SelectItem>
                      <SelectItem value="back">Back Seats</SelectItem>
                      <SelectItem value="any">Any Available</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={tripForm.notes}
                    onChange={(e) => setTripForm({...tripForm, notes: e.target.value})}
                    placeholder="Any special requirements or notes..."
                    rows={3}
                  />
                </div>
                <Button onClick={handleTripBooking} className="w-full">
                  <Ticket className="h-4 w-4 mr-2" />
                  Book Trip
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Creation Tab (Admin only) */}
          {user?.role === 'admin' && (
            <TabsContent value="user" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Create New User
                  </CardTitle>
                  <CardDescription>
                    Add a new administrator or station worker
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="user-name">Full Name *</Label>
                      <Input
                        id="user-name"
                        value={userForm.name}
                        onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                        placeholder="Enter full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="user-email">Email Address *</Label>
                      <Input
                        id="user-email"
                        type="email"
                        value={userForm.email}
                        onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                        placeholder="user@rise.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="user-phone">Phone Number</Label>
                      <Input
                        id="user-phone"
                        value={userForm.phone}
                        onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                        placeholder="+233 XX XXX XXXX"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="user-role">Role *</Label>
                      <Select value={userForm.role} onValueChange={(value) => setUserForm({...userForm, role: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrator</SelectItem>
                          <SelectItem value="worker">Station Worker</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="user-station">Station</Label>
                      <Select value={userForm.stationId} onValueChange={(value) => setUserForm({...userForm, stationId: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select station" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="STA001">Accra Central Station</SelectItem>
                          <SelectItem value="STA002">Kumasi Main Station</SelectItem>
                          <SelectItem value="STA003">Takoradi Port Station</SelectItem>
                          <SelectItem value="STA004">Ho Regional Station</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="user-password">Password *</Label>
                      <Input
                        id="user-password"
                        type="password"
                        value={userForm.password}
                        onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                        placeholder="Create password"
                      />
                    </div>
                  </div>
                  <Button onClick={handleUserCreation} className="w-full">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Create User
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Vehicle Registration Tab */}
          <TabsContent value="vehicle" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bus className="h-5 w-5 text-purple-600" />
                  Register New Vehicle
                </CardTitle>
                <CardDescription>
                  Add a new vehicle to the fleet
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-number">Registration Number *</Label>
                    <Input
                      id="reg-number"
                      value={vehicleForm.registrationNumber}
                      onChange={(e) => setVehicleForm({...vehicleForm, registrationNumber: e.target.value})}
                      placeholder="GV-123-20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicle-make">Make *</Label>
                    <Input
                      id="vehicle-make"
                      value={vehicleForm.make}
                      onChange={(e) => setVehicleForm({...vehicleForm, make: e.target.value})}
                      placeholder="Toyota, Mercedes, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicle-model">Model *</Label>
                    <Input
                      id="vehicle-model"
                      value={vehicleForm.model}
                      onChange={(e) => setVehicleForm({...vehicleForm, model: e.target.value})}
                      placeholder="Hiace, Sprinter, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicle-capacity">Capacity</Label>
                    <Input
                      id="vehicle-capacity"
                      type="number"
                      value={vehicleForm.capacity}
                      onChange={(e) => setVehicleForm({...vehicleForm, capacity: e.target.value})}
                      placeholder="Number of seats"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicle-type">Vehicle Type</Label>
                    <Select value={vehicleForm.type} onValueChange={(value) => setVehicleForm({...vehicleForm, type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bus">Bus</SelectItem>
                        <SelectItem value="mini-bus">Mini Bus</SelectItem>
                        <SelectItem value="van">Van</SelectItem>
                        <SelectItem value="coach">Coach</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {user?.role === 'admin' && (
                    <div className="space-y-2">
                      <Label htmlFor="vehicle-station">Station</Label>
                      <Select value={vehicleForm.stationId} onValueChange={(value) => setVehicleForm({...vehicleForm, stationId: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select station" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="STA001">Accra Central Station</SelectItem>
                          <SelectItem value="STA002">Kumasi Main Station</SelectItem>
                          <SelectItem value="STA003">Takoradi Port Station</SelectItem>
                          <SelectItem value="STA004">Ho Regional Station</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <Button onClick={handleVehicleRegistration} className="w-full">
                  <MapPin className="h-4 w-4 mr-2" />
                  Register Vehicle
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}