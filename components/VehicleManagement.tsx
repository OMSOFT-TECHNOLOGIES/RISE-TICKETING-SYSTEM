import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from './AuthContext';
import { vehicleApi, driverApi, parseListResponse, formatApiError } from './utils/api';
import { isGlobalDataScope } from './utils/stationScope';
import { formatStationRefId } from './utils/stationPicker';
import {
  deferListUntilStationPicked,
  emptyPaginatedListPayload,
  listParamsForDataEntry,
} from './utils/stationScope';
import { useDataEntryStation } from './shared/hooks/useDataEntryStation';
import { DataEntryStationBanner } from './shared/DataEntryStationBanner';
import { notify } from './utils/notify';
import {
  Bus,
  Plus,
  Edit,
  Eye,
  Calendar,
  Settings,
  CheckCircle,
  Loader2,
  RefreshCw,
  Search,
  MoreHorizontal,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { usePageAction } from './context/PageActionContext';
import { usePaginatedEntityList } from './shared/hooks/usePaginatedEntityList';
import { TablePagination } from './shared/TablePagination';
import { ScrollableTable } from './shared/ScrollableTable';
import { PageHeader } from './shared/PageHeader';
import { DashboardStatCard } from './Dashboard/DashboardStatCard';
import { RisePreloader, RiseStatusAlert } from './shared/feedback';
import { RegisterVehicleDialog } from './VehicleManagement/RegisterVehicleDialog';
import { fuelTypes, vehicleMakes, vehicleStatusOptions } from './VehicleManagement/vehicleFormConstants';

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

function formatServiceDate(value: unknown): string {
  if (value == null || value === '') return '—';
  const d = new Date(value as string | number | Date);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString();
}

export function VehicleManagement() {
  const { user } = useAuth();
  const { pendingAction, clearAction } = usePageAction();
  const dataEntry = useDataEntryStation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchVehiclesPage = useCallback(
    (page: number, limit: number) => {
      if (deferListUntilStationPicked(user, dataEntry.stationId)) {
        return Promise.resolve({
          success: true,
          data: emptyPaginatedListPayload('vehicles', limit),
        });
      }
      return vehicleApi.getAll(
        listParamsForDataEntry(user, dataEntry.effectiveStationId, {
          page,
          limit,
          search: searchTerm.trim() || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        })
      );
    },
    [user, dataEntry.stationId, dataEntry.effectiveStationId, searchTerm, statusFilter]
  );

  const {
    items: vehicles,
    loading,
    error,
    refresh,
    isSubmitting,
    setIsSubmitting,
    page,
    setPage,
    pagination,
    pageSize,
    setPageSize,
  } = usePaginatedEntityList<any>({
    fetchFn: fetchVehiclesPage,
    entityKey: 'vehicles',
    errorMessage: 'Failed to load vehicles',
    resetPageDeps: [dataEntry.effectiveStationId, searchTerm, statusFilter],
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
      const response = await driverApi.getAvailable(
        params?.stationId ? { stationId: params.stationId } : undefined
      );
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

  const totalVehicles = pagination?.totalItems ?? userVehicles.length;
  const activeCount = userVehicles.filter((v) => v.status === 'active').length;
  const maintenanceCount = userVehicles.filter((v) => v.status === 'maintenance').length;
  const unassignedCount = userVehicles.filter((v) => !v.driverName && !v.driverId).length;

  const pageDescription = isGlobalUser
    ? 'Fleet registry, assignments, and maintenance status across RISE stations.'
    : `Vehicles for ${user?.stationName ?? 'your station'} — registration, drivers, and service dates.`;

  const awaitingStationPick =
    dataEntry.needsPicker && deferListUntilStationPicked(user, dataEntry.stationId);

  const VehicleCard = ({ vehicle }: { vehicle: any }) => (
    <Card className="rounded-xl ring-1 ring-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bus className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate font-mono">{vehicle.registrationNumber}</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground truncate">
              {vehicle.make} {vehicle.model} ({vehicle.year})
            </p>
          </div>
          {getStatusBadge(vehicle.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-muted-foreground">Capacity</p>
            <p>{vehicle.capacity} seats</p>
          </div>
          <div>
            <p className="font-medium text-muted-foreground">Fuel</p>
            <p>{vehicle.fuelType}</p>
          </div>
          <div>
            <p className="font-medium text-muted-foreground">Mileage</p>
            <p>{formatMileage(vehicle.mileage)}</p>
          </div>
          <div>
            <p className="font-medium text-muted-foreground">Driver</p>
            <p>{vehicle.driverName || 'Unassigned'}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <Calendar className="h-4 w-4 text-primary" />
            <span>Next service: {formatServiceDate(vehicle.nextMaintenance)}</span>
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

  if (loading && userVehicles.length === 0 && !error && !awaitingStationPick) {
    return (
      <div className="p-6 min-h-[420px] rise-dashboard-page">
        <RisePreloader variant="page" label="Loading vehicles…" />
      </div>
    );
  }

  return (
    <div className="min-h-full rise-dashboard-page">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {dataEntry.needsPicker && (
        <DataEntryStationBanner
          stationId={dataEntry.stationId}
          onStationIdChange={dataEntry.setStationId}
          stations={dataEntry.stations}
          loading={dataEntry.loading}
          loadError={dataEntry.loadError}
          onRetry={() => void dataEntry.reloadStations()}
          description={dataEntry.pickerDescription}
        />
      )}

      <PageHeader
        title="Vehicle management"
        description={pageDescription}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refresh({ toastOnError: true })}
              disabled={loading || awaitingStationPick}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              className="shadow-sm"
              disabled={awaitingStationPick}
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Register vehicle
            </Button>
          </>
        }
      />

      {error ? (
        <RiseStatusAlert type="error" title="Could not load vehicles">
          {error}
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => void refresh({ toastOnError: true })}
          >
            Try again
          </Button>
        </RiseStatusAlert>
      ) : null}

      {!awaitingStationPick ? (
        <section className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-4 sm:p-5 ring-1 ring-border/40">
          <h2 className="text-sm font-semibold tracking-tight mb-4">Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            <DashboardStatCard
              title="Vehicles"
              value={totalVehicles}
              icon={Bus}
              accent="blue"
              hint="Total in registry"
            />
            <DashboardStatCard
              title="Active"
              value={activeCount}
              icon={CheckCircle}
              accent="emerald"
              hint="On this page"
            />
            <DashboardStatCard
              title="Maintenance"
              value={maintenanceCount}
              icon={Settings}
              accent="amber"
              hint="On this page"
            />
            <DashboardStatCard
              title="No driver"
              value={unassignedCount}
              icon={UserCheck}
              accent="violet"
              hint="On this page"
            />
          </div>
        </section>
      ) : null}

      <Card className="rounded-2xl shadow-sm ring-1 ring-border/50 overflow-hidden">
        <CardHeader className="space-y-4 border-b border-border/60 bg-muted/20 pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Vehicle registry</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {awaitingStationPick
                  ? 'Select a station above to load vehicles'
                  : `${totalVehicles} vehicle${totalVehicles === 1 ? '' : 's'} · search and filter`}
              </p>
            </div>
            {!awaitingStationPick ? (
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto lg:min-w-[420px]">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Plate, make, model…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-10 bg-background/80"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-10 w-full sm:w-[150px] bg-background/80">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All status</SelectItem>
                    {vehicleStatusOptions.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className={loading ? 'opacity-60 pointer-events-none transition-opacity' : ''}>
            {awaitingStationPick ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                Pick a station to view and register vehicles for that terminal.
              </div>
            ) : userVehicles.length === 0 ? (
              <div className="py-16 text-center">
                <Bus className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm font-medium">No vehicles found</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  {searchTerm.trim() || statusFilter !== 'all'
                    ? 'Adjust filters or clear search.'
                    : 'Register a vehicle to add it to the fleet.'}
                </p>
                {!searchTerm.trim() && statusFilter === 'all' ? (
                  <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Register vehicle
                  </Button>
                ) : null}
              </div>
            ) : (
              <>
                <div className="hidden lg:block">
                  <ScrollableTable
                    className="border-0 shadow-none ring-0"
                    maxHeightClass="max-h-[min(70vh,560px)]"
                    minWidthClass="min-w-[960px]"
                  >
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead>Registration</TableHead>
                          <TableHead>Vehicle</TableHead>
                          <TableHead>Capacity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Driver</TableHead>
                          <TableHead>Next service</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userVehicles.map((vehicle) => (
                          <TableRow key={vehicle.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                  <Bus className="h-4 w-4" />
                                </span>
                                <p className="font-medium font-mono text-sm">
                                  {vehicle.registrationNumber}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm font-medium">
                                {vehicle.make} {vehicle.model}
                              </p>
                              <p className="text-xs text-muted-foreground">{vehicle.year}</p>
                            </TableCell>
                            <TableCell className="tabular-nums text-sm">
                              {vehicle.capacity}
                            </TableCell>
                            <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                            <TableCell className="text-sm max-w-[140px] truncate">
                              {vehicle.driverName || 'Unassigned'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatServiceDate(vehicle.nextMaintenance)}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewVehicle(vehicle)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditClick(vehicle)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit vehicle
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openAssignDriver(vehicle)}>
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Assign driver
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
                  </ScrollableTable>
                </div>
                <div className="lg:hidden grid grid-cols-1 gap-3">
                  {userVehicles.map((vehicle) => (
                    <VehicleCard key={vehicle.id} vehicle={vehicle} />
                  ))}
                </div>
              </>
            )}
          </div>
          {!awaitingStationPick ? (
            <TablePagination
              page={page}
              pagination={pagination}
              onPageChange={setPage}
              loading={loading}
              itemLabel="vehicles"
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              alwaysShow
            />
          ) : null}
        </CardContent>
      </Card>

      <RegisterVehicleDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        form={newVehicle}
        onFormChange={(patch) => setNewVehicle((prev) => ({ ...prev, ...patch }))}
        onSubmit={() => void handleAddVehicle()}
        isSubmitting={isSubmitting}
        showStationPicker={dataEntry.needsPicker || isGlobalUser}
        registerStationId={registerStationId}
        onRegisterStationIdChange={setRegisterStationId}
        stations={dataEntry.stations}
      />

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
                  <p className="font-medium">{formatServiceDate(selectedVehicle.lastMaintenance)}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Next Maintenance</Label>
                  <p className="font-medium">{formatServiceDate(selectedVehicle.nextMaintenance)}</p>
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
                    {vehicleStatusOptions.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
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
    </div>
  );
}