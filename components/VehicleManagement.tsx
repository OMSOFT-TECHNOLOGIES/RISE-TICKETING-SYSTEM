import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from './AuthContext';
import { 
  Bus, 
  Plus, 
  Edit, 
  Eye,
  Calendar,
  Settings,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

// Mock data for vehicles
const mockVehicles = [
  {
    id: 'VEH001',
    registrationNumber: 'GV-123-20',
    make: 'Hyundai',
    model: 'County',
    year: 2020,
    capacity: 35,
    stationId: 'STA001',
    stationName: 'Accra Central Station',
    status: 'active',
    lastMaintenance: '2024-01-15',
    nextMaintenance: '2024-04-15',
    mileage: 45000,
    fuelType: 'Diesel',
    driver: 'Kwame Asante'
  },
  {
    id: 'VEH002',
    registrationNumber: 'GV-456-21',
    make: 'Tata',
    model: 'LP 713',
    year: 2021,
    capacity: 30,
    stationId: 'STA001',
    stationName: 'Accra Central Station',
    status: 'maintenance',
    lastMaintenance: '2024-01-20',
    nextMaintenance: '2024-04-20',
    mileage: 38000,
    fuelType: 'Diesel',
    driver: null
  },
  {
    id: 'VEH003',
    registrationNumber: 'KU-789-19',
    make: 'Mercedes',
    model: 'Sprinter',
    year: 2019,
    capacity: 18,
    stationId: 'STA002',
    stationName: 'Kumasi Main Station',
    status: 'active',
    lastMaintenance: '2024-01-10',
    nextMaintenance: '2024-04-10',
    mileage: 67000,
    fuelType: 'Diesel',
    driver: 'Akosua Mensah'
  }
];

const vehicleMakes = ['Hyundai', 'Tata', 'Mercedes', 'Isuzu', 'Toyota', 'Ford', 'Volkswagen'];
const fuelTypes = ['Diesel', 'Petrol', 'CNG', 'Electric'];

export function VehicleManagement() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState(mockVehicles);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    registrationNumber: '',
    make: '',
    model: '',
    year: '',
    capacity: '',
    fuelType: '',
    mileage: ''
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const userVehicles = isAdmin ? vehicles : vehicles.filter(v => v.stationId === user?.stationId);

  const handleAddVehicle = () => {
    const vehicle = {
      ...newVehicle,
      id: `VEH${String(vehicles.length + 1).padStart(3, '0')}`,
      stationId: user?.stationId || 'STA001',
      stationName: user?.stationName || 'Default Station',
      status: 'active',
      lastMaintenance: new Date().toISOString().split('T')[0],
      nextMaintenance: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      driver: null,
      year: parseInt(newVehicle.year),
      capacity: parseInt(newVehicle.capacity),
      mileage: parseInt(newVehicle.mileage)
    };
    setVehicles([...vehicles, vehicle]);
    setNewVehicle({
      registrationNumber: '',
      make: '',
      model: '',
      year: '',
      capacity: '',
      fuelType: '',
      mileage: ''
    });
    setShowAddDialog(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'maintenance':
        return <Badge className="bg-yellow-100 text-yellow-800">Maintenance</Badge>;
      case 'inactive':
        return <Badge className="bg-red-100 text-red-800">Inactive</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const VehicleCard = ({ vehicle }: { vehicle: any }) => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Bus className="h-5 w-5" />
              <span>{vehicle.registrationNumber}</span>
            </CardTitle>
            <p className="text-sm text-gray-600">{vehicle.make} {vehicle.model} ({vehicle.year})</p>
          </div>
          {getStatusBadge(vehicle.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-gray-700">Capacity</p>
            <p>{vehicle.capacity} passengers</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Fuel Type</p>
            <p>{vehicle.fuelType}</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Mileage</p>
            <p>{vehicle.mileage.toLocaleString()} km</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Current Driver</p>
            <p>{vehicle.driver || 'Unassigned'}</p>
          </div>
        </div>

        {isAdmin && (
          <div>
            <p className="font-medium text-gray-700 text-sm">Station</p>
            <p className="text-sm">{vehicle.stationName}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm">
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span>Next service: {new Date(vehicle.nextMaintenance).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4" />
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
            {isAdmin ? 'All Vehicles' : 'My Vehicles'}
          </h1>
          <p className="text-gray-600">
            {isAdmin 
              ? 'Manage all vehicles across RISE stations' 
              : `Manage vehicles for ${user?.stationName}`
            }
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Register Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Register New Vehicle</DialogTitle>
              <DialogDescription>
                Register a new vehicle in the RISE transport system. All fields are required.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="regNumber">Registration Number</Label>
                <Input
                  id="regNumber"
                  value={newVehicle.registrationNumber}
                  onChange={(e) => setNewVehicle({...newVehicle, registrationNumber: e.target.value})}
                  placeholder="e.g., GV-123-20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="make">Make</Label>
                  <Select value={newVehicle.make} onValueChange={(value) => setNewVehicle({...newVehicle, make: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select make" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleMakes.map((make) => (
                        <SelectItem key={make} value={make}>{make}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={newVehicle.model}
                    onChange={(e) => setNewVehicle({...newVehicle, model: e.target.value})}
                    placeholder="e.g., County"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={newVehicle.year}
                    onChange={(e) => setNewVehicle({...newVehicle, year: e.target.value})}
                    placeholder="2024"
                  />
                </div>
                <div>
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={newVehicle.capacity}
                    onChange={(e) => setNewVehicle({...newVehicle, capacity: e.target.value})}
                    placeholder="35"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="fuelType">Fuel Type</Label>
                <Select value={newVehicle.fuelType} onValueChange={(value) => setNewVehicle({...newVehicle, fuelType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fuel type" />
                  </SelectTrigger>
                  <SelectContent>
                    {fuelTypes.map((fuel) => (
                      <SelectItem key={fuel} value={fuel}>{fuel}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="mileage">Current Mileage (km)</Label>
                <Input
                  id="mileage"
                  type="number"
                  value={newVehicle.mileage}
                  onChange={(e) => setNewVehicle({...newVehicle, mileage: e.target.value})}
                  placeholder="45000"
                />
              </div>
              <Button onClick={handleAddVehicle} className="w-full">
                Register Vehicle
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Vehicle Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Bus className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold">{userVehicles.length}</p>
            <p className="text-sm text-gray-600">Total Vehicles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold">{userVehicles.filter(v => v.status === 'active').length}</p>
            <p className="text-sm text-gray-600">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Settings className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
            <p className="text-2xl font-bold">{userVehicles.filter(v => v.status === 'maintenance').length}</p>
            <p className="text-sm text-gray-600">In Maintenance</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-600" />
            <p className="text-2xl font-bold">{userVehicles.filter(v => v.status === 'inactive').length}</p>
            <p className="text-sm text-gray-600">Inactive</p>
          </CardContent>
        </Card>
      </div>

      {/* Vehicles Table for larger screens */}
      <div className="hidden lg:block">
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Registration</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Driver</TableHead>
                  {isAdmin && <TableHead>Station</TableHead>}
                  <TableHead>Next Service</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userVehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="font-medium">{vehicle.registrationNumber}</TableCell>
                    <TableCell>{vehicle.make} {vehicle.model}</TableCell>
                    <TableCell>{vehicle.capacity}</TableCell>
                    <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                    <TableCell>{vehicle.driver || 'Unassigned'}</TableCell>
                    {isAdmin && <TableCell>{vehicle.stationName}</TableCell>}
                    <TableCell>{new Date(vehicle.nextMaintenance).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
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

      {/* Vehicle Cards for mobile */}
      <div className="lg:hidden grid grid-cols-1 gap-4">
        {userVehicles.map((vehicle) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} />
        ))}
      </div>
    </div>
  );
}