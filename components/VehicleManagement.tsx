import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from './AuthContext';
import { vehicleApi, driverApi, parseListResponse, formatApiError } from './utils/api';
import { StationFormSelect } from './shared/StationFormSelect';
import { isGlobalDataScope } from './utils/stationScope';
import { formatStationRefId } from './utils/stationPicker';
import { listParamsForDataEntry } from './utils/stationScope';
import { useDataEntryStation } from './shared/hooks/useDataEntryStation';
import { DataEntryStationBanner } from './shared/DataEntryStationBanner';
import { notify } from './utils/notify';
import { Loader2 } from 'lucide-react';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { MoreHorizontal, Trash2, UserCheck } from 'lucide-react';
import { usePageAction } from './context/PageActionContext';
import { usePaginatedEntityList } from './shared/hooks/usePaginatedEntityList';
import { TablePagination } from './shared/TablePagination';

const vehicleMakes = ['Hyundai', 'Tata', 'Mercedes', 'Isuzu', 'Toyota', 'Ford', 'Volkswagen'];
const fuelTypes = ['Diesel', 'Petrol', 'CNG', 'Electric'];

function parseOptionalMileage(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return Math.floor(parsed);
}

function formatMileage(value: unknown): string {
  if (value == null || value === '') return 'Not recorded';
  const n = Number(value);
  if (!Number.isFinite(n)) return 'Not recorded';
  return `${n.toLocaleString()} km`;
}

export function VehicleManagement() {
  const { user } = useAuth();
  const { pendingAction, clearAction } = usePageAction();
  const dataEntry = useDataEntryStation();

  const fetchVehiclesPage = useCallback(
    (page: number, limit: number) =>
      vehicleApi.getAll(
        listParamsForDataEntry(user, dataEntry.effectiveStationId, { page, limit })
      ),
    [user, dataEntry.effectiveStationId]
  );

  const {
    items: vehicles,
    loading,
    refresh,
    isSubmitting,
    setIsSubmitting,
    page,
    setPage,
    pagination,
  } = usePaginatedEntityList<any>({
    fetchFn: fetchVehiclesPage,
    entityKey: 'vehicles',
    errorMessage: 'Failed to load vehicles',
  });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [registerStationId, setRegisterStationId] = useState('');
  const isGlobalUser = isGlobalDataScope(user?.role);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAssignDriverDialog, setShowAssignDriverDialog] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [assignDriverId, setAssignDriverId] = useState('');
  const [availableDrivers, setAvailableDrivers] = useState<
    Array<{ id: string; name: string; licenseNumber?: string }>
  >([]);
  const [driversLoading, setDriversLoading] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    registrationNumber: '',
    make: '',
    model: '',
    year: '',
    capacity: '',
    fuelType: '',
    mileage: '',
  });
  const [editVehicle, setEditVehicle] = useState({
    registrationNumber: '',
    make: '',
    model: '',
    year: '',
    capacity: '',
    fuelType: '',
    status: '',
    mileage: '',
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const userVehicles = vehicles;

  useEffect(() => {
    if (pendingAction === 'new-vehicle') {
      setShowAddDialog(true);
      clearAction();
    }
  }, [pendingAction, clearAction]);

  useEffect(() => {
    if (!showAddDialog) return;
    const sid =
      dataEntry.effectiveStationId || formatStationRefId(user?.stationId) || '';
    setRegisterStationId(sid);
  }, [showAddDialog, dataEntry.effectiveStationId, user?.stationId]);

  const handleAddVehicle = async () => {
    const sid =
      dataEntry.needsPicker || isGlobalUser
        ? registerStationId
        : dataEntry.effectiveStationId || formatStationRefId(user?.stationId);
    if (!sid) {
      notify.error('Select a station for this vehicle');
      return;
    }

    if (
      !newVehicle.registrationNumber.trim() ||
      !newVehicle.make ||
      !newVehicle.model.trim() ||
      !newVehicle.year ||
      !newVehicle.capacity ||
      !newVehicle.fuelType
    ) {
      notify.error('Please complete registration number, make, model, year, capacity, and fuel type');
      return;
    }

    const mileage = parseOptionalMileage(newVehicle.mileage);
    if (newVehicle.mileage.trim() && mileage === undefined) {
      notify.error('Enter a valid mileage or leave the field blank');
      return;
    }

    try {
      setIsSubmitting(true);

      const vehicleData: Record<string, unknown> = {
        registrationNumber: newVehicle.registrationNumber.trim(),
        make: newVehicle.make,
        model: newVehicle.model.trim(),
        year: parseInt(newVehicle.year, 10),
        capacity: parseInt(newVehicle.capacity, 10),
        fuelType: newVehicle.fuelType,
        stationId: sid,
      };
      if (mileage !== undefined) {
        vehicleData.mileage = mileage;
      }

      const response = await vehicleApi.create(vehicleData);
      
      if (response.success) {
        notify.success('Vehicle registered successfully');
        setNewVehicle({
          registrationNumber: '',
          make: '',
          model: '',
          year: '',
          capacity: '',
          fuelType: '',
          mileage: '',
        });
        setShowAddDialog(false);
        void refresh(); // Reload vehicles list
      } else {
        notify.error(formatApiError(response.error, 'Failed to register vehicle'));
      }
    } catch (error: any) {
      console.error('Error adding vehicle:', error);
      notify.error(error.message || 'Failed to register vehicle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewVehicle = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setShowViewDialog(true);
  };

  const loadDriversForAssign = async () => {
    try {
      setDriversLoading(true);
      const params = listParamsForDataEntry(user, dataEntry.effectiveStationId);
      const response = await driverApi.getAvailable(params?.stationId);
      if (response.success && response.data) {
        const list = Array.isArray(response.data)
          ? response.data
          : parseListResponse(response.data, 'drivers');
        setAvailableDrivers(
          list.map((d: { id: string; name: string; licenseNumber?: string }) => ({
            id: String(d.id),
            name: String(d.name),
            licenseNumber: d.licenseNumber,
          }))
        );
      } else {
        setAvailableDrivers([]);
      }
    } catch {
      setAvailableDrivers([]);
    } finally {
      setDriversLoading(false);
    }
  };

  const openAssignDriver = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setAssignDriverId(vehicle.driverId ? String(vehicle.driverId) : '__none__');
    setShowAssignDriverDialog(true);
    void loadDriversForAssign();
  };

  const handleAssignDriver = async () => {
    if (!selectedVehicle) return;

    setIsSubmitting(true);
    try {
      const driverId =
        !assignDriverId || assignDriverId === '__none__' ? null : assignDriverId;
      const response = await vehicleApi.assignDriver(selectedVehicle.id, driverId);

      if (response.success) {
        notify.success(driverId ? 'Driver assigned successfully' : 'Driver unassigned');
        setShowAssignDriverDialog(false);
        void refresh();
      } else {
        notify.error(response.error || 'Failed to assign driver');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to assign driver';
      notify.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setEditVehicle({
      registrationNumber: vehicle.registrationNumber,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year.toString(),
      capacity: vehicle.capacity.toString(),
      fuelType: vehicle.fuelType,
      status: vehicle.status,
      mileage:
        vehicle.mileage != null && vehicle.mileage !== ''
          ? String(vehicle.mileage)
          : '',
    });
    setShowEditDialog(true);
  };

  const handleUpdateVehicle = async () => {
    if (!selectedVehicle) return;

    const mileage = parseOptionalMileage(editVehicle.mileage);
    if (editVehicle.mileage.trim() && mileage === undefined) {
      notify.error('Enter a valid mileage or leave the field blank');
      return;
    }

    try {
      setIsSubmitting(true);

      const vehicleData: Record<string, unknown> = {
        registrationNumber: editVehicle.registrationNumber,
        make: editVehicle.make,
        model: editVehicle.model,
        year: parseInt(editVehicle.year, 10),
        capacity: parseInt(editVehicle.capacity, 10),
        fuelType: editVehicle.fuelType,
        status: editVehicle.status,
      };
      if (mileage !== undefined) {
        vehicleData.mileage = mileage;
      }

      const response = await vehicleApi.update(selectedVehicle.id, vehicleData);
      
      if (response.success) {
        notify.success('Vehicle updated successfully');
        setShowEditDialog(false);
        void refresh();
      } else {
        notify.error(response.error || 'Failed to update vehicle');
      }
    } catch (error: any) {
      console.error('Error updating vehicle:', error);
      notify.error(error.message || 'Failed to update vehicle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setShowDeleteDialog(true);
  };

  const handleDeleteVehicle = async () => {
    if (!selectedVehicle) return;
    
    try {
      setIsSubmitting(true);
      const response = await vehicleApi.delete(selectedVehicle.id);
      
      if (response.success) {
        notify.success('Vehicle deleted successfully');
        setShowDeleteDialog(false);
        void refresh();
      } else {
        notify.error(response.error || 'Failed to delete vehicle');
      }
    } catch (error: any) {
      console.error('Error deleting vehicle:', error);
      notify.error(error.message || 'Failed to delete vehicle');
    } finally {
      setIsSubmitting(false);
    }
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
            <p>{formatMileage(vehicle.mileage)}</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Current Driver</p>
            <p>{vehicle.driverName || 'Unassigned'}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm">
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" style={{ color: '#193cb8' }} />
              <span>Next service: {new Date(vehicle.nextMaintenance).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => handleEditClick(vehicle)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleViewVehicle(vehicle)}>
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#193cb8' }} />
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
                Register vehicle details now. Mileage is optional. Assign a driver later from the
                vehicle actions menu.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {(dataEntry.needsPicker || isGlobalUser) && (
                <StationFormSelect
                  value={registerStationId}
                  stations={dataEntry.stations}
                  onChange={setRegisterStationId}
                />
              )}
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
                <Label htmlFor="mileage">Current Mileage (km) — optional</Label>
                <Input
                  id="mileage"
                  type="text"
                  inputMode="numeric"
                  value={newVehicle.mileage}
                  onChange={(e) => setNewVehicle({ ...newVehicle, mileage: e.target.value })}
                  placeholder="Leave blank if unknown"
                />
              </div>
              <Button 
                onClick={handleAddVehicle} 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Registering...
                  </>
                ) : (
                  'Register Vehicle'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Vehicle Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Bus className="h-8 w-8 mx-auto mb-2" style={{ color: '#193cb8' }} />
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
                    <TableCell>{vehicle.driverName || 'Unassigned'}</TableCell>
                    <TableCell>{new Date(vehicle.nextMaintenance).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewVehicle(vehicle)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditClick(vehicle)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Vehicle
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openAssignDriver(vehicle)}>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Assign Driver
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(vehicle)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              page={page}
              pagination={pagination}
              onPageChange={setPage}
              loading={loading}
              itemLabel="vehicles"
            />
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Cards for mobile */}
      <div className="lg:hidden grid grid-cols-1 gap-4">
        {userVehicles.map((vehicle) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} />
        ))}
      </div>

      {/* View Vehicle Details Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vehicle Details</DialogTitle>
            <DialogDescription>
              Complete information for {selectedVehicle?.registrationNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedVehicle && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Registration Number</Label>
                  <p className="font-medium">{selectedVehicle.registrationNumber}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedVehicle.status)}</div>
                </div>
                <div>
                  <Label className="text-gray-600">Make</Label>
                  <p className="font-medium">{selectedVehicle.make}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Model</Label>
                  <p className="font-medium">{selectedVehicle.model}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Year</Label>
                  <p className="font-medium">{selectedVehicle.year}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Capacity</Label>
                  <p className="font-medium">{selectedVehicle.capacity} passengers</p>
                </div>
                <div>
                  <Label className="text-gray-600">Fuel Type</Label>
                  <p className="font-medium">{selectedVehicle.fuelType}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Mileage</Label>
                  <p className="font-medium">{formatMileage(selectedVehicle.mileage)}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Current Driver</Label>
                  <p className="font-medium">{selectedVehicle.driverName || 'Unassigned'}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Last Maintenance</Label>
                  <p className="font-medium">{new Date(selectedVehicle.lastMaintenance).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Next Maintenance</Label>
                  <p className="font-medium">{new Date(selectedVehicle.nextMaintenance).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Vehicle Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Vehicle</DialogTitle>
            <DialogDescription>
              Update vehicle information for {selectedVehicle?.registrationNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-registration">Registration Number</Label>
                <Input
                  id="edit-registration"
                  value={editVehicle.registrationNumber}
                  onChange={(e) => setEditVehicle({...editVehicle, registrationNumber: e.target.value})}
                  placeholder="GV-123-20"
                />
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select value={editVehicle.status} onValueChange={(value) => setEditVehicle({...editVehicle, status: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-make">Make</Label>
                <Select value={editVehicle.make} onValueChange={(value) => setEditVehicle({...editVehicle, make: value})}>
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
                <Label htmlFor="edit-model">Model</Label>
                <Input
                  id="edit-model"
                  value={editVehicle.model}
                  onChange={(e) => setEditVehicle({...editVehicle, model: e.target.value})}
                  placeholder="County"
                />
              </div>
              <div>
                <Label htmlFor="edit-year">Year</Label>
                <Input
                  id="edit-year"
                  type="number"
                  value={editVehicle.year}
                  onChange={(e) => setEditVehicle({...editVehicle, year: e.target.value})}
                  placeholder="2020"
                />
              </div>
              <div>
                <Label htmlFor="edit-capacity">Capacity</Label>
                <Input
                  id="edit-capacity"
                  type="number"
                  value={editVehicle.capacity}
                  onChange={(e) => setEditVehicle({...editVehicle, capacity: e.target.value})}
                  placeholder="35"
                />
              </div>
              <div>
                <Label htmlFor="edit-fuel">Fuel Type</Label>
                <Select value={editVehicle.fuelType} onValueChange={(value) => setEditVehicle({...editVehicle, fuelType: value})}>
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
                <Label htmlFor="edit-mileage">Current Mileage (km) — optional</Label>
                <Input
                  id="edit-mileage"
                  type="text"
                  inputMode="numeric"
                  value={editVehicle.mileage}
                  onChange={(e) => setEditVehicle({ ...editVehicle, mileage: e.target.value })}
                  placeholder="Leave blank if unknown"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateVehicle} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Vehicle'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Driver Dialog */}
      <Dialog open={showAssignDriverDialog} onOpenChange={setShowAssignDriverDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Driver</DialogTitle>
            <DialogDescription>
              Assign a driver to {selectedVehicle?.registrationNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Driver</Label>
              <Select
                value={assignDriverId}
                onValueChange={setAssignDriverId}
                disabled={driversLoading || isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={driversLoading ? 'Loading drivers...' : 'Select driver'}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Unassigned</SelectItem>
                  {availableDrivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.name}
                      {driver.licenseNumber ? ` (${driver.licenseNumber})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAssignDriverDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssignDriver} disabled={isSubmitting || driversLoading}>
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
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vehicle</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete vehicle <strong>{selectedVehicle?.registrationNumber}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteVehicle}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}