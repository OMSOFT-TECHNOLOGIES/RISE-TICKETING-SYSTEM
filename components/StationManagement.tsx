import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { useAuth } from './AuthContext';
import { stationApi, userApi, unionApi, parseListResponse } from './utils/api';
import { parseRiseNumericId } from './utils/helpers';
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
  Building,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { notify } from './utils/notify';
import { cn } from './ui/utils';

export function StationManagement() {
  const { user } = useAuth();
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [managers, setManagers] = useState<any[]>([]);
  const [openManagerCombobox, setOpenManagerCombobox] = useState(false);
  const [unions, setUnions] = useState<any[]>([]);
  const [formOptionsLoading, setFormOptionsLoading] = useState(false);
  const [openUnionCombobox, setOpenUnionCombobox] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [selectedStation, setSelectedStation] = useState<any>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [stationToDelete, setStationToDelete] = useState<any>(null);
  const [editingStation, setEditingStation] = useState<any>(null);

  // Fetch stations from backend
  const fetchStations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await stationApi.getAll({
        region: regionFilter !== 'all' ? regionFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined
      });
      
      if (response.success && response.data) {
        const stationsData = response.data.stations || response.data;
        setStations(Array.isArray(stationsData) ? stationsData : []);
      } else {
        console.error('Fetch stations error:', response);
        setError(
          typeof response.error === 'string'
            ? response.error
            : (response.error as { message?: string })?.message || 'Failed to load stations'
        );
      }
    } catch (err) {
      console.error('Fetch stations exception:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  // Load stations on component mount
  useEffect(() => {
    fetchStations();
  }, []);

  const fetchManagers = async () => {
    try {
      const response = await userApi.getActiveManagers();
      if (response.success && response.data) {
        setManagers(parseListResponse(response.data));
      } else {
        setManagers([]);
        if (response.error) {
          console.error('Failed to fetch managers:', response.error);
        }
      }
    } catch (error) {
      console.error('Failed to fetch managers:', error);
      setManagers([]);
    }
  };

  const fetchUnions = async (region?: string) => {
    try {
      const response = await unionApi.getActiveUnions(
        region && region !== 'all' ? region : undefined
      );
      if (response.success && response.data) {
        setUnions(parseListResponse(response.data, 'unions'));
      } else {
        setUnions([]);
        if (response.error) {
          console.error('Failed to fetch unions:', response.error);
        }
      }
    } catch (error) {
      console.error('Failed to fetch unions:', error);
      setUnions([]);
    }
  };

  const loadStationFormOptions = async (region?: string) => {
    setFormOptionsLoading(true);
    try {
      await Promise.all([fetchManagers(), fetchUnions(region)]);
    } finally {
      setFormOptionsLoading(false);
    }
  };

  const openAddStationDialog = () => {
    resetForm();
    setShowAddDialog(true);
    setFormOptionsLoading(true);
    void fetchUnions().finally(() => setFormOptionsLoading(false));
  };

  // Refetch when filters change
  useEffect(() => {
    if (!loading) {
      fetchStations();
    }
  }, [statusFilter, regionFilter]);

  const [stationForm, setStationForm] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    region: '',
    district: '',
    phone: '',
    email: '',
    manager: '',
    union: ''
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  
  // Filter stations based on user role
  const userStations = isAdmin 
    ? stations 
    : stations.filter(s => s.id === user?.stationId);

  // Apply search and filters
  const filteredStations = userStations.filter(station => {
    const matchesSearch = searchTerm === '' || 
      station.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      station.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      station.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      station.managerName?.toLowerCase().includes(searchTerm.toLowerCase());
    
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
      district: '',
      phone: '',
      email: '',
      manager: '',
      union: ''
    });
  };

  const handleAddStation = async () => {
    if (
      !stationForm.name ||
      !stationForm.code ||
      !stationForm.address ||
      !stationForm.city ||
      !stationForm.region ||
      !stationForm.district ||
      !stationForm.phone
    ) {
      notify.error(
        'Please fill in all required fields (name, code, address, city, region, district, phone)'
      );
      return;
    }

    try {
      const stationData = {
        name: stationForm.name,
        code: stationForm.code.toUpperCase(),
        address: stationForm.address,
        city: stationForm.city,
        region: stationForm.region,
        district: stationForm.district,
        phone: stationForm.phone,
        email: stationForm.email || undefined,
        unionId: parseRiseNumericId(stationForm.union),
        // Not shown in UI; satisfies API/DB until backend optional-capacity build is deployed
        capacity: 1,
      };

      const response = await stationApi.create(stationData);

      if (response.success) {
        notify.success(response.message || 'Station added successfully');
        await fetchStations();
        resetForm();
        setShowAddDialog(false);
      } else {
        console.error('Station creation error:', response);
        const errorMsg = typeof response.error === 'string' 
          ? response.error 
          : (response.error && typeof response.error === 'object' && 'message' in response.error)
            ? String((response.error as any).message)
            : response.details || 'Please try again';
        notify.error('Failed to add station', {
          description: errorMsg,
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Station creation exception:', error);
      const errorMessage = error instanceof Error ? error.message : 'Please check your connection';
      notify.error('Failed to add station', {
        description: errorMessage,
        duration: 5000
      });
    }
  };

  const handleEditStation = async () => {
    if (!editingStation || !stationForm.name || !stationForm.code || !stationForm.address || !stationForm.region || !stationForm.district) {
      notify.error('Please fill in all required fields (name, code, address, region, district)');
      return;
    }

    try {
      const stationData = {
        name: stationForm.name,
        code: stationForm.code.toUpperCase(),
        address: stationForm.address,
        city: stationForm.city,
        region: stationForm.region,
        district: stationForm.district,
        phone: stationForm.phone,
        email: stationForm.email,
        managerId: parseRiseNumericId(stationForm.manager),
        unionId: parseRiseNumericId(stationForm.union),
      };

      const response = await stationApi.update(editingStation.id, stationData);

      if (response.success) {
        notify.success(response.message || 'Station updated successfully');
        await fetchStations();
        resetForm();
        setShowEditDialog(false);
        setEditingStation(null);
      } else {
        console.error('Station update error:', response);
        const errorMsg = typeof response.error === 'string' 
          ? response.error 
          : (response.error && typeof response.error === 'object' && 'message' in response.error)
            ? String((response.error as any).message)
            : response.details || 'Please try again';
        notify.error('Failed to update station', {
          description: errorMsg,
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Station update exception:', error);
      const errorMessage = error instanceof Error ? error.message : 'Please check your connection';
      notify.error('Failed to update station', {
        description: errorMessage,
        duration: 5000
      });
    }
  };

  const handleViewStation = (station: any) => {
    setSelectedStation(station);
    setShowViewDialog(true);
  };

  const handleEdit = (station: any) => {
    setEditingStation(station);
    setStationForm({
      name: station.name || '',
      code: station.code || '',
      address: station.address || '',
      city: station.city || '',
      region: station.region || '',
      district: station.district || '',
      phone: station.phone || '',
      email: station.email || '',
      manager: station.managerUserId || '',
      union: station.unionId != null ? String(station.unionId) : '',
    });
    setShowEditDialog(true);
    void loadStationFormOptions(station.region);
  };

  const handleDelete = async (stationId: string) => {
    try {
      const response = await stationApi.delete(stationId);

      if (response.success) {
        notify.success(response.message || 'Station deleted successfully');
        await fetchStations();
        setShowDeleteDialog(false);
        setStationToDelete(null);
      } else {
        console.error('Station deletion error:', response);
        notify.error('Failed to delete station', {
          description: response.error || 'Please try again',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Station deletion exception:', error);
      const errorMessage = error instanceof Error ? error.message : 'Please check your connection';
      notify.error('Failed to delete station', {
        description: errorMessage,
        duration: 5000
      });
    }
  };

  const confirmDelete = (station: any) => {
    setStationToDelete(station);
    setShowDeleteDialog(true);
  };

  const uniqueRegions = [...new Set(stations.map(s => s.region).filter(Boolean))];

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-gray-600">Loading stations...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchStations}>Retry</Button>
        </div>
      </div>
    );
  }

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
          <Button onClick={openAddStationDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Station
          </Button>
        )}
      </div>

      {/* Station Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Building className="h-8 w-8 mx-auto mb-2 text-[#193cb8]" />
            <p className="text-2xl font-bold">{userStations.length}</p>
            <p className="text-sm text-gray-600">Total Stations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Bus className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold">{userStations.reduce((sum, s) => sum + (s.vehicles || 0), 0)}</p>
            <p className="text-sm text-gray-600">Total Vehicles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-[#193cb8]" />
            <p className="text-2xl font-bold">{userStations.reduce((sum, s) => sum + (s.drivers || 0), 0)}</p>
            <p className="text-sm text-gray-600">Total Drivers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <DollarSign className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
            <p className="text-2xl font-bold">₵{userStations.reduce((sum, s) => sum + (s.monthlyRevenue || 0), 0).toLocaleString()}</p>
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
                <TableHead>Union</TableHead>
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
                      <p className="font-medium">{station.name || 'N/A'}</p>
                      <p className="text-sm text-gray-500">{station.code || 'N/A'}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{station.city || 'N/A'}</p>
                      <p className="text-sm text-gray-500">{station.region || 'N/A'}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{station.managerName || 'N/A'}</p>
                      <p className="text-sm text-gray-500">{station.phone || 'N/A'}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{station.unionName || 'N/A'}</p>
                      <p className="text-sm text-gray-500">{station.unionAcronym || ''}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{station.capacity || 'N/A'} passengers</p>
                      <p className="text-sm text-gray-500">{station.platforms || 'N/A'} platforms</p>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(station.status)}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{station.dailyTrips || 0} trips/day</p>
                      <p className="text-sm text-gray-500">₵{station.monthlyRevenue?.toLocaleString() || '0'}/month</p>
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
                              onClick={() => confirmDelete(station)}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Station</DialogTitle>
            <DialogDescription>
              Create a new RISE transport station. Station managers are linked to a station when you create a station_manager user in User Management.
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

            <div className="space-y-2">
              <Label htmlFor="district">District *</Label>
              <Input
                id="district"
                value={stationForm.district}
                onChange={(e) => setStationForm({...stationForm, district: e.target.value})}
                placeholder="e.g., Accra Metropolitan"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
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

            <div className="space-y-2">
                <Label htmlFor="union">Transport Union</Label>
                <Popover modal={true} open={openUnionCombobox} onOpenChange={setOpenUnionCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openUnionCombobox}
                      className="w-full justify-between"
                    >
                      {stationForm.union
                        ? unions.find((union) => union.id.toString() === stationForm.union)?.name
                        : "Select union..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] p-0 z-[9999]" align="start" side="bottom" sideOffset={5}>
                    <Command>
                      <CommandInput placeholder="Search unions..." />
                      <CommandList>
                        <CommandEmpty>
                          {formOptionsLoading
                            ? 'Loading unions…'
                            : unions.length === 0
                              ? 'No active unions available.'
                              : 'No union found.'}
                        </CommandEmpty>
                        <CommandGroup>
                          {unions.map((union) => (
                            <CommandItem
                              key={union.id}
                              value={union.name}
                              onSelect={() => {
                                setStationForm({...stationForm, union: union.id.toString()});
                                setOpenUnionCombobox(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  stationForm.union === union.id.toString() ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {union.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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

            <div className="space-y-2">
              <Label htmlFor="edit-district">District *</Label>
              <Input
                id="edit-district"
                value={stationForm.district}
                onChange={(e) => setStationForm({...stationForm, district: e.target.value})}
                placeholder="e.g., Accra Metropolitan"
              />
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-manager">Station Manager</Label>
                <Popover modal={true} open={openManagerCombobox} onOpenChange={setOpenManagerCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openManagerCombobox}
                      className="w-full justify-between"
                    >
                      {stationForm.manager
                        ? managers.find((manager) => manager.id.toString() === stationForm.manager)?.fullName
                        : "Select manager..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] p-0 z-[9999]" align="start" side="bottom" sideOffset={5}>
                    <Command>
                      <CommandInput placeholder="Search managers..." />
                      <CommandList>
                        <CommandEmpty>
                          {formOptionsLoading
                            ? 'Loading managers…'
                            : managers.length === 0
                              ? 'No active station managers available.'
                              : 'No manager found.'}
                        </CommandEmpty>
                        <CommandGroup>
                          {managers.map((manager) => (
                            <CommandItem
                              key={manager.id}
                              value={manager.fullName}
                              onSelect={() => {
                                setStationForm({...stationForm, manager: manager.id.toString()});
                                setOpenManagerCombobox(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  stationForm.manager === manager.id.toString() ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {manager.fullName}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-union">Transport Union</Label>
                <Popover modal={true} open={openUnionCombobox} onOpenChange={setOpenUnionCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openUnionCombobox}
                      className="w-full justify-between"
                    >
                      {stationForm.union
                        ? unions.find((union) => union.id.toString() === stationForm.union)?.name
                        : "Select union..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] p-0 z-[9999]" align="start" side="bottom" sideOffset={5}>
                    <Command>
                      <CommandInput placeholder="Search unions..." />
                      <CommandList>
                        <CommandEmpty>
                          {formOptionsLoading
                            ? 'Loading unions…'
                            : unions.length === 0
                              ? 'No active unions available.'
                              : 'No union found.'}
                        </CommandEmpty>
                        <CommandGroup>
                          {unions.map((union) => (
                            <CommandItem
                              key={union.id}
                              value={union.name}
                              onSelect={() => {
                                setStationForm({...stationForm, union: union.id.toString()});
                                setOpenUnionCombobox(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  stationForm.union === union.id.toString() ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {union.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
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
                          <span className="font-medium">{selectedStation?.name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Code:</span>
                          <span>{selectedStation?.code || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <span>{getStatusBadge(selectedStation?.status || 'inactive')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Region:</span>
                          <span>{selectedStation?.region || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Contact Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span>{selectedStation?.email || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span>{selectedStation?.phone || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span>{selectedStation?.address || 'N/A'}</span>
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
                          <span>{selectedStation?.capacity || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Platforms:</span>
                          <span>{selectedStation?.platforms || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Operating Hours:</span>
                          <span>
                            {selectedStation?.operatingHours 
                              ? typeof selectedStation.operatingHours === 'object' 
                                ? `${selectedStation.operatingHours.open} - ${selectedStation.operatingHours.close}`
                                : selectedStation.operatingHours
                              : 'N/A'
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Management</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Station Manager:</span>
                          <span>{selectedStation?.managerName || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Established:</span>
                          <span>{selectedStation?.establishedDate ? new Date(selectedStation.establishedDate).toLocaleDateString() : 'N/A'}</span>
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
                          <span className="text-xl font-bold text-green-600">{selectedStation?.vehicles || 0}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">Currently operational</div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Available Drivers</span>
                          <span className="text-xl font-bold text-[#193cb8]">{selectedStation?.drivers || 0}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">On duty today</div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Daily Trips</span>
                          <span className="text-xl font-bold text-[#193cb8]">{selectedStation?.dailyTrips || 0}</span>
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
                          <span className="text-xl font-bold text-yellow-600">₵{selectedStation?.monthlyRevenue?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">This month</div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Daily Average</span>
                          <span className="text-xl font-bold text-orange-600">₵{selectedStation?.monthlyRevenue ? Math.round(selectedStation.monthlyRevenue / 30).toLocaleString() : '0'}</span>
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
                    {selectedStation?.facilities && selectedStation.facilities.length > 0 ? (
                      selectedStation.facilities.map((facility: string, index: number) => (
                        <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{facility}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground col-span-2">No facilities listed</p>
                    )}
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
                          <Calendar className="h-4 w-4 text-[#193cb8]" />
                          <span className="font-medium">Last Inspection</span>
                        </div>
                        <div className="text-sm">
                          {selectedStation?.lastInspection 
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
                          {selectedStation?.nextInspection 
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Delete Station
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold">{stationToDelete?.name}</span>? This action cannot be undone. All data associated with this station will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteDialog(false);
              setStationToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDelete(stationToDelete?.id)}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Station
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}