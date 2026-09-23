import React, { useState, useEffect } from 'react';
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
import { Plus, Edit2, Trash2, Users, Phone, Mail, Calendar, MapPin, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { unionApi } from './utils/api';

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
import { notify } from './utils/notify';

export function UnionManagement() {
  const [unions, setUnions] = useState<Union[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  // Fetch unions from backend
  const fetchUnions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await unionApi.getAll({ search: searchTerm || undefined });
      
      if (response.success && response.data) {
        const unionsData = response.data.unions || response.data;
        setUnions(Array.isArray(unionsData) ? unionsData : []);
      } else {
        console.error('Fetch unions error:', response);
        setError(response.error || 'Failed to load unions');
      }
    } catch (err) {
      console.error('Fetch unions exception:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnions();
  }, []);

  const filteredUnions = unions.filter(union =>
    union.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    union.acronym.toLowerCase().includes(searchTerm.toLowerCase()) ||
    union.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        memberCount: formData.memberCount || 0,
        isActive: formData.isActive,
        established: new Date().toISOString().split('T')[0]
      };

      const response = await unionApi.create(unionData);

      if (response.success) {
        notify.success(response.message || 'Union added successfully');
        await fetchUnions();
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
        memberCount: formData.memberCount || 0,
        isActive: formData.isActive
      };

      const response = await unionApi.update(editingUnion.id, unionData);

      if (response.success) {
        notify.success(response.message || 'Union updated successfully');
        await fetchUnions();
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
        await fetchUnions();
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
  const activeUnions = unions.filter(union => union.isActive).length;

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-gray-600">Loading unions...</p>
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
          <Button onClick={fetchUnions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1>Union Management</h1>
          <p className="text-muted-foreground">
            Manage transport unions and their memberships
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Union
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
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
              <div className="space-y-2">
                <Label htmlFor="memberCount">Member Count</Label>
                <Input
                  id="memberCount"
                  type="number"
                  value={formData.memberCount}
                  onChange={(e) => setFormData({ ...formData, memberCount: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
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
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Total Unions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Active Unions</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUnions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Total Members</CardTitle>
            <Users className="h-4 w-4 text-[#193cb8]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search unions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Unions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Unions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Union</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Established</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUnions.map((union) => (
                <TableRow key={union.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{union.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {union.acronym}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                      {union.region}
                    </div>
                  </TableCell>
                  <TableCell>{union.memberCount.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">{union.contactPerson}</div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Phone className="h-3 w-3 mr-1" />
                        {union.contactPhone}
                      </div>
                      {union.contactEmail && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Mail className="h-3 w-3 mr-1" />
                          {union.contactEmail}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={union.isActive ? "default" : "secondary"}>
                      {union.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                      {new Date(union.established).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(union)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => confirmDelete(union)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
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
              <Label htmlFor="edit-memberCount">Member Count</Label>
              <Input
                id="edit-memberCount"
                type="number"
                value={formData.memberCount}
                onChange={(e) => setFormData({ ...formData, memberCount: parseInt(e.target.value) || 0 })}
              />
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
        <AlertDialogContent>
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
  );
}