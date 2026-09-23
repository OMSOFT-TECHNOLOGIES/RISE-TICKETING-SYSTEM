import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  Clock,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Badge } from './ui/badge';
import { notify } from './utils/notify';
import { driverApi, vehicleApi, parseListResponse } from './utils/api';
import { isGlobalDataScope, listParamsForDataEntry } from './utils/stationScope';
import { useDataEntryStation } from './shared/hooks/useDataEntryStation';
import { DataEntryStationBanner } from './shared/DataEntryStationBanner';
import {
  toDriverApiPayload,
  formatDriverLicenseExpiry,
  driverEmergencyContactLabel,
} from './utils/driverForm';
import { useEntityList } from './shared/hooks/useEntityList';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Textarea } from './ui/textarea';

type DriverRecord = Record<string, unknown>;

type VehicleOption = {
  id: number | string;
  registrationNumber: string;
  make?: string;
  model?: string;
  driverId?: string;
};

function formatVehicleRefId(id: number | string): string {
  if (typeof id === 'string' && /^VEH/i.test(id)) return id.toUpperCase();
  const numeric = typeof id === 'number' ? id : parseInt(String(id), 10);
  if (Number.isNaN(numeric)) return String(id);
  return `VEH${String(numeric).padStart(3, '0')}`;
}

function vehicleLabelForDriver(
  driver: DriverRecord,
  vehiclesById: Map<string, VehicleOption>
): string {
  const vehicleId = driver.currentVehicleId;
  if (!vehicleId) return 'Unassigned';
  const key = String(vehicleId);
  const vehicle = vehiclesById.get(key) ?? vehiclesById.get(formatVehicleRefId(key));
  if (vehicle) {
    const desc = [vehicle.make, vehicle.model].filter(Boolean).join(' ');
    return desc ? `${vehicle.registrationNumber} (${desc})` : vehicle.registrationNumber;
  }
  return key;
}

const driverStatuses = [
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
  { value: 'on_leave', label: 'On Leave', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'suspended', label: 'Suspended', color: 'bg-red-100 text-red-800' },
  { value: 'training', label: 'In Training', color: 'bg-[#193cb8]/10 text-[#193cb8]' }
];

export function DriverManagement() {
  const { user } = useAuth();
  const isGlobalUser = isGlobalDataScope(user?.role);
  const stationId = user?.stationId;
  const dataEntry = useDataEntryStation();

  const fetchDrivers = useCallback(
    () => driverApi.getAll(listParamsForDataEntry(user, dataEntry.effectiveStationId, { limit: 200 })),
    [user, dataEntry.effectiveStationId]
  );

  const {
    items: drivers,
    loading,
    error,
    refresh,
    isSubmitting,
    setIsSubmitting,
  } = useEntityList<DriverRecord>({
    fetchFn: fetchDrivers,
    entityKey: 'drivers',
    errorMessage: 'Failed to load drivers',
  });

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
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DriverRecord | null>(null);
  const [assigningDriver, setAssigningDriver] = useState<DriverRecord | null>(null);
  const [assignVehicleId, setAssignVehicleId] = useState('');
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [editDriver, setEditDriver] = useState({
    name: '',
    phone: '',
    email: '',
    licenseNumber: '',
    licenseExpiry: '',
    experience: '',
    address: '',
    emergencyContact: '',
    status: 'active',
  });

  const userDrivers = isGlobalUser ? drivers : drivers.filter((d) => d.stationId === user?.stationId);

  const loadVehicles = useCallback(async () => {
    try {
      setVehiclesLoading(true);
      const response = await vehicleApi.getAll(
        listParamsForDataEntry(user, dataEntry.effectiveStationId, { limit: 200 })
      );
      if (response.success && response.data) {
        const list = parseListResponse<VehicleOption>(response.data, 'vehicles');
        setVehicles(list);
      } else {
        setVehicles([]);
      }
    } catch {
      setVehicles([]);
    } finally {
      setVehiclesLoading(false);
    }
  }, [user, dataEntry.effectiveStationId]);

  useEffect(() => {
    void loadVehicles();
  }, [loadVehicles]);

  const vehiclesById = useMemo(() => {
    const map = new Map<string, VehicleOption>();
    for (const vehicle of vehicles) {
      map.set(formatVehicleRefId(vehicle.id), vehicle);
      map.set(String(vehicle.id), vehicle);
    }
    return map;
  }, [vehicles]);

  const openEditDriver = (driver: DriverRecord) => {
    setEditingDriver(driver);
    setEditDriver({
      name: String(driver.name ?? ''),
      phone: String(driver.phone ?? ''),
      email: String(driver.email ?? ''),
      licenseNumber: String(driver.licenseNumber ?? ''),
      licenseExpiry: driver.licenseExpiry ? String(driver.licenseExpiry).slice(0, 10) : '',
      experience: driver.experience != null ? String(driver.experience) : '',
      address: String(driver.address ?? ''),
      emergencyContact: driverEmergencyContactLabel(driver),
      status: String(driver.status ?? 'active'),
    });
    setShowEditDialog(true);
  };

  const openAssignVehicle = (driver: DriverRecord) => {
    setAssigningDriver(driver);
    setAssignVehicleId(
      driver.currentVehicleId ? formatVehicleRefId(String(driver.currentVehicleId)) : ''
    );
    setShowAssignDialog(true);
    void loadVehicles();
  };

  const handleUpdateDriver = async () => {
    if (!editingDriver?.id) return;
    if (!editDriver.name || !editDriver.phone || !editDriver.licenseNumber) {
      notify.error('Name, phone, and license number are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await driverApi.update(
        String(editingDriver.id),
        toDriverApiPayload({
          ...editDriver,
          licenseNumber: editDriver.licenseNumber,
        })
      );

      if (response.success) {
        notify.success('Driver updated successfully');
        setShowEditDialog(false);
        setEditingDriver(null);
        await refresh();
      } else {
        notify.error(response.error ?? 'Failed to update driver');
      }
    } catch {
      notify.error('Failed to update driver');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignVehicle = async () => {
    if (!assigningDriver?.id) return;

    const selectedVehicle = vehicles.find(
      (v) =>
        formatVehicleRefId(v.id) === assignVehicleId ||
        String(v.id) === assignVehicleId
    );

    if (!assignVehicleId || assignVehicleId === '__none__') {
      const currentVehicleId = assigningDriver.currentVehicleId;
      if (!currentVehicleId) {
        notify.error('No vehicle is assigned to this driver');
        return;
      }
      const currentVehicle = vehicles.find(
        (v) =>
          formatVehicleRefId(v.id) === String(currentVehicleId) ||
          String(v.id) === String(currentVehicleId)
      );
      if (!currentVehicle) {
        notify.error('Could not resolve the current vehicle assignment');
        return;
      }
      setIsSubmitting(true);
      try {
        const response = await vehicleApi.assignDriver(currentVehicle.id, null);
        if (response.success) {
          notify.success('Vehicle unassigned');
          setShowAssignDialog(false);
          await refresh();
        } else {
          notify.error(response.error ?? 'Failed to unassign vehicle');
        }
      } catch {
        notify.error('Failed to unassign vehicle');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!selectedVehicle) {
      notify.error('Please select a vehicle');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await vehicleApi.assignDriver(
        selectedVehicle.id,
        String(assigningDriver.id)
      );
      if (response.success) {
        notify.success('Vehicle assigned successfully');
        setShowAssignDialog(false);
        await refresh();
      } else {
        notify.error(response.error ?? 'Failed to assign vehicle');
      }
    } catch {
      notify.error('Failed to assign vehicle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddDriver = async () => {
    if (!newDriver.name || !newDriver.phone || !newDriver.licenseNumber) {
      notify.error('Please fill in all required driver fields');
      return;
    }

    const sid = dataEntry.requireStationId();
    if (!sid) return;

    setIsSubmitting(true);
    try {
      const response = await driverApi.create(
        toDriverApiPayload({
          ...newDriver,
          stationId: sid,
        })
      );

      if (response.success) {
        setNewDriver({
          name: '',
          phone: '',
          email: '',
          licenseNumber: '',
          licenseExpiry: '',
          experience: '',
          address: '',
          emergencyContact: '',
        });
        setShowAddDialog(false);
        notify.success(`Driver ${newDriver.name} added successfully`);
        await refresh();
      } else {
        notify.error(response.error ?? 'Failed to register driver');
      }
    } catch {
      notify.error('Failed to register driver');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = driverStatuses.find(s => s.value === status);
    return (
      <Badge className={statusInfo?.color || 'bg-gray-100 text-gray-800'}>
        {statusInfo?.label || status}
      </Badge>
    );
  };

  const getLicenseStatus = (expiry: unknown) => {
    if (!expiry) {
      return <Badge className="bg-gray-100 text-gray-800">Not set</Badge>;
    }
    const expiryDate = new Date(String(expiry).slice(0, 10));
    if (Number.isNaN(expiryDate.getTime())) {
      return <Badge className="bg-gray-100 text-gray-800">Not set</Badge>;
    }
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (daysUntilExpiry < 0) {
      return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
    }
    if (daysUntilExpiry < 30) {
      return <Badge className="bg-yellow-100 text-yellow-800">Expiring Soon</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800">Valid</Badge>;
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
            <p>{driver.experience != null ? `${driver.experience} years` : '—'}</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Rating</p>
            <p>⭐ {driver.rating}/5.0</p>
          </div>
        </div>

        <div className="text-sm">
          <p className="font-medium text-gray-700">Assigned Vehicle</p>
          <p>{vehicleLabelForDriver(driver, vehiclesById)}</p>
        </div>

        {isGlobalUser && (
          <div className="text-sm">
            <p className="font-medium text-gray-700">Station</p>
            <p>{driver.stationName}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm">
            <div className="flex items-center space-x-1">
              <Car className="h-4 w-4 text-[#193cb8]" />
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
            <Button variant="outline" size="sm" onClick={() => openEditDriver(driver)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => openAssignVehicle(driver)}>
              <Car className="h-4 w-4" />
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
        <p className="text-muted-foreground">Loading drivers...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {dataEntry.needsPicker && (
        <DataEntryStationBanner
          stationId={dataEntry.stationId}
          onStationIdChange={dataEntry.setStationId}
          stations={dataEntry.stations}
          loading={dataEntry.loading}
          loadError={dataEntry.loadError}
          onRetry={() => void dataEntry.reloadStations()}
        />
      )}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {isGlobalUser ? 'All Drivers' : 'My Drivers'}
          </h1>
          <p className="text-gray-600">
            {isGlobalUser 
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
              <Button onClick={handleAddDriver} className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Registering...
                  </>
                ) : (
                  'Register Driver'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Driver Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <UserCheck className="h-8 w-8 mx-auto mb-2 text-[#193cb8]" />
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
                  {isGlobalUser && <TableHead>Station</TableHead>}
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
                    <TableCell>{vehicleLabelForDriver(driver, vehiclesById)}</TableCell>
                    <TableCell>⭐ {driver.rating}/5.0</TableCell>
                    {isGlobalUser && <TableCell>{driver.stationName}</TableCell>}
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
                        <Button variant="outline" size="sm" onClick={() => openEditDriver(driver)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openAssignVehicle(driver)}>
                          <Car className="h-4 w-4" />
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

      {/* Edit Driver Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Driver</DialogTitle>
            <DialogDescription>Update driver profile and status</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={editDriver.name}
                onChange={(e) => setEditDriver({ ...editDriver, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editDriver.phone}
                  onChange={(e) => setEditDriver({ ...editDriver, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editDriver.email}
                  onChange={(e) => setEditDriver({ ...editDriver, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-license">License Number</Label>
                <Input
                  id="edit-license"
                  value={editDriver.licenseNumber}
                  onChange={(e) => setEditDriver({ ...editDriver, licenseNumber: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-license-expiry">License Expiry</Label>
                <Input
                  id="edit-license-expiry"
                  type="date"
                  value={editDriver.licenseExpiry}
                  onChange={(e) => setEditDriver({ ...editDriver, licenseExpiry: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-experience">Experience (years)</Label>
                <Input
                  id="edit-experience"
                  type="number"
                  value={editDriver.experience}
                  onChange={(e) => setEditDriver({ ...editDriver, experience: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editDriver.status}
                  onValueChange={(value) => setEditDriver({ ...editDriver, status: value })}
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {driverStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-address">Address</Label>
              <Textarea
                id="edit-address"
                value={editDriver.address}
                onChange={(e) => setEditDriver({ ...editDriver, address: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-emergency">Emergency Contact</Label>
              <Input
                id="edit-emergency"
                value={editDriver.emergencyContact}
                onChange={(e) => setEditDriver({ ...editDriver, emergencyContact: e.target.value })}
              />
            </div>
            <Button onClick={handleUpdateDriver} className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Vehicle Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Vehicle</DialogTitle>
            <DialogDescription>
              Link {assigningDriver?.name ? String(assigningDriver.name) : 'driver'} to a station vehicle
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Vehicle</Label>
              <Select
                value={assignVehicleId || undefined}
                onValueChange={setAssignVehicleId}
                disabled={vehiclesLoading || isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={vehiclesLoading ? 'Loading vehicles...' : 'Select vehicle'}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Unassigned</SelectItem>
                  {vehicles.map((vehicle) => (
                    <SelectItem
                      key={String(vehicle.id)}
                      value={formatVehicleRefId(vehicle.id)}
                    >
                      {vehicle.registrationNumber} — {vehicle.make} {vehicle.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAssignVehicle} className="w-full" disabled={isSubmitting || vehiclesLoading}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Assignment'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
                  <p className="font-medium text-gray-700">License Expiry</p>
                  <p>{formatDriverLicenseExpiry(selectedDriver.licenseExpiry)}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Experience</p>
                  <p>
                    {selectedDriver.experience != null
                      ? `${selectedDriver.experience} years`
                      : 'Not set'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700">Join Date</p>
                  <p>
                    {selectedDriver.joinDate || selectedDriver.hireDate
                      ? formatDriverLicenseExpiry(
                          selectedDriver.joinDate ?? selectedDriver.hireDate
                        )
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">License Number</p>
                  <p>{selectedDriver.licenseNumber ?? '—'}</p>
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
                <p>{driverEmergencyContactLabel(selectedDriver) || 'Not set'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}