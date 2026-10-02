import React, { useState, useEffect, useCallback } from 'react';
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
import { GHANA_REGIONS } from './constants/ghanaRegions';
import { getDistrictsForRegion } from './constants/ghanaDistricts';
import { suggestNextStationCode } from './utils/stationCode';
import { usePaginatedEntityList } from './shared/hooks/usePaginatedEntityList';
import { TablePagination } from './shared/TablePagination';
import { ScrollableTable } from './shared/ScrollableTable';
import { PageHeader } from './shared/PageHeader';
import { DashboardStatCard } from './Dashboard/DashboardStatCard';
import { RisePreloader, RiseStatusAlert } from './shared/feedback';
import { filterStationsForUser } from './utils/stationScope';

export function StationManagement() {
  const { user } = useAuth();
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

  const fetchStationsPage = useCallback(
    (page: number, limit: number) =>
      stationApi.getAll({
        page,
        limit,
        region: regionFilter !== 'all' ? regionFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm.trim() || undefined,
      }),
    [regionFilter, statusFilter, searchTerm]
  );

  const {
    items: stations,
    loading,
    error,
    refresh,
    page,
    setPage,
    pagination,
    pageSize,
    setPageSize,
  } = usePaginatedEntityList<any>({
    fetchFn: fetchStationsPage,
    entityKey: 'stations',
    errorMessage: 'Failed to load stations',
    resetPageDeps: [searchTerm, statusFilter, regionFilter],
  });

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

  const userStations = React.useMemo(
    () => filterStationsForUser(stations, user),
    [stations, user]
  );

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

  useEffect(() => {
    if (!showAddDialog) return;
    const codes = stations.map((s) => String(s.code ?? ''));
    setStationForm((prev) => ({
      ...prev,
      code: prev.code || suggestNextStationCode(codes),
    }));
  }, [showAddDialog, stations]);

  const handleAddStation = async () => {
    if (
      !stationForm.name ||
      !stationForm.code ||
      !stationForm.address ||
      !stationForm.city ||
      !stationForm.region ||
      !stationForm.district
    ) {
      notify.error(
        'Please fill in name, address, city, region, and district'
      );
      return;
    }

    if (!/^[0-9]{1,6}$/.test(stationForm.code)) {
      notify.error('Station code must be numeric, up to 6 digits');
      return;
    }

    try {
      const stationData = {
        name: stationForm.name,
        code: stationForm.code,
        address: stationForm.address,
        city: stationForm.city,
        region: stationForm.region,
        district: stationForm.district,
        unionId: parseRiseNumericId(stationForm.union),
      };

      const response = await stationApi.create(stationData);

      if (response.success) {
        notify.success(response.message || 'Station added successfully');
        await refresh();
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
        await refresh();
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
        await refresh();
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

  const totalStationCount = pagination?.totalItems ?? userStations.length;
  const pageVehicles = userStations.reduce((sum, s) => sum + (s.vehicles || 0), 0);
  const pageDrivers = userStations.reduce((sum, s) => sum + (s.drivers || 0), 0);
  const pageRevenue = userStations.reduce((sum, s) => sum + (s.monthlyRevenue || 0), 0);

  const pageDescription = isAdmin
    ? 'Manage RISE transport terminals nationwide — codes, managers, unions, and operational status.'
    : `Stations in your scope${user?.stationName ? ` · ${user.stationName}` : ''}.`;

  if (loading && userStations.length === 0 && !error) {
    return (
      <div className="p-6 min-h-[420px] rise-dashboard-page">
        <RisePreloader variant="page" label="Loading stations…" />
      </div>
    );
  }

  return (
    <div className="min-h-full rise-dashboard-page">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
        <PageHeader
          title="Station management"
          description={pageDescription}
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void refresh({ toastOnError: true })}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {isAdmin ? (
                <Button className="shadow-sm" onClick={openAddStationDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add station
                </Button>
              ) : null}
            </>
          }
        />

        {error ? (
          <RiseStatusAlert type="error" title="Could not load stations">
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

        <section className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-4 sm:p-5 ring-1 ring-border/40">
          <h2 className="text-sm font-semibold tracking-tight mb-4">Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            <DashboardStatCard
              title="Stations"
              value={totalStationCount}
              icon={Building}
              accent="blue"
              hint="Total in registry"
            />
            <DashboardStatCard
              title="Vehicles (page)"
              value={pageVehicles}
              icon={Bus}
              accent="emerald"
              hint="Fleet on visible rows"
            />
            <DashboardStatCard
              title="Drivers (page)"
              value={pageDrivers}
              icon={Users}
              accent="violet"
              hint="Assigned on visible rows"
            />
            <DashboardStatCard
              title="Revenue (page)"
              value={`₵${pageRevenue.toLocaleString()}`}
              icon={DollarSign}
              accent="amber"
              hint="Monthly sum · current page"
            />
          </div>
        </section>

        <Card className="rounded-2xl shadow-sm ring-1 ring-border/50 overflow-hidden">
          <CardHeader className="space-y-4 border-b border-border/60 bg-muted/20 pb-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Station registry</CardTitle>
                <CardDescription className="mt-1">
                  {totalStationCount} station{totalStationCount === 1 ? '' : 's'} · filter and search
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto lg:min-w-[520px]">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Name, code, city, manager…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-10 bg-background/80"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-10 w-full sm:w-[140px] bg-background/80">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                {isAdmin ? (
                  <Select value={regionFilter} onValueChange={setRegionFilter}>
                    <SelectTrigger className="h-10 w-full sm:w-[160px] bg-background/80">
                      <SelectValue placeholder="Region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All regions</SelectItem>
                      {GHANA_REGIONS.map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className={loading ? 'opacity-60 pointer-events-none transition-opacity' : ''}>
              {userStations.length === 0 ? (
                <div className="py-16 text-center">
                  <MapPin className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm font-medium">No stations found</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    {searchTerm.trim() || statusFilter !== 'all' || regionFilter !== 'all'
                      ? 'Adjust filters or clear search to see more results.'
                      : isAdmin
                        ? 'Add a station to begin building the network registry.'
                        : 'No stations match your access scope.'}
                  </p>
                  {isAdmin && !searchTerm.trim() && statusFilter === 'all' && regionFilter === 'all' ? (
                    <Button className="mt-4" onClick={openAddStationDialog}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add station
                    </Button>
                  ) : null}
                </div>
              ) : (
                <ScrollableTable
                  className="border-0 shadow-none ring-0"
                  maxHeightClass="max-h-[min(70vh,560px)]"
                  minWidthClass="min-w-[1050px]"
                >
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Station</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Manager</TableHead>
                        <TableHead>Union</TableHead>
                        <TableHead>Capacity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Performance</TableHead>
                        <TableHead className="text-right w-[72px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userStations.map((station) => (
                        <TableRow key={station.id}>
                          <TableCell>
                            <div className="flex items-start gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-mono text-xs font-bold text-primary">
                                {(station.code || '—').toString().slice(-3)}
                              </span>
                              <div className="min-w-0">
                                <p className="font-medium truncate max-w-[180px]">
                                  {station.name || 'N/A'}
                                </p>
                                <p className="text-xs text-muted-foreground font-mono">
                                  {station.code || 'N/A'}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{station.city || '—'}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <MapPin className="h-3 w-3 shrink-0" />
                                {station.region || '—'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[160px]">
                              <p className="text-sm truncate">{station.managerName || '—'}</p>
                              {station.phone ? (
                                <p className="text-xs text-muted-foreground truncate">{station.phone}</p>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[140px]">
                              <p className="text-sm truncate">{station.unionName || '—'}</p>
                              {station.unionAcronym ? (
                                <p className="text-xs text-muted-foreground">{station.unionAcronym}</p>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm tabular-nums">{station.capacity ?? '—'} pax</p>
                            <p className="text-xs text-muted-foreground">
                              {station.platforms ?? '—'} platforms
                            </p>
                          </TableCell>
                          <TableCell>{getStatusBadge(station.status)}</TableCell>
                          <TableCell>
                            <p className="text-sm tabular-nums">{station.dailyTrips || 0} trips/day</p>
                            <p className="text-xs text-muted-foreground tabular-nums">
                              ₵{(station.monthlyRevenue ?? 0).toLocaleString()}/mo
                            </p>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0" aria-label="Station actions">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl">
                                <DropdownMenuItem onClick={() => handleViewStation(station)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View details
                                </DropdownMenuItem>
                                {isAdmin ? (
                                  <>
                                    <DropdownMenuItem onClick={() => handleEdit(station)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit station
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => confirmDelete(station)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete station
                                    </DropdownMenuItem>
                                  </>
                                ) : null}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollableTable>
              )}
            </div>
            <TablePagination
              page={page}
              pagination={pagination}
              onPageChange={setPage}
              loading={loading}
              itemLabel="stations"
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              alwaysShow
            />
          </CardContent>
        </Card>

      {/* Add Station Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl rounded-2xl">
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
                  readOnly
                  className="bg-muted/50 font-mono"
                  placeholder="Auto-generated (6 digits max)"
                />
                <p className="text-xs text-muted-foreground">Assigned automatically when you open this form.</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                value={stationForm.address}
                onChange={(e) => setStationForm({...stationForm, address: e.target.value})}
                placeholder="Complete station address (any format)"
                rows={2}
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
                <Select
                  value={stationForm.region}
                  onValueChange={(value) =>
                    setStationForm({ ...stationForm, region: value, district: '' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {GHANA_REGIONS.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="district">District *</Label>
              <Select
                value={stationForm.district || undefined}
                onValueChange={(value) => setStationForm({ ...stationForm, district: value })}
                disabled={!stationForm.region}
              >
                <SelectTrigger id="district">
                  <SelectValue placeholder={stationForm.region ? 'Select district' : 'Select region first'} />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {getDistrictsForRegion(stationForm.region).map((district) => (
                    <SelectItem key={district} value={district}>
                      {district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                className="mt-2"
                value={stationForm.district}
                onChange={(e) => setStationForm({ ...stationForm, district: e.target.value })}
                placeholder="Or type district if not listed"
              />
            </div>

            <p className="text-xs text-muted-foreground rounded-md border bg-muted/30 p-3">
              <strong>Station capacity</strong> (shown on some station records) is an optional
              terminal throughput figure — not vehicle seat count. Seat capacity is set per vehicle
              in Vehicle Management. Assign a <strong>station manager</strong> in User Management
              (role station_manager + station), not in this form.
            </p>

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
        <DialogContent className="max-w-2xl rounded-2xl">
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
                <Select
                  value={stationForm.region}
                  onValueChange={(value) =>
                    setStationForm({ ...stationForm, region: value, district: '' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {GHANA_REGIONS.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-district">District *</Label>
              <Select
                value={stationForm.district || undefined}
                onValueChange={(value) => setStationForm({ ...stationForm, district: value })}
                disabled={!stationForm.region}
              >
                <SelectTrigger id="edit-district">
                  <SelectValue placeholder={stationForm.region ? 'Select district' : 'Select region first'} />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {getDistrictsForRegion(stationForm.region).map((district) => (
                    <SelectItem key={district} value={district}>
                      {district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
        <DialogContent className="max-w-3xl rounded-2xl">
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
        <AlertDialogContent className="rounded-2xl">
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
    </div>
  );
}