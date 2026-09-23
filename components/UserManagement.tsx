import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from './AuthContext';
import { 
  Users, 
  Plus, 
  Edit, 
  Eye,
  Shield,
  Mail,
  Phone,
  Building,
  UserCheck,
  UserX,
  Crown,
  AlertCircle,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { userRoles } from './constants/userRoles';
import { formatDate, getStatusBadgeClass, getRoleBadgeClass } from './utils/helpers';
import { userApi, parseListResponse } from './utils/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { UserEditDialog, type EditableUser } from './UserManagement/UserEditDialog';
import { canCreateUsers, canModifyUser } from './UserManagement/userAccess';

type UserFormRoleOption = {
  value: string;
  label: string;
  description: string;
  requiresStation: boolean;
  requiresRegion: boolean;
};

type UserFormStationOption = {
  id: string;
  name: string;
  region?: string;
  district?: string;
  city?: string;
  address?: string;
};

type UserFormOptions = {
  roles: UserFormRoleOption[];
  regions: string[];
  districtsByRegion: Record<string, string[]>;
  stations: UserFormStationOption[];
};
import { notify } from './utils/notify';
import { usePageAction } from './context/PageActionContext';

export function UserManagement() {
  const { user, isSuperAdmin, isAdmin, hasPermission } = useAuth();
  const { pendingAction, clearAction } = usePageAction();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    fullName: '',
    phone: '',
    password: '',
    role: 'station_worker',
    stationId: '',
    region: '',
    district: ''
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formOptions, setFormOptions] = useState<UserFormOptions | null>(null);
  const [formOptionsLoading, setFormOptionsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{ totalPages: number; total: number } | null>(null);
  const [statistics, setStatistics] = useState<{
    total: number;
    active: number;
    suspended: number;
    admins: number;
  } | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [userToEdit, setUserToEdit] = useState<EditableUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<EditableUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchFormOptions = async () => {
    try {
      setFormOptionsLoading(true);
      const response = await userApi.getFormOptions();
      if (response.success && response.data) {
        setFormOptions(response.data as UserFormOptions);
      } else {
        setFormOptions(null);
        console.error('Fetch user form options error:', response.error);
        notify.error('Could not load form options', {
          description: typeof response.error === 'string' ? response.error : 'Please try again',
        });
      }
    } catch (err) {
      console.error('Fetch user form options exception:', err);
      setFormOptions(null);
    } finally {
      setFormOptionsLoading(false);
    }
  };

  const selectedRoleOption = formOptions?.roles.find((role) => role.value === newUser.role);
  const stationOptions = formOptions?.stations ?? [];
  const regionOptions = formOptions?.regions ?? [];
  const districtOptions =
    newUser.region && formOptions?.districtsByRegion
      ? formOptions.districtsByRegion[newUser.region] ?? []
      : [];

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userApi.getAll({
        page,
        limit: 50,
        search: searchTerm.trim() || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      if (response.success && response.data) {
        const data = response.data as Record<string, unknown>;
        setUsers(parseListResponse(data, 'users'));
        const stats = data.statistics as typeof statistics;
        if (stats && typeof stats === 'object') {
          setStatistics(stats);
        }
        const pag = data.pagination as { totalPages?: number; total?: number } | undefined;
        if (pag) {
          setPagination({
            totalPages: Number(pag.totalPages ?? 1),
            total: Number(pag.total ?? 0),
          });
        }
      } else {
        setError(response.error || 'Failed to load users');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, searchTerm, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, roleFilter, statusFilter]);

  useEffect(() => {
    if (pendingAction === 'new-user') {
      setShowAddDialog(true);
      clearAction();
    }
  }, [pendingAction, clearAction]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!newUser.fullName.trim()) {
      errors.fullName = 'Full name is required';
    } else if (newUser.fullName.trim().length < 2) {
      errors.fullName = 'Full name must be at least 2 characters';
    }
    
    if (!newUser.username.trim()) {
      errors.username = 'Username is required';
    } else if (newUser.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-z0-9._-]+$/i.test(newUser.username)) {
      errors.username = 'Username can only contain letters, numbers, dots, hyphens, and underscores';
    } else if (users.some(u => u.username.toLowerCase() === newUser.username.toLowerCase())) {
      errors.username = 'Username already exists';
    }
    
    if (!newUser.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)) {
      errors.email = 'Please enter a valid email address';
    } else if (users.some(u => u.email.toLowerCase() === newUser.email.toLowerCase())) {
      errors.email = 'Email address already exists';
    }
    
    if (!newUser.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[0-9+\s()-]{10,}$/.test(newUser.phone)) {
      errors.phone = 'Please enter a valid phone number (at least 10 digits)';
    }
    
    if (!newUser.password.trim()) {
      errors.password = 'Password is required';
    } else if (newUser.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newUser.password)) {
      errors.password = 'Password must contain uppercase, lowercase, and number';
    }
    
    if (selectedRoleOption?.requiresStation && !newUser.stationId) {
      errors.stationId = 'Station assignment is required for this role';
    }

    if (selectedRoleOption?.requiresRegion && !newUser.region.trim()) {
      errors.region = 'Region is required for this role';
    }
    
    return errors;
  };

  const handleAddUser = async () => {
    if (formOptionsLoading || !formOptions) {
      notify.error('Form options are still loading', {
        description: 'Please wait a moment and try again.',
      });
      return;
    }

    setFormErrors({});
    const errors = validateForm();
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      notify.error('Please correct the errors in the form');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const assignedStation = stationOptions.find((station) => station.id === newUser.stationId);
      const userData = {
        username: newUser.username.trim(),
        email: newUser.email.trim().toLowerCase(),
        fullName: newUser.fullName.trim(),
        phone: newUser.phone.trim(),
        password: newUser.password,
        role: newUser.role,
        stationId: newUser.stationId || undefined,
        stationName: assignedStation?.name,
        region: newUser.region.trim() || undefined,
        district: newUser.district.trim() || undefined
      };
      
      const response = await userApi.create(userData);
      
      if (response.success) {
        notify.success(response.message || `User ${newUser.fullName} has been created successfully`);
        
        // Refresh user list
        await fetchUsers();
        
        // Reset form
        setNewUser({ 
          username: '', 
          email: '', 
          fullName: '', 
          phone: '', 
          password: '', 
          role: 'station_worker', 
          stationId: '', 
          region: '', 
          district: '' 
        });
        setFormErrors({});
        setShowAddDialog(false);
      } else {
        console.error('Create user error:', response);
        notify.error('Failed to create user', {
          description: response.error || 'Please try again',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Create user exception:', error);
      const errorMessage = error instanceof Error ? error.message : 'Please check your connection';
      notify.error('Failed to create user', {
        description: errorMessage,
        duration: 5000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleInfo = userRoles.find(r => r.value === role);
    const IconComponent = role.includes('admin') ? Crown : UserCheck;
    return (
      <Badge className={getRoleBadgeClass(role)}>
        <IconComponent className="h-3 w-3 mr-1" />
        {roleInfo?.label || role.replace('_', ' ')}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const getStatusLabel = (status: string) => {
      switch (status) {
        case 'active': return 'Active';
        case 'inactive': return 'Inactive';
        case 'suspended': return 'Suspended';
        default: return status.charAt(0).toUpperCase() + status.slice(1);
      }
    };

    return (
      <Badge className={getStatusBadgeClass(status)}>
        {getStatusLabel(status)}
      </Badge>
    );
  };

  const openEditUser = (userItem: EditableUser) => {
    setUserToEdit(userItem);
    setShowEditDialog(true);
    void fetchFormOptions();
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const response = await userApi.delete(userToDelete.id);
      if (response.success) {
        notify.success(response.message || 'User deleted successfully');
        setUserToDelete(null);
        await fetchUsers();
      } else {
        notify.error('Failed to delete user', { description: response.error });
      }
    } catch (err) {
      notify.error('Failed to delete user', {
        description: err instanceof Error ? err.message : 'Please try again',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleUserStatus = async (userId: string) => {
    try {
      // Find the user to determine current status
      const user = users.find(u => u.id === userId);
      if (!user) return;
      
      // Toggle status: active -> suspended, suspended/inactive -> active
      const newStatus = user.status === 'active' ? 'suspended' : 'active';
      
      const response = await userApi.toggleStatus(userId, newStatus);
      
      if (response.success) {
        notify.success(response.message || 'User status updated successfully');
        // Refresh user list
        await fetchUsers();
      } else {
        console.error('Toggle status error:', response);
        notify.error('Failed to update user status', {
          description: response.error || 'Please try again',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Toggle status exception:', error);
      const errorMessage = error instanceof Error ? error.message : 'Please check your connection';
      notify.error('Failed to update user status', {
        description: errorMessage,
        duration: 5000
      });
    }
  };

  // Check access permissions - Super Admin always has access
  const canManageUsers =
    isSuperAdmin() || hasPermission('manage_users') || hasPermission('manage_basic_users');
  const canCreateUser = canCreateUsers(isSuperAdmin(), hasPermission);
  const canDeleteUsers = isSuperAdmin() || isAdmin() || hasPermission('manage_users');

  const actorContext = {
    id: user?.id,
    role: user?.role ?? '',
    stationId: user?.stationId,
  };
  
  if (!canManageUsers) {
    return (
      <div className="p-6 text-center">
        <Shield className="h-16 w-16 mx-auto mb-4 text-gray-400" />
        <h2 className="text-2xl font-bold text-gray-600 mb-2">Access Restricted</h2>
        <p className="text-gray-500">
          You need appropriate permissions to manage users.
        </p>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#193cb8] mb-4" />
        <p className="text-muted-foreground">Loading users...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Failed to Load Users</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button 
                  onClick={fetchUsers}
                  style={{ backgroundColor: '#193cb8' }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter users based on permissions
  const filteredUsers = isSuperAdmin() ? 
    users : 
    users.filter(u => u.role !== 'super_admin'); // Regular admins can't see super admin accounts

  const totalUsers = statistics?.total ?? filteredUsers.length;
  const adminUsers = statistics?.admins ?? filteredUsers.filter((u) => u.role.includes('admin')).length;
  const activeUsers = statistics?.active ?? filteredUsers.filter((u) => u.status === 'active').length;
  const suspendedUsers =
    statistics?.suspended ?? filteredUsers.filter((u) => u.status === 'suspended').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>User Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts and permissions across the RISE system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchUsers()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        {canCreateUser && (
        <Dialog open={showAddDialog} onOpenChange={(open) => {
          setShowAddDialog(open);
          if (open) {
            void fetchFormOptions();
          }
          if (!open) {
            setFormErrors({});
            setNewUser({ 
              username: '', 
              email: '', 
              fullName: '', 
              phone: '', 
              password: '', 
              role: 'station_worker', 
              stationId: '', 
              region: '', 
              district: '' 
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-[#193cb8] hover:bg-[#142f9e] text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="space-y-3 pb-4 border-b">
              <DialogTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-[#193cb8]/10 rounded-lg">
                  <Users className="h-6 w-6 text-[#193cb8]" />
                </div>
                Create New User Account
              </DialogTitle>
              <DialogDescription className="text-base">
                Register a new user in the RISE system. All fields marked with an asterisk <span className="text-destructive font-semibold">(*)</span> are required.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-6">
              {/* Personal Information Section */}
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-[#193cb8]"></div>
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                    Personal Information
                  </h3>
                </div>
                
                <div className="space-y-2.5">
                  <Label htmlFor="fullName" className="flex items-center gap-1.5 text-sm font-semibold">
                    Full Name
                    <span className="text-destructive font-bold">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    value={newUser.fullName}
                    onChange={(e) => {
                      setNewUser({...newUser, fullName: e.target.value});
                      if (formErrors.fullName) {
                        setFormErrors({...formErrors, fullName: ''});
                      }
                    }}
                    placeholder="Enter full legal name (e.g., John Mensah Doe)"
                    className={`h-11 ${formErrors.fullName ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    disabled={isSubmitting}
                  />
                  {formErrors.fullName && (
                    <div className="flex items-center gap-2 p-2.5 bg-destructive/10 border border-destructive/20 rounded-md">
                      <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                      <p className="text-sm text-destructive font-medium">
                        {formErrors.fullName}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="username" className="flex items-center gap-1.5 text-sm font-semibold">
                    Username
                    <span className="text-destructive font-bold">*</span>
                  </Label>
                  <Input
                    id="username"
                    value={newUser.username}
                    onChange={(e) => {
                      setNewUser({...newUser, username: e.target.value.toLowerCase()});
                      if (formErrors.username) {
                        setFormErrors({...formErrors, username: ''});
                      }
                    }}
                    placeholder="username (lowercase, e.g., j.doe or john.doe)"
                    className={`h-11 font-mono ${formErrors.username ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    disabled={isSubmitting}
                  />
                  {formErrors.username && (
                    <div className="flex items-center gap-2 p-2.5 bg-destructive/10 border border-destructive/20 rounded-md">
                      <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                      <p className="text-sm text-destructive font-medium">
                        {formErrors.username}
                      </p>
                    </div>
                  )}
                  {!formErrors.username && (
                    <p className="text-xs text-muted-foreground">
                      Must be unique and contain only letters, numbers, dots, hyphens, or underscores
                    </p>
                  )}
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="email" className="flex items-center gap-1.5 text-sm font-semibold">
                    Email Address
                    <span className="text-destructive font-bold">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => {
                      setNewUser({...newUser, email: e.target.value});
                      if (formErrors.email) {
                        setFormErrors({...formErrors, email: ''});
                      }
                    }}
                    placeholder="user@rise.gov.gh or official email"
                    className={`h-11 ${formErrors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    disabled={isSubmitting}
                  />
                  {formErrors.email && (
                    <div className="flex items-center gap-2 p-2.5 bg-destructive/10 border border-destructive/20 rounded-md">
                      <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                      <p className="text-sm text-destructive font-medium">
                        {formErrors.email}
                      </p>
                    </div>
                  )}
                  {!formErrors.email && (
                    <p className="text-xs text-muted-foreground">
                      Official email address for system notifications and account recovery
                    </p>
                  )}
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="phone" className="flex items-center gap-1.5 text-sm font-semibold">
                    Phone Number
                    <span className="text-destructive font-bold">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) => {
                      setNewUser({...newUser, phone: e.target.value});
                      if (formErrors.phone) {
                        setFormErrors({...formErrors, phone: ''});
                      }
                    }}
                    placeholder="+233 XX XXX XXXX or 0XX XXX XXXX"
                    className={`h-11 ${formErrors.phone ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    disabled={isSubmitting}
                  />
                  {formErrors.phone && (
                    <div className="flex items-center gap-2 p-2.5 bg-destructive/10 border border-destructive/20 rounded-md">
                      <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                      <p className="text-sm text-destructive font-medium">
                        {formErrors.phone}
                      </p>
                    </div>
                  )}
                  {!formErrors.phone && (
                    <p className="text-xs text-muted-foreground">
                      Contact number for official communications
                    </p>
                  )}
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="password" className="flex items-center gap-1.5 text-sm font-semibold">
                    Password
                    <span className="text-destructive font-bold">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => {
                      setNewUser({...newUser, password: e.target.value});
                      if (formErrors.password) {
                        setFormErrors({...formErrors, password: ''});
                      }
                    }}
                    placeholder="Create a strong password"
                    className={`h-11 ${formErrors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    disabled={isSubmitting}
                  />
                  {formErrors.password && (
                    <div className="flex items-center gap-2 p-2.5 bg-destructive/10 border border-destructive/20 rounded-md">
                      <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                      <p className="text-sm text-destructive font-medium">
                        {formErrors.password}
                      </p>
                    </div>
                  )}
                  {!formErrors.password && (
                    <p className="text-xs text-muted-foreground">
                      Minimum 8 characters with uppercase, lowercase, and number
                    </p>
                  )}
                </div>
              </div>

              {/* Role & Assignment Section */}
              <div className="space-y-5 pt-6 border-t-2">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-[#193cb8]"></div>
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                    Role & Assignment
                  </h3>
                </div>
                
                <div className="space-y-2.5">
                  <Label htmlFor="role" className="flex items-center gap-1.5 text-sm font-semibold">
                    System Role
                    <span className="text-destructive font-bold">*</span>
                  </Label>
                  <Select 
                    value={newUser.role} 
                    onValueChange={(value) => {
                      setNewUser({...newUser, role: value, stationId: '', region: '', district: ''});
                      setFormErrors({});
                    }}
                    disabled={isSubmitting || formOptionsLoading}
                  >
                    <SelectTrigger className={`h-11 ${formErrors.role ? 'border-destructive' : ''}`}>
                      <SelectValue placeholder={formOptionsLoading ? 'Loading roles...' : 'Select user role'} />
                    </SelectTrigger>
                    <SelectContent>
                      {(formOptions?.roles ?? []).map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          <div className="py-1">
                            <div className="font-medium">{role.label}</div>
                            <div className="text-xs text-muted-foreground">{role.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Role determines access permissions and capabilities within the system
                  </p>
                </div>

                {selectedRoleOption?.requiresStation && (
                  <div className="space-y-2.5 animate-in fade-in-50 duration-300">
                    <Label htmlFor="station" className="flex items-center gap-1.5 text-sm font-semibold">
                      Assigned Station
                      <span className="text-destructive font-bold">*</span>
                    </Label>
                    <Select 
                      value={newUser.stationId} 
                      onValueChange={(value) => {
                        setNewUser({...newUser, stationId: value});
                        if (formErrors.stationId) {
                          setFormErrors({...formErrors, stationId: ''});
                        }
                      }}
                      disabled={isSubmitting || formOptionsLoading}
                    >
                      <SelectTrigger className={`h-11 ${formErrors.stationId ? 'border-destructive' : ''}`}>
                        <SelectValue placeholder={formOptionsLoading ? 'Loading stations...' : 'Select station'} />
                      </SelectTrigger>
                      <SelectContent>
                        {stationOptions.length === 0 ? (
                          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                            {formOptionsLoading ? 'Loading stations…' : 'No active stations available'}
                          </div>
                        ) : (
                          stationOptions.map((station) => (
                            <SelectItem key={station.id} value={station.id}>
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4" />
                                <div>
                                  <div className="font-medium">{station.name}</div>
                                  {(station.city || station.address) && (
                                    <div className="text-xs text-muted-foreground">
                                      {[station.city, station.region].filter(Boolean).join(', ')}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {formErrors.stationId && (
                      <div className="flex items-center gap-2 p-2.5 bg-destructive/10 border border-destructive/20 rounded-md">
                        <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                        <p className="text-sm text-destructive font-medium">
                          {formErrors.stationId}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {selectedRoleOption?.requiresRegion && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in-50 duration-300">
                    <div className="space-y-2.5">
                      <Label htmlFor="region" className="flex items-center gap-1.5 text-sm font-semibold">
                        Region
                        <span className="text-destructive font-bold">*</span>
                      </Label>
                      <Select
                        value={newUser.region}
                        onValueChange={(value) => {
                          setNewUser({ ...newUser, region: value, district: '' });
                          if (formErrors.region) {
                            setFormErrors({ ...formErrors, region: '' });
                          }
                        }}
                        disabled={isSubmitting || formOptionsLoading}
                      >
                        <SelectTrigger className={`h-11 ${formErrors.region ? 'border-destructive' : ''}`}>
                          <SelectValue placeholder={formOptionsLoading ? 'Loading regions...' : 'Select region'} />
                        </SelectTrigger>
                        <SelectContent>
                          {regionOptions.map((region) => (
                            <SelectItem key={region} value={region}>
                              {region}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.region && (
                        <div className="flex items-center gap-2 p-2.5 bg-destructive/10 border border-destructive/20 rounded-md">
                          <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                          <p className="text-sm text-destructive font-medium">
                            {formErrors.region}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2.5">
                      <Label htmlFor="district" className="text-sm font-semibold">
                        District
                        <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
                      </Label>
                      <Select
                        value={newUser.district}
                        onValueChange={(value) => setNewUser({ ...newUser, district: value })}
                        disabled={isSubmitting || formOptionsLoading || !newUser.region}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue
                            placeholder={
                              !newUser.region
                                ? 'Select a region first'
                                : districtOptions.length === 0
                                  ? 'No districts for this region'
                                  : 'Select district (optional)'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {districtOptions.map((district) => (
                            <SelectItem key={district} value={district}>
                              {district}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddDialog(false)}
                  disabled={isSubmitting}
                  className="h-11 px-6 font-semibold"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddUser} 
                  disabled={isSubmitting || formOptionsLoading || !formOptions}
                  className="min-w-[140px] h-11 px-6 font-semibold shadow-lg bg-[#193cb8] hover:bg-[#142f9e] text-white"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create User
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        )}
        </div>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-[#193cb8]" />
            <p className="text-2xl font-bold">{totalUsers}</p>
            <p className="text-sm text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Crown className="h-8 w-8 mx-auto mb-2 text-[#193cb8]" />
            <p className="text-2xl font-bold">{adminUsers}</p>
            <p className="text-sm text-muted-foreground">Administrators</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <UserCheck className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold">{activeUsers}</p>
            <p className="text-sm text-muted-foreground">Active Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <UserX className="h-8 w-8 mx-auto mb-2 text-red-600" />
            <p className="text-2xl font-bold">{suspendedUsers}</p>
            <p className="text-sm text-muted-foreground">Suspended</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader className="space-y-4">
          <CardTitle>User Registry</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by name, username, or email…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {userRoles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No users match your filters.</div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Assignment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((userItem) => {
                const canModify = canModifyUser(
                  actorContext,
                  userItem,
                  isSuperAdmin(),
                  hasPermission
                );
                return (
                <TableRow key={userItem.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{userItem.fullName}</p>
                      <p className="text-sm text-muted-foreground">{userItem.username}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1 text-sm">
                        <Mail className="h-3 w-3" />
                        <span>{userItem.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(userItem.role)}</TableCell>
                  <TableCell>
                    {userItem.stationName ? (
                      <div className="flex items-center space-x-1">
                        <Building className="h-3 w-3" />
                        <span className="text-sm">{userItem.stationName}</span>
                      </div>
                    ) : userItem.region ? (
                      <div className="text-sm">
                        <div>{userItem.region}</div>
                        {userItem.district && (
                          <div className="text-muted-foreground">{userItem.district}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(userItem.status)}
                      {userItem.isOnline && (
                        <Badge variant="outline" className="text-green-700 border-green-300">
                          Online
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {userItem.lastLogin ? (
                      <span className="text-sm">{formatDate(userItem.lastLogin)}</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">Never</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedUser(userItem);
                          setShowDetailsDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!canModify}
                        onClick={() => openEditUser(userItem as EditableUser)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant={userItem.status === 'active' ? 'destructive' : 'default'}
                        size="sm"
                        onClick={() => toggleUserStatus(userItem.id)}
                        disabled={!canModify}
                      >
                        {userItem.status === 'active' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </Button>
                      {canDeleteUsers && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          disabled={!canModify}
                          onClick={() => setUserToDelete(userItem as EditableUser)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
              })}
            </TableBody>
          </Table>
          )}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} of {pagination.totalPages} ({pagination.total} users)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages || loading}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <UserEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        user={userToEdit}
        formOptions={formOptions}
        formOptionsLoading={formOptionsLoading}
        onSaved={fetchUsers}
      />

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user account?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes{' '}
              <strong>{userToDelete?.fullName ?? userToDelete?.username}</strong>. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void handleDeleteUser();
              }}
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Complete information for {selectedUser?.fullName || 'the selected user'}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Full Name</p>
                  <p>{selectedUser.fullName}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Username</p>
                  <p>{selectedUser.username}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Email</p>
                  <p>{selectedUser.email}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Phone</p>
                  <p>{selectedUser.phone || '—'}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">User ID</p>
                  <p>{selectedUser.id}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Role</p>
                  {getRoleBadge(selectedUser.role)}
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Status</p>
                  {getStatusBadge(selectedUser.status)}
                </div>
              </div>
              {selectedUser.stationName && (
                <div className="text-sm">
                  <p className="font-medium text-muted-foreground">Assigned Station</p>
                  <p>{selectedUser.stationName}</p>
                </div>
              )}
              {selectedUser.region && (
                <div className="text-sm">
                  <p className="font-medium text-muted-foreground">Region/District</p>
                  <p>{selectedUser.region}{selectedUser.district && ` - ${selectedUser.district}`}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Created</p>
                  <p>{formatDate(selectedUser.createdAt)}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Last Login</p>
                  <p>{selectedUser.lastLogin ? formatDate(selectedUser.lastLogin) : 'Never'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}