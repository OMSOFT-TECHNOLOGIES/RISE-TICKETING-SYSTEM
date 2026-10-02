import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import {
  Plus,
  Edit2,
  Trash2,
  Users,
  UserPlus,
  Phone,
  Mail,
  Calendar,
  MapPin,
  AlertTriangle,
  RefreshCw,
  Search,
  Shield,
  Building2,
} from 'lucide-react';
import { unionApi } from './utils/api';
import { usePaginatedEntityList } from './shared/hooks/usePaginatedEntityList';
import { TablePagination } from './shared/TablePagination';
import { ScrollableTable } from './shared/ScrollableTable';
import { PageHeader } from './shared/PageHeader';
import { DashboardStatCard } from './Dashboard/DashboardStatCard';
import { RisePreloader, RiseStatusAlert } from './shared/feedback';
import { notify } from './utils/notify';

interface Union {
  id: string;
  name: string;
  acronym: string;
  description: string;
  region: string;
  established: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  memberCount: number;
  isActive: boolean;
}

export function UnionManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [unionToDelete, setUnionToDelete] = useState<Union | null>(null);
  const [editingUnion, setEditingUnion] = useState<Union | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    acronym: '',
    description: '',
    region: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    memberCount: 0,
    isActive: true
  });

  const regions = [
    'Greater Accra', 'Ashanti', 'Western', 'Central', 'Eastern', 
    'Northern', 'Upper East', 'Upper West', 'Volta', 'Brong Ahafo',
    'Western North', 'Ahafo', 'Bono East', 'North East', 'Savannah', 'Oti'
  ];

  const fetchUnionsPage = useCallback(
    (page: number, limit: number) =>
      unionApi.getAll({
        page,
        limit,
        search: searchTerm.trim() || undefined,
      }),
    [searchTerm]
  );

  const {
    items: unions,
    loading,
    error,
    refresh,
    page,
    setPage,
    pagination,
    pageSize,
    setPageSize,
  } = usePaginatedEntityList<Union>({
    fetchFn: fetchUnionsPage,
    entityKey: 'unions',
    errorMessage: 'Failed to load unions',
    resetPageDeps: [searchTerm],
  });

  const resetForm = () => {
    setFormData({
      name: '',
      acronym: '',
      description: '',
      region: '',
      contactPerson: '',
      contactPhone: '',
      contactEmail: '',
      memberCount: 0,
      isActive: true
    });
  };

  const handleAdd = async () => {
    if (!formData.name || !formData.acronym || !formData.region) {
      notify.error('Please fill in all required fields');
      return;
    }

    try {
      const unionData = {
        name: formData.name,
        acronym: formData.acronym.toUpperCase(),
        description: formData.description,
        region: formData.region,
        contactPerson: formData.contactPerson,
        contactPhone: formData.contactPhone,
        contactEmail: formData.contactEmail,
        memberCount: 0,
        isActive: formData.isActive,
        established: new Date().toISOString().split('T')[0]
      };

      const response = await unionApi.create(unionData);

      if (response.success) {
        notify.success(response.message || 'Union added successfully');
        await refresh();
        setIsAddDialogOpen(false);
        resetForm();
      } else {
        console.error('Union creation error:', response);
        const errorMsg = typeof response.error === 'string' 
          ? response.error 
          : (response.error && typeof response.error === 'object' && 'message' in response.error)
            ? String((response.error as any).message)
            : response.details || 'Please try again';
        notify.error('Failed to add union', {
          description: errorMsg,
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Union creation exception:', error);
      const errorMessage = error instanceof Error ? error.message : 'Please check your connection';
      notify.error('Failed to add union', {
        description: errorMessage,
        duration: 5000
      });
    }
  };

  const handleEdit = (union: Union) => {
    setEditingUnion(union);
    setFormData({
      name: union.name,
      acronym: union.acronym,
      description: union.description,
      region: union.region,
      contactPerson: union.contactPerson,
      contactPhone: union.contactPhone,
      contactEmail: union.contactEmail,
      memberCount: union.memberCount,
      isActive: union.isActive
    });
    setIsEditDialogOpen(true);
  };

  const handleRegisterMember = async (union: Union) => {
    try {
      const nextCount = (union.memberCount ?? 0) + 1;
      const response = await unionApi.update(union.id, { memberCount: nextCount });
      if (response.success) {
        notify.success(`Member registered — total ${nextCount}`);
        await refresh();
      } else {
        notify.error('Failed to update member count');
      }
    } catch {
      notify.error('Failed to register member');
    }
  };

  const handleUpdate = async () => {
    if (!editingUnion) return;

    if (!formData.name || !formData.acronym || !formData.region) {
      notify.error('Please fill in all required fields');
      return;
    }

    try {
      const unionData = {
        name: formData.name,
        acronym: formData.acronym.toUpperCase(),
        description: formData.description,
        region: formData.region,
        contactPerson: formData.contactPerson,
        contactPhone: formData.contactPhone,
        contactEmail: formData.contactEmail,
        memberCount: editingUnion?.memberCount ?? 0,
        isActive: formData.isActive
      };

      const response = await unionApi.update(editingUnion.id, unionData);

      if (response.success) {
        notify.success(response.message || 'Union updated successfully');
        await refresh();
        setIsEditDialogOpen(false);
        setEditingUnion(null);
        resetForm();
      } else {
        console.error('Union update error:', response);
        const errorMsg = typeof response.error === 'string' 
          ? response.error 
          : (response.error && typeof response.error === 'object' && 'message' in response.error)
            ? String((response.error as any).message)
            : response.details || 'Please try again';
        notify.error('Failed to update union', {
          description: errorMsg,
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Union update exception:', error);
      const errorMessage = error instanceof Error ? error.message : 'Please check your connection';
      notify.error('Failed to update union', {
        description: errorMessage,
        duration: 5000
      });
    }
  };

  const confirmDelete = (union: Union) => {
    setUnionToDelete(union);
  };

  const handleDelete = async () => {
    if (!unionToDelete) return;

    try {
      const response = await unionApi.delete(unionToDelete.id);

      if (response.success) {
        notify.success(response.message || 'Union deleted successfully');
        await refresh();
        setUnionToDelete(null);
      } else {
        console.error('Union deletion error:', response);
        const errorMsg = typeof response.error === 'string' 
          ? response.error 
          : (response.error && typeof response.error === 'object' && 'message' in response.error)
            ? String((response.error as any).message)
            : response.details || 'Please try again';
        notify.error('Failed to delete union', {
          description: errorMsg,
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Union deletion exception:', error);
      const errorMessage = error instanceof Error ? error.message : 'Please check your connection';
      notify.error('Failed to delete union', {
        description: errorMessage,
        duration: 5000
      });
    }
  };

  const totalMembers = unions.reduce((sum, union) => sum + union.memberCount, 0);
  const activeUnions = unions.filter((union) => union.isActive).length;
  const totalUnions = pagination?.totalItems ?? unions.length;

  const addUnionDialog = (
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              Add union
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl rounded-2xl">
            <DialogHeader>
              <DialogTitle>Add New Union</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Union Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ghana Private Road Transport Union"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="acronym">Acronym *</Label>
                <Input
                  id="acronym"
                  value={formData.acronym}
                  onChange={(e) => setFormData({ ...formData, acronym: e.target.value.toUpperCase() })}
                  placeholder="GPRTU"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the union..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Region *</Label>
                <Select value={formData.region} onValueChange={(value) => setFormData({ ...formData, region: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="National">National</SelectItem>
                    {regions.map(region => (
                      <SelectItem key={region} value={region}>{region}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground col-span-2">
                Member totals start at zero and increase when you use &quot;Register member&quot; on a union row.
              </p>
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="+233244123456"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="contact@union.org.gh"
                />
              </div>
              <div className="flex items-center space-x-2 col-span-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Active Union</Label>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdd}>
                Add Union
              </Button>
            </div>
          </DialogContent>
        </Dialog>
  );

  if (loading && unions.length === 0 && !error) {
    return (
      <div className="p-6 min-h-[420px] rise-dashboard-page">
        <RisePreloader variant="page" label="Loading unions…" />
      </div>
    );
  }

  return (
    <div className="min-h-full rise-dashboard-page">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
        <PageHeader
          title="Union management"
          description="Register transport unions, track membership totals, and maintain regional contacts for GPRTU and partner organizations."
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
              {addUnionDialog}
            </>
          }
        />

        {error ? (
          <RiseStatusAlert type="error" title="Could not load unions">
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <DashboardStatCard
              title="Registered unions"
              value={totalUnions}
              icon={Building2}
              accent="blue"
              hint="Total in registry"
            />
            <DashboardStatCard
              title="Active unions"
              value={activeUnions}
              icon={Shield}
              accent="emerald"
              hint="Active on this page"
            />
            <DashboardStatCard
              title="Members (page)"
              value={totalMembers.toLocaleString()}
              icon={Users}
              accent="violet"
              hint="Sum of rows shown"
            />
          </div>
        </section>

        <Card className="rounded-2xl shadow-sm ring-1 ring-border/50 overflow-hidden">
          <CardHeader className="space-y-4 border-b border-border/60 bg-muted/20 pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Union registry</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Search by name, acronym, or region
                </p>
              </div>
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search unions…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10 bg-background/80"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className={loading ? 'opacity-60 pointer-events-none transition-opacity' : ''}>
              {unions.length === 0 ? (
                <div className="py-16 text-center">
                  <Building2 className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm font-medium">No unions found</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    {searchTerm.trim()
                      ? 'Try a different search term or clear the filter.'
                      : 'Add your first transport union to get started.'}
                  </p>
                  {!searchTerm.trim() ? (
                    <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add union
                    </Button>
                  ) : null}
                </div>
              ) : (
                <ScrollableTable
                  className="border-0 shadow-none ring-0"
                  maxHeightClass="max-h-[min(70vh,560px)]"
                  minWidthClass="min-w-[900px]"
                >
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Union</TableHead>
                        <TableHead>Region</TableHead>
                        <TableHead className="text-right">Members</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Established</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unions.map((union) => (
                        <TableRow key={union.id}>
                          <TableCell>
                            <div className="flex items-start gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold">
                                {union.acronym.slice(0, 3)}
                              </span>
                              <div className="min-w-0">
                                <p className="font-medium truncate max-w-[200px]">{union.name}</p>
                                <p className="text-xs text-muted-foreground">{union.acronym}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm">
                              <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              {union.region}
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {union.memberCount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-0.5 max-w-[220px]">
                              {union.contactPerson ? (
                                <p className="text-sm truncate">{union.contactPerson}</p>
                              ) : (
                                <p className="text-sm text-muted-foreground">—</p>
                              )}
                              {union.contactPhone ? (
                                <p className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                                  <Phone className="h-3 w-3 shrink-0" />
                                  {union.contactPhone}
                                </p>
                              ) : null}
                              {union.contactEmail ? (
                                <p className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                                  <Mail className="h-3 w-3 shrink-0" />
                                  {union.contactEmail}
                                </p>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={union.isActive ? 'default' : 'secondary'}
                              className={
                                union.isActive
                                  ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/15'
                                  : ''
                              }
                            >
                              {union.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground whitespace-nowrap">
                              <Calendar className="h-3.5 w-3.5 shrink-0" />
                              {union.established
                                ? new Date(union.established).toLocaleDateString()
                                : '—'}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8"
                                onClick={() => void handleRegisterMember(union)}
                                title="Register member"
                              >
                                <UserPlus className="h-4 w-4 sm:mr-1" />
                                <span className="hidden sm:inline">Member</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEdit(union)}
                                aria-label="Edit union"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => confirmDelete(union)}
                                aria-label="Delete union"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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
              itemLabel="unions"
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              alwaysShow
            />
          </CardContent>
        </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Union</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Union Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-acronym">Acronym *</Label>
              <Input
                id="edit-acronym"
                value={formData.acronym}
                onChange={(e) => setFormData({ ...formData, acronym: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-region">Region *</Label>
              <Select value={formData.region} onValueChange={(value) => setFormData({ ...formData, region: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="National">National</SelectItem>
                  {regions.map(region => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Members: {editingUnion?.memberCount?.toLocaleString() ?? 0} — use Register member on the table to add.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-contactPerson">Contact Person</Label>
              <Input
                id="edit-contactPerson"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-contactPhone">Contact Phone</Label>
              <Input
                id="edit-contactPhone"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit-contactEmail">Contact Email</Label>
              <Input
                id="edit-contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2 col-span-2">
              <Switch
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="edit-isActive">Active Union</Label>
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>
              Update Union
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!unionToDelete} onOpenChange={() => setUnionToDelete(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the union "{unionToDelete?.name}" ({unionToDelete?.acronym})?
              This action cannot be undone and will permanently remove this union and all associated data from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete Union
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
}