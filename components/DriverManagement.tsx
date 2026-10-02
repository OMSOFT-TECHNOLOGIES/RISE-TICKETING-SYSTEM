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
  RefreshCw,
  Search,
} from 'lucide-react';
import { Badge } from './ui/badge';
import { notify } from './utils/notify';
import { driverApi, vehicleApi, parseListResponse } from './utils/api';
import {
  deferListUntilStationPicked,
  emptyPaginatedListPayload,
  isGlobalDataScope,
  listParamsForDataEntry,
} from './utils/stationScope';
import { useDataEntryStation } from './shared/hooks/useDataEntryStation';
import { DataEntryStationBanner } from './shared/DataEntryStationBanner';
import { formatStationRefId } from './utils/stationPicker';
import {
  toDriverApiPayload,
  formatDriverLicenseExpiry,
  driverEmergencyContactLabel,
} from './utils/driverForm';
import { usePaginatedEntityList } from './shared/hooks/usePaginatedEntityList';
import { TablePagination } from './shared/TablePagination';
import { ScrollableTable } from './shared/ScrollableTable';
import { PageHeader } from './shared/PageHeader';
import { DashboardStatCard } from './Dashboard/DashboardStatCard';
import { RisePreloader, RiseStatusAlert } from './shared/feedback';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { RegisterDriverDialog } from './DriverManagement/RegisterDriverDialog';
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
  stationId?: string | number;
};

function formatVehicleRefId(id: number | string): string {
  if (typeof id === 'string' && /^VEH/i.test(id)) return id.toUpperCase();
  const numeric = typeof id === 'number' ? id : parseInt(String(id), 10);
  if (Number.isNaN(numeric)) return String(id);
  return `VEH${String(numeric).padStart(3, '0')}`;
}

function driverStationLabel(
  driver: DriverRecord,
  stationNameById: Map<string, string>
): string {
  const name = driver.stationName;
  if (name != null && String(name).trim()) {
    return String(name);
  }
  const sid = formatStationRefId(driver.stationId);
  if (sid && stationNameById.has(sid)) {
    return stationNameById.get(sid)!;
  }
  if (sid) return sid;
  return '—';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchDrivers = useCallback(
    (page: number, limit: number) => {
      if (deferListUntilStationPicked(user, dataEntry.stationId)) {
        return Promise.resolve({
          success: true,
          data: emptyPaginatedListPayload('drivers', limit),
        });
      }
      return driverApi.getAll(
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
    items: drivers,
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
  } = usePaginatedEntityList<DriverRecord>({
    fetchFn: fetchDrivers,
    entityKey: 'drivers',
    errorMessage: 'Failed to load drivers',
    resetPageDeps: [dataEntry.effectiveStationId, searchTerm, statusFilter],
  });

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [registerStationId, setRegisterStationId] = useState('');
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
    emergencyContact: '',
    vehicleId: '',
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

  const stationNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const station of dataEntry.stations) {
      map.set(station.id, station.name);
    }
    return map;
  }, [dataEntry.stations]);

  const registerVehicleOptions = useMemo(() => {
    const sid = registerStationId || formatStationRefId(user?.stationId);
    if (!sid) return vehicles;
    return vehicles.filter((v) => {
      const matchesStation = formatStationRefId(v.stationId) === sid;
      const unassigned = !v.driverId;
      return matchesStation && unassigned;
    });
  }, [vehicles, registerStationId, user?.stationId]);

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

  useEffect(() => {
    if (!showAddDialog) return;
    const defaultStation =
      dataEntry.effectiveStationId || formatStationRefId(user?.stationId ?? '');
    if (defaultStation && !registerStationId) {
      setRegisterStationId(defaultStation);
    }
  }, [showAddDialog, dataEntry.effectiveStationId, user?.stationId, registerStationId]);

  useEffect(() => {
    if (!showAddDialog) return;
    const sid =
      dataEntry.effectiveStationId || formatStationRefId(user?.stationId) || '';
    setRegisterStationId(sid);
  }, [showAddDialog, dataEntry.effectiveStationId, user?.stationId]);

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

    const sid =
      dataEntry.needsPicker || isGlobalUser
        ? registerStationId
        : dataEntry.effectiveStationId || formatStationRefId(user?.stationId);
    if (!sid) {
      notify.error('Select a station for this driver');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await driverApi.create(
        toDriverApiPayload({
          ...newDriver,
          stationId: sid,
          vehicleId: newDriver.vehicleId || undefined,
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
          vehicleId: '',
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

  const totalDrivers = pagination?.totalItems ?? drivers.length;
  const activeCount = drivers.filter((d) => d.status === 'active').length;
  const onLeaveCount = drivers.filter((d) => d.status === 'on_leave').length;
  const expiringCount = drivers.filter((d) => {
    if (!d.licenseExpiry) return false;
    const expiryDate = new Date(String(d.licenseExpiry).slice(0, 10));
    if (Number.isNaN(expiryDate.getTime())) return false;
    const days = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 3600 * 24));
    return days < 30;
  }).length;

  const pageDescription = isGlobalUser
    ? 'Licenses, assignments, and compliance across the RISE driver roster.'
    : `Drivers for ${user?.stationName ?? 'your station'} — registration, vehicles, and status.`;

  const awaitingStationPick =
    dataEntry.needsPicker && deferListUntilStationPicked(user, dataEntry.stationId);

  const DriverCard = ({ driver }: { driver: any }) => (
    <Card className="rounded-xl ring-1 ring-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCheck className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">{String(driver.name ?? '')}</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground font-mono truncate">{String(driver.id ?? '')}</p>
          </div>
          {getStatusBadge(String(driver.status ?? ''))}
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

        <div className="text-sm">
          <p className="font-medium text-gray-700">Station</p>
          <p>{driverStationLabel(driver, stationNameById)}</p>
        </div>

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

  if (loading && drivers.length === 0 && !error && !awaitingStationPick) {
    return (
      <div className="p-6 min-h-[420px] rise-dashboard-page">
        <RisePreloader variant="page" label="Loading drivers…" />
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
        title="Driver management"
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
              Register driver
            </Button>
          </>
        }
      />

      {error ? (
        <RiseStatusAlert type="error" title="Could not load drivers">
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
              title="Drivers"
              value={totalDrivers}
              icon={UserCheck}
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
              title="On leave"
              value={onLeaveCount}
              icon={Clock}
              accent="amber"
              hint="On this page"
            />
            <DashboardStatCard
              title="License ≤30 days"
              value={expiringCount}
              icon={AlertTriangle}
              accent="violet"
              hint="Renewal attention"
            />
          </div>
        </section>
      ) : null}

      <Card className="rounded-2xl shadow-sm ring-1 ring-border/50 overflow-hidden">
        <CardHeader className="space-y-4 border-b border-border/60 bg-muted/20 pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Driver registry</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {awaitingStationPick
                  ? 'Select a station above to load drivers'
                  : `${totalDrivers} driver${totalDrivers === 1 ? '' : 's'} · search and filter`}
              </p>
            </div>
            {!awaitingStationPick ? (
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto lg:min-w-[420px]">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Name, phone, license…"
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
                    {driverStatuses.map((s) => (
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
                Pick a station to view and register drivers for that terminal.
              </div>
            ) : drivers.length === 0 ? (
              <div className="py-16 text-center">
                <UserCheck className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm font-medium">No drivers found</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  {searchTerm.trim() || statusFilter !== 'all'
                    ? 'Adjust filters or clear search.'
                    : 'Register a driver to add them to the roster.'}
                </p>
                {!searchTerm.trim() && statusFilter === 'all' ? (
                  <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Register driver
                  </Button>
                ) : null}
              </div>
            ) : (
              <>
                <div className="hidden lg:block">
                  <ScrollableTable
                    className="border-0 shadow-none ring-0"
                    maxHeightClass="max-h-[min(70vh,560px)]"
                    minWidthClass="min-w-[1000px]"
                  >
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead>Driver</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>License</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Vehicle</TableHead>
                          <TableHead>Rating</TableHead>
                          <TableHead>Station</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {drivers.map((driver) => (
                          <TableRow key={String(driver.id)}>
                            <TableCell>
                              <div className="flex items-start gap-3">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                                  {String(driver.name ?? '?')
                                    .trim()
                                    .charAt(0)
                                    .toUpperCase()}
                                </span>
                                <div className="min-w-0">
                                  <p className="font-medium truncate max-w-[160px]">
                                    {String(driver.name ?? '—')}
                                  </p>
                                  <p className="text-xs text-muted-foreground font-mono truncate">
                                    {String(driver.id ?? '')}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm">{String(driver.phone ?? '—')}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                                {String(driver.email ?? '')}
                              </p>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm font-mono">{String(driver.licenseNumber ?? '—')}</p>
                              <div className="mt-1">{getLicenseStatus(driver.licenseExpiry)}</div>
                            </TableCell>
                            <TableCell>{getStatusBadge(String(driver.status ?? ''))}</TableCell>
                            <TableCell className="max-w-[140px] truncate text-sm">
                              {vehicleLabelForDriver(driver, vehiclesById)}
                            </TableCell>
                            <TableCell className="tabular-nums text-sm">
                              ⭐ {String(driver.rating ?? '—')}/5
                            </TableCell>
                            <TableCell className="text-sm max-w-[120px] truncate">
                              {driverStationLabel(driver, stationNameById)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  aria-label="View driver"
                                  onClick={() => {
                                    setSelectedDriver(driver);
                                    setShowDetailsDialog(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  aria-label="Edit driver"
                                  onClick={() => openEditDriver(driver)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  aria-label="Assign vehicle"
                                  onClick={() => openAssignVehicle(driver)}
                                >
                                  <Car className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollableTable>
                </div>
                <div className="lg:hidden grid grid-cols-1 gap-3">
                  {drivers.map((driver) => (
                    <DriverCard key={String(driver.id)} driver={driver} />
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
              itemLabel="drivers"
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              alwaysShow
            />
          ) : null}
        </CardContent>
      </Card>

      <RegisterDriverDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        form={newDriver}
        onFormChange={(patch) => setNewDriver((prev) => ({ ...prev, ...patch }))}
        onSubmit={() => void handleAddDriver()}
        isSubmitting={isSubmitting}
        showStationPicker={dataEntry.needsPicker || isGlobalUser}
        registerStationId={registerStationId}
        onRegisterStationIdChange={setRegisterStationId}
        stations={dataEntry.stations}
        vehicleOptions={registerVehicleOptions}
        formatVehicleRefId={formatVehicleRefId}
      />

      {/* Edit Driver Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md rounded-2xl">
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
        <DialogContent className="max-w-md rounded-2xl">
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
        <DialogContent className="max-w-md rounded-2xl">
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
              <div className="text-sm">
                <p className="font-medium text-gray-700">Station</p>
                <p>{driverStationLabel(selectedDriver, stationNameById)}</p>
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
    </div>
  );
}