import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from './AuthContext';
import { 
  UserCheck, 
  Plus, 
  Edit, 
  Eye,
  Phone,
  Mail,
  Calendar,
  Car,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Textarea } from './ui/textarea';

// Mock data for drivers
const mockDrivers = [
  {
    id: 'DRV001',
    name: 'Kwame Asante',
    phone: '+233 24 123 4567',
    email: 'kwame.asante@email.com',
    licenseNumber: 'DL-GH-123456',
    licenseExpiry: '2025-12-15',
    stationId: 'STA001',
    stationName: 'Accra Central Station',
    assignedVehicle: 'GV-123-20',
    status: 'active',
    experience: 8,
    rating: 4.8,
    totalTrips: 340,
    address: 'East Legon, Accra',
    emergencyContact: '+233 20 987 6543',
    joinDate: '2020-03-15'
  },
  {
    id: 'DRV002',
    name: 'Ama Osei',
    phone: '+233 26 234 5678',
    email: 'ama.osei@email.com',
    licenseNumber: 'DL-GH-234567',
    licenseExpiry: '2024-08-20',
    stationId: 'STA001',
    stationName: 'Accra Central Station',
    assignedVehicle: null,
    status: 'on_leave',
    experience: 5,
    rating: 4.6,
    totalTrips: 180,
    address: 'Madina, Accra',
    emergencyContact: '+233 24 876 5432',
    joinDate: '2021-07-10'
  },
  {
    id: 'DRV003',
    name: 'Kofi Mensah',
    phone: '+233 27 345 6789',
    email: 'kofi.mensah@email.com',
    licenseNumber: 'DL-GH-345678',
    licenseExpiry: '2026-03-10',
    stationId: 'STA002',
    stationName: 'Kumasi Main Station',
    assignedVehicle: 'KU-789-19',
    status: 'active',
    experience: 12,
    rating: 4.9,
    totalTrips: 520,
    address: 'Ahodwo, Kumasi',
    emergencyContact: '+233 23 765 4321',
    joinDate: '2018-11-25'
  }
];

const driverStatuses = [
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
  { value: 'on_leave', label: 'On Leave', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'suspended', label: 'Suspended', color: 'bg-red-100 text-red-800' },
  { value: 'training', label: 'In Training', color: 'bg-blue-100 text-blue-800' }
];

export function DriverManagement() {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState(mockDrivers);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [newDriver, setNewDriver] = useState({
    name: '',
    phone: '',
    email: '',
    licenseNumber: '',
    licenseExpiry: '',
    experience: '',
    address: '',
    emergencyContact: ''
  });

  const isAdmin = user?.role === 'admin';
  const userDrivers = isAdmin ? drivers : drivers.filter(d => d.stationId === user?.stationId);

  const handleAddDriver = () => {
    const driver = {
      ...newDriver,
      id: `DRV${String(drivers.length + 1).padStart(3, '0')}`,
      stationId: user?.stationId || 'STA001',
      stationName: user?.stationName || 'Default Station',
      assignedVehicle: null,
      status: 'active',
      rating: 0,
      totalTrips: 0,
      joinDate: new Date().toISOString().split('T')[0],
      experience: parseInt(newDriver.experience) || 0
    };
    setDrivers([...drivers, driver]);
    setNewDriver({
      name: '',
      phone: '',
      email: '',
      licenseNumber: '',
      licenseExpiry: '',
      experience: '',
      address: '',
      emergencyContact: ''
    });
    setShowAddDialog(false);
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = driverStatuses.find(s => s.value === status);
    return (
      <Badge className={statusInfo?.color || 'bg-gray-100 text-gray-800'}>
        {statusInfo?.label || status}
      </Badge>
    );
  };

  const getLicenseStatus = (expiry: string) => {
    const expiryDate = new Date(expiry);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    if (daysUntilExpiry < 0) {
      return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
    } else if (daysUntilExpiry < 30) {
      return <Badge className="bg-yellow-100 text-yellow-800">Expiring Soon</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800">Valid</Badge>;
    }
  };

  const DriverCard = ({ driver }: { driver: any }) => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <UserCheck className="h-5 w-5" />
              <span>{driver.name}</span>
            </CardTitle>
            <p className="text-sm text-gray-600">{driver.id}</p>
          </div>
          {getStatusBadge(driver.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="flex items-center space-x-1 mb-1">
              <Phone className="h-3 w-3" />
              <span>{driver.phone}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Mail className="h-3 w-3" />
              <span>{driver.email}</span>
            </div>
          </div>
          <div>
            <p className="font-medium text-gray-700">License</p>
            <p>{driver.licenseNumber}</p>
            {getLicenseStatus(driver.licenseExpiry)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-gray-700">Experience</p>
            <p>{driver.experience} years</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Rating</p>
            <p>⭐ {driver.rating}/5.0</p>
          </div>
        </div>

        <div className="text-sm">
          <p className="font-medium text-gray-700">Assigned Vehicle</p>
          <p>{driver.assignedVehicle || 'No vehicle assigned'}</p>
        </div>

        {isAdmin && (
          <div className="text-sm">
            <p className="font-medium text-gray-700">Station</p>
            <p>{driver.stationName}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm">
            <div className="flex items-center space-x-1">
              <Car className="h-4 w-4 text-blue-600" />
              <span>{driver.totalTrips} trips completed</span>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSelectedDriver(driver);
                setShowDetailsDialog(true);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4" />
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
          <h1 className="text-3xl font-bold">
            {isAdmin ? 'All Drivers' : 'My Drivers'}
          </h1>
          <p className="text-gray-600">
            {isAdmin 
              ? 'Manage all drivers across RISE stations' 
              : `Manage drivers for ${user?.stationName}`
            }
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Register Driver
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Register New Driver</DialogTitle>
              <DialogDescription>
                Add a new driver to the RISE transport system. All fields are required.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="driverName">Full Name</Label>
                <Input
                  id="driverName"
                  value={newDriver.name}
                  onChange={(e) => setNewDriver({...newDriver, name: e.target.value})}
                  placeholder="e.g., Kwame Asante"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={newDriver.phone}
                    onChange={(e) => setNewDriver({...newDriver, phone: e.target.value})}
                    placeholder="+233 XX XXX XXXX"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newDriver.email}
                    onChange={(e) => setNewDriver({...newDriver, email: e.target.value})}
                    placeholder="driver@email.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="license">License Number</Label>
                  <Input
                    id="license"
                    value={newDriver.licenseNumber}
                    onChange={(e) => setNewDriver({...newDriver, licenseNumber: e.target.value})}
                    placeholder="DL-GH-XXXXXX"
                  />
                </div>
                <div>
                  <Label htmlFor="expiry">License Expiry</Label>
                  <Input
                    id="expiry"
                    type="date"
                    value={newDriver.licenseExpiry}
                    onChange={(e) => setNewDriver({...newDriver, licenseExpiry: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="experience">Years of Experience</Label>
                <Input
                  id="experience"
                  type="number"
                  value={newDriver.experience}
                  onChange={(e) => setNewDriver({...newDriver, experience: e.target.value})}
                  placeholder="5"
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={newDriver.address}
                  onChange={(e) => setNewDriver({...newDriver, address: e.target.value})}
                  placeholder="Full residential address"
                />
              </div>
              <div>
                <Label htmlFor="emergency">Emergency Contact</Label>
                <Input
                  id="emergency"
                  value={newDriver.emergencyContact}
                  onChange={(e) => setNewDriver({...newDriver, emergencyContact: e.target.value})}
                  placeholder="+233 XX XXX XXXX"
                />
              </div>
              <Button onClick={handleAddDriver} className="w-full">
                Register Driver
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Driver Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <UserCheck className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold">{userDrivers.length}</p>
            <p className="text-sm text-gray-600">Total Drivers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold">{userDrivers.filter(d => d.status === 'active').length}</p>
            <p className="text-sm text-gray-600">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
            <p className="text-2xl font-bold">{userDrivers.filter(d => d.status === 'on_leave').length}</p>
            <p className="text-sm text-gray-600">On Leave</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-600" />
            <p className="text-2xl font-bold">
              {userDrivers.filter(d => {
                const expiry = new Date(d.licenseExpiry);
                const today = new Date();
                const days = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
                return days < 30;
              }).length}
            </p>
            <p className="text-sm text-gray-600">License Expiring</p>
          </CardContent>
        </Card>
      </div>

      {/* Drivers Table for larger screens */}
      <div className="hidden lg:block">
        <Card>
          <CardHeader>
            <CardTitle>Driver Registry</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Rating</TableHead>
                  {isAdmin && <TableHead>Station</TableHead>}
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userDrivers.map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{driver.name}</p>
                        <p className="text-sm text-gray-500">{driver.id}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{driver.phone}</p>
                        <p className="text-sm text-gray-500">{driver.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{driver.licenseNumber}</p>
                        {getLicenseStatus(driver.licenseExpiry)}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(driver.status)}</TableCell>
                    <TableCell>{driver.assignedVehicle || 'Unassigned'}</TableCell>
                    <TableCell>⭐ {driver.rating}/5.0</TableCell>
                    {isAdmin && <TableCell>{driver.stationName}</TableCell>}
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedDriver(driver);
                            setShowDetailsDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
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

      {/* Driver Cards for mobile */}
      <div className="lg:hidden grid grid-cols-1 gap-4">
        {userDrivers.map((driver) => (
          <DriverCard key={driver.id} driver={driver} />
        ))}
      </div>

      {/* Driver Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Driver Details</DialogTitle>
            <DialogDescription>
              Complete information for {selectedDriver?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedDriver && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700">Full Name</p>
                  <p>{selectedDriver.name}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Driver ID</p>
                  <p>{selectedDriver.id}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700">Phone</p>
                  <p>{selectedDriver.phone}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Email</p>
                  <p>{selectedDriver.email}</p>
                </div>
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-700">Address</p>
                <p>{selectedDriver.address}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700">Experience</p>
                  <p>{selectedDriver.experience} years</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Join Date</p>
                  <p>{new Date(selectedDriver.joinDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700">Total Trips</p>
                  <p>{selectedDriver.totalTrips}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Rating</p>
                  <p>⭐ {selectedDriver.rating}/5.0</p>
                </div>
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-700">Emergency Contact</p>
                <p>{selectedDriver.emergencyContact}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}