import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { useAuth } from './AuthContext';
import { 
  MapPin, 
  Users, 
  Bus, 
  DollarSign, 
  Plus, 
  Search, 
  Filter,
  MoreHorizontal,
  Edit,
  Eye,
  Trash2,
  Phone,
  Mail,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Building
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';

// Mock station data
const mockStations = [
  {
    id: 'STA001',
    name: 'Accra Central Station',
    code: 'ACC',
    address: '123 Liberation Road, Accra Central',
    city: 'Accra',
    region: 'Greater Accra',
    phone: '+233 30 123 4567',
    email: 'accra.central@rise.com',
    manager: 'John Doe',
    capacity: 200,
    platforms: 8,
    status: 'active',
    vehicles: 15,
    drivers: 25,
    dailyTrips: 45,
    monthlyRevenue: 125000,
    operatingHours: '05:00 - 22:00',
    facilities: ['Waiting Area', 'Restrooms', 'Food Court', 'Parking', 'WiFi'],
    coordinates: { lat: 5.6037, lng: -0.1870 },
    establishedDate: '2019-03-15',
    lastInspection: '2024-01-10',
    nextInspection: '2024-04-10'
  },
  {
    id: 'STA002',
    name: 'Kumasi Main Station',
    code: 'KUM',
    address: '456 Kejetia Road, Kumasi',
    city: 'Kumasi',
    region: 'Ashanti',
    phone: '+233 32 234 5678',
    email: 'kumasi.main@rise.com',
    manager: 'Jane Smith',
    capacity: 150,
    platforms: 6,
    status: 'active',
    vehicles: 12,
    drivers: 18,
    dailyTrips: 35,
    monthlyRevenue: 95000,
    operatingHours: '05:30 - 21:30',
    facilities: ['Waiting Area', 'Restrooms', 'Parking', 'Security'],
    coordinates: { lat: 6.6885, lng: -1.6244 },
    establishedDate: '2019-06-20',
    lastInspection: '2024-01-08',
    nextInspection: '2024-04-08'
  },
  {
    id: 'STA003',
    name: 'Takoradi Port Station',
    code: 'TAK',
    address: '789 Harbor Street, Takoradi',
    city: 'Takoradi',
    region: 'Western',
    phone: '+233 31 345 6789',
    email: 'takoradi.port@rise.com',
    manager: 'Robert Johnson',
    capacity: 100,
    platforms: 4,
    status: 'maintenance',
    vehicles: 8,
    drivers: 12,
    dailyTrips: 20,
    monthlyRevenue: 45000,
    operatingHours: '06:00 - 20:00',
    facilities: ['Waiting Area', 'Restrooms', 'Parking'],
    coordinates: { lat: 4.8845, lng: -1.7554 },
    establishedDate: '2020-01-10',
    lastInspection: '2024-01-05',
    nextInspection: '2024-04-05'
  },
  {
    id: 'STA004',
    name: 'Ho Regional Station',
    code: 'HOR',
    address: '321 Volta Road, Ho',
    city: 'Ho',
    region: 'Volta',
    phone: '+233 36 456 7890',
    email: 'ho.regional@rise.com',
    manager: 'Mary Wilson',
    capacity: 80,
    platforms: 3,
    status: 'active',
    vehicles: 6,
    drivers: 10,
    dailyTrips: 15,
    monthlyRevenue: 32000,
    operatingHours: '06:00 - 19:00',
    facilities: ['Waiting Area', 'Restrooms'],
    coordinates: { lat: 6.6112, lng: 0.4712 },
    establishedDate: '2020-09-05',
    lastInspection: '2024-01-12',
    nextInspection: '2024-04-12'
  }
];

export function StationManagement() {
  const { user } = useAuth();
  const [stations, setStations] = useState(mockStations);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [selectedStation, setSelectedStation] = useState<any>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [editingStation, setEditingStation] = useState<any>(null);

  const [stationForm, setStationForm] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    region: '',
    phone: '',
    email: '',
    manager: '',
    capacity: '',
    platforms: '',
    operatingHours: ''
  });

  const isAdmin = user?.role === 'admin';
  
  // Filter stations based on user role
  const userStations = isAdmin 
    ? stations 
    : stations.filter(s => s.id === user?.stationId);

  // Apply search and filters
  const filteredStations = userStations.filter(station => {
    const matchesSearch = searchTerm === '' || 
      station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      station.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      station.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      station.manager.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || station.status === statusFilter;
    const matchesRegion = regionFilter === 'all' || station.region === regionFilter;
    
    return matchesSearch && matchesStatus && matchesRegion;
  });

  const getStatusBadge = (status: string) => {
    const configs = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Active' },
      maintenance: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle, label: 'Maintenance' },
      inactive: { color: 'bg-gray-100 text-gray-800', icon: Building, label: 'Inactive' }
    };
    
    const config = configs[status as keyof typeof configs] || configs.active;
    const IconComponent = config.icon;
    
    return (
      <Badge className={config.color}>
        <IconComponent className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const resetForm = () => {
    setStationForm({
      name: '',
      code: '',
      address: '',
      city: '',
      region: '',
      phone: '',
      email: '',
      manager: '',
      capacity: '',
      platforms: '',
      operatingHours: ''
    });
  };

  const handleAddStation = () => {
    if (!stationForm.name || !stationForm.code || !stationForm.address) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newStation = {
      id: `STA${String(stations.length + 1).padStart(3, '0')}`,
      ...stationForm,
      capacity: parseInt(stationForm.capacity) || 0,
      platforms: parseInt(stationForm.platforms) || 1,
      status: 'active',
      vehicles: 0,
      drivers: 0,
      dailyTrips: 0,
      monthlyRevenue: 0,
      facilities: ['Waiting Area', 'Restrooms'],
      coordinates: { lat: 0, lng: 0 },
      establishedDate: new Date().toISOString().split('T')[0],
      lastInspection: null,
      nextInspection: null
    };

    setStations([...stations, newStation]);
    resetForm();
    setShowAddDialog(false);
    toast.success('Station added successfully');
  };

  const handleEditStation = () => {
    if (!editingStation || !stationForm.name || !stationForm.code || !stationForm.address) {
      toast.error('Please fill in all required fields');
      return;
    }

    setStations(stations.map(station => 
      station.id === editingStation.id 
        ? {
            ...station,
            ...stationForm,
            capacity: parseInt(stationForm.capacity) || station.capacity,
            platforms: parseInt(stationForm.platforms) || station.platforms
          }
        : station
    ));

    resetForm();
    setShowEditDialog(false);
    setEditingStation(null);
    toast.success('Station updated successfully');
  };

  const handleViewStation = (station: any) => {
    setSelectedStation(station);
    setShowViewDialog(true);
  };

  const handleEdit = (station: any) => {
    setEditingStation(station);
    setStationForm({
      name: station.name,
      code: station.code,
      address: station.address,
      city: station.city,
      region: station.region,
      phone: station.phone,
      email: station.email,
      manager: station.manager,
      capacity: station.capacity.toString(),
      platforms: station.platforms.toString(),
      operatingHours: station.operatingHours
    });
    setShowEditDialog(true);
  };

  const handleDelete = (stationId: string) => {
    setStations(stations.filter(s => s.id !== stationId));
    toast.success('Station deleted successfully');
  };

  const uniqueRegions = [...new Set(stations.map(s => s.region))];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Station Management</h1>
          <p className="text-gray-600">
            {isAdmin 
              ? 'Manage all RISE transport stations across Ghana' 
              : `Manage ${user?.stationName || 'your station'}`
            }
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Station
          </Button>
        )}
      </div>

      {/* Station Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Building className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold">{userStations.length}</p>
            <p className="text-sm text-gray-600">Total Stations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Bus className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold">{userStations.reduce((sum, s) => sum + s.vehicles, 0)}</p>
            <p className="text-sm text-gray-600">Total Vehicles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <p className="text-2xl font-bold">{userStations.reduce((sum, s) => sum + s.drivers, 0)}</p>
            <p className="text-sm text-gray-600">Total Drivers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <DollarSign className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
            <p className="text-2xl font-bold">₵{userStations.reduce((sum, s) => sum + s.monthlyRevenue, 0).toLocaleString()}</p>
            <p className="text-sm text-gray-600">Monthly Revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Search and Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Stations</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name, code, city, or manager..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status Filter</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isAdmin && (
              <div>
                <Label htmlFor="region">Region Filter</Label>
                <Select value={regionFilter} onValueChange={setRegionFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Regions</SelectItem>
                    {uniqueRegions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Station Registry ({filteredStations.length} stations)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Station</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStations.map((station) => (
                <TableRow key={station.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{station.name}</p>
                      <p className="text-sm text-gray-500">{station.code}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{station.city}</p>
                      <p className="text-sm text-gray-500">{station.region}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{station.manager}</p>
                      <p className="text-sm text-gray-500">{station.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{station.capacity} passengers</p>
                      <p className="text-sm text-gray-500">{station.platforms} platforms</p>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(station.status)}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{station.dailyTrips} trips/day</p>
                      <p className="text-sm text-gray-500">₵{station.monthlyRevenue.toLocaleString()}/month</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewStation(station)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {isAdmin && (
                          <>
                            <DropdownMenuItem onClick={() => handleEdit(station)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Station
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(station.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Station
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Station Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Station</DialogTitle>
            <DialogDescription>
              Create a new RISE transport station
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Station Name *</Label>
                <Input
                  id="name"
                  value={stationForm.name}
                  onChange={(e) => setStationForm({...stationForm, name: e.target.value})}
                  placeholder="e.g., Accra Central Station"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Station Code *</Label>
                <Input
                  id="code"
                  value={stationForm.code}
                  onChange={(e) => setStationForm({...stationForm, code: e.target.value})}
                  placeholder="e.g., ACC"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={stationForm.address}
                onChange={(e) => setStationForm({...stationForm, address: e.target.value})}
                placeholder="Complete station address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={stationForm.city}
                  onChange={(e) => setStationForm({...stationForm, city: e.target.value})}
                  placeholder="e.g., Accra"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Region *</Label>
                <Select value={stationForm.region} onValueChange={(value) => setStationForm({...stationForm, region: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Greater Accra">Greater Accra</SelectItem>
                    <SelectItem value="Ashanti">Ashanti</SelectItem>
                    <SelectItem value="Western">Western</SelectItem>
                    <SelectItem value="Eastern">Eastern</SelectItem>
                    <SelectItem value="Volta">Volta</SelectItem>
                    <SelectItem value="Northern">Northern</SelectItem>
                    <SelectItem value="Upper East">Upper East</SelectItem>
                    <SelectItem value="Upper West">Upper West</SelectItem>
                    <SelectItem value="Central">Central</SelectItem>
                    <SelectItem value="Brong Ahafo">Brong Ahafo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={stationForm.phone}
                  onChange={(e) => setStationForm({...stationForm, phone: e.target.value})}
                  placeholder="+233 XX XXX XXXX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={stationForm.email}
                  onChange={(e) => setStationForm({...stationForm, email: e.target.value})}
                  placeholder="station@rise.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manager">Station Manager</Label>
                <Input
                  id="manager"
                  value={stationForm.manager}
                  onChange={(e) => setStationForm({...stationForm, manager: e.target.value})}
                  placeholder="Manager name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={stationForm.capacity}
                  onChange={(e) => setStationForm({...stationForm, capacity: e.target.value})}
                  placeholder="200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="platforms">Platforms</Label>
                <Input
                  id="platforms"
                  type="number"
                  value={stationForm.platforms}
                  onChange={(e) => setStationForm({...stationForm, platforms: e.target.value})}
                  placeholder="8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours">Operating Hours</Label>
              <Input
                id="hours"
                value={stationForm.operatingHours}
                onChange={(e) => setStationForm({...stationForm, operatingHours: e.target.value})}
                placeholder="05:00 - 22:00"
              />
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleAddStation} className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                Add Station
              </Button>
              <Button variant="outline" onClick={() => {
                resetForm();
                setShowAddDialog(false);
              }}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Station Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Station</DialogTitle>
            <DialogDescription>
              Update station information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Station Name *</Label>
                <Input
                  id="edit-name"
                  value={stationForm.name}
                  onChange={(e) => setStationForm({...stationForm, name: e.target.value})}
                  placeholder="e.g., Accra Central Station"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-code">Station Code *</Label>
                <Input
                  id="edit-code"
                  value={stationForm.code}
                  onChange={(e) => setStationForm({...stationForm, code: e.target.value})}
                  placeholder="e.g., ACC"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-address">Address *</Label>
              <Input
                id="edit-address"
                value={stationForm.address}
                onChange={(e) => setStationForm({...stationForm, address: e.target.value})}
                placeholder="Complete station address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-city">City *</Label>
                <Input
                  id="edit-city"
                  value={stationForm.city}
                  onChange={(e) => setStationForm({...stationForm, city: e.target.value})}
                  placeholder="e.g., Accra"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-region">Region *</Label>
                <Select value={stationForm.region} onValueChange={(value) => setStationForm({...stationForm, region: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Greater Accra">Greater Accra</SelectItem>
                    <SelectItem value="Ashanti">Ashanti</SelectItem>
                    <SelectItem value="Western">Western</SelectItem>
                    <SelectItem value="Eastern">Eastern</SelectItem>
                    <SelectItem value="Volta">Volta</SelectItem>
                    <SelectItem value="Northern">Northern</SelectItem>
                    <SelectItem value="Upper East">Upper East</SelectItem>
                    <SelectItem value="Upper West">Upper West</SelectItem>
                    <SelectItem value="Central">Central</SelectItem>
                    <SelectItem value="Brong Ahafo">Brong Ahafo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone Number</Label>
                <Input
                  id="edit-phone"
                  value={stationForm.phone}
                  onChange={(e) => setStationForm({...stationForm, phone: e.target.value})}
                  placeholder="+233 XX XXX XXXX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email Address</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={stationForm.email}
                  onChange={(e) => setStationForm({...stationForm, email: e.target.value})}
                  placeholder="station@rise.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-manager">Station Manager</Label>
                <Input
                  id="edit-manager"
                  value={stationForm.manager}
                  onChange={(e) => setStationForm({...stationForm, manager: e.target.value})}
                  placeholder="Manager name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-capacity">Capacity</Label>
                <Input
                  id="edit-capacity"
                  type="number"
                  value={stationForm.capacity}
                  onChange={(e) => setStationForm({...stationForm, capacity: e.target.value})}
                  placeholder="200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-platforms">Platforms</Label>
                <Input
                  id="edit-platforms"
                  type="number"
                  value={stationForm.platforms}
                  onChange={(e) => setStationForm({...stationForm, platforms: e.target.value})}
                  placeholder="8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-hours">Operating Hours</Label>
              <Input
                id="edit-hours"
                value={stationForm.operatingHours}
                onChange={(e) => setStationForm({...stationForm, operatingHours: e.target.value})}
                placeholder="05:00 - 22:00"
              />
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleEditStation} className="flex-1">
                <Edit className="h-4 w-4 mr-2" />
                Update Station
              </Button>
              <Button variant="outline" onClick={() => {
                resetForm();
                setShowEditDialog(false);
                setEditingStation(null);
              }}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Station Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Station Details</DialogTitle>
            <DialogDescription>
              Complete station information and statistics
            </DialogDescription>
          </DialogHeader>
          {selectedStation && (
            <Tabs defaultValue="details" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="operations">Operations</TabsTrigger>
                <TabsTrigger value="facilities">Facilities</TabsTrigger>
                <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Basic Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Station Name:</span>
                          <span className="font-medium">{selectedStation.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Code:</span>
                          <span>{selectedStation.code}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <span>{getStatusBadge(selectedStation.status)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Region:</span>
                          <span>{selectedStation.region}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Contact Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span>{selectedStation.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span>{selectedStation.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span>{selectedStation.address}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Capacity & Infrastructure</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Passenger Capacity:</span>
                          <span>{selectedStation.capacity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Platforms:</span>
                          <span>{selectedStation.platforms}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Operating Hours:</span>
                          <span>{selectedStation.operatingHours}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Management</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Station Manager:</span>
                          <span>{selectedStation.manager}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Established:</span>
                          <span>{new Date(selectedStation.establishedDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="operations" className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-4">Current Operations</h4>
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Active Vehicles</span>
                          <span className="text-xl font-bold text-green-600">{selectedStation.vehicles}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">Currently operational</div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Available Drivers</span>
                          <span className="text-xl font-bold text-blue-600">{selectedStation.drivers}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">On duty today</div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Daily Trips</span>
                          <span className="text-xl font-bold text-purple-600">{selectedStation.dailyTrips}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">Average per day</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-4">Revenue Performance</h4>
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Monthly Revenue</span>
                          <span className="text-xl font-bold text-yellow-600">₵{selectedStation.monthlyRevenue.toLocaleString()}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">This month</div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Daily Average</span>
                          <span className="text-xl font-bold text-orange-600">₵{Math.round(selectedStation.monthlyRevenue / 30).toLocaleString()}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">Per day</div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="facilities" className="space-y-4">
                <div>
                  <h4 className="font-medium mb-4">Available Facilities</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedStation.facilities.map((facility: string, index: number) => (
                      <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">{facility}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="maintenance" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-4">Inspection Schedule</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">Last Inspection</span>
                        </div>
                        <div className="text-sm">
                          {selectedStation.lastInspection 
                            ? new Date(selectedStation.lastInspection).toLocaleDateString()
                            : 'Not scheduled'
                          }
                        </div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-orange-600" />
                          <span className="font-medium">Next Inspection</span>
                        </div>
                        <div className="text-sm">
                          {selectedStation.nextInspection 
                            ? new Date(selectedStation.nextInspection).toLocaleDateString()
                            : 'Not scheduled'
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}