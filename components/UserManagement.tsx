import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from './AuthContext';
import { 
  Users, 
  Plus, 
  Edit, 
  Eye,
  EyeOff,
  Mail,
  Building,
  UserCheck,
  UserX,
  Crown,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import { cn } from './ui/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { userRoles } from './constants/userRoles';
import {
  USER_FORM_REGIONS,
  userFormDistrictsForRegion,
} from './UserManagement/userFormGeoOptions';
import { DISTRICTS_BY_REGION } from './constants/ghanaDistricts';
import { formatDate } from './utils/helpers';
import { userApi, parseListResponse } from './utils/api';
import { TablePagination } from './shared/TablePagination';
import { ScrollableTable } from './shared/ScrollableTable';
import { RisePreloader, RiseStatusAlert } from './shared/feedback';
import { PageHeader } from './shared/PageHeader';
import { DashboardStatCard } from './Dashboard/DashboardStatCard';
import { AccessRestricted } from './AccessRestricted';
import {
  DEFAULT_LIST_PAGE_SIZE,
  parsePagination,
  type ListPagination,
} from './utils/api/client';
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
import { UserEditDialog, type EditableUser, type UserFormOptions } from './UserManagement/UserEditDialog';
import { UserCreateDialog, type NewUserFormState } from './UserManagement/UserCreateDialog';
import { UserDetailsDialog } from './UserManagement/UserDetailsDialog';
import { UserOnlineBadge, UserRoleBadge, UserStatusBadge } from './UserManagement/userBadges';
import { canCreateUsers, canModifyUser } from './UserManagement/userAccess';
import {
  passwordsMatch,
  validatePasswordConfirmation,
  validatePasswordStrength,
} from './utils/passwordValidation';
import { notify } from './utils/notify';
import { usePageAction } from './context/PageActionContext';

export function UserManagement() {
  const { user, isSuperAdmin, isAdmin, hasPermission } = useAuth();
  const { pendingAction, clearAction } = usePageAction();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    fullName: '',
    phone: '',
    password: '',
    confirmPassword: '',
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
  const [pageSize, setPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);
  const [listPagination, setListPagination] = useState<ListPagination | null>(null);
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
        const data = response.data as UserFormOptions;
        setFormOptions({
          ...data,
          regions: [...USER_FORM_REGIONS],
          districtsByRegion: { ...DISTRICTS_BY_REGION },
        });
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

  const newUserPasswordReady = useMemo(() => {
    if (validatePasswordStrength(newUser.password)) return false;
    return passwordsMatch(newUser.password, newUser.confirmPassword);
  }, [newUser.password, newUser.confirmPassword]);

  const syncPasswordFieldErrors = (password: string, confirmPassword: string) => {
    setFormErrors((prev) => {
      const next = { ...prev };
      const strengthError = validatePasswordStrength(password);
      next.password = strengthError ?? '';

      if (!confirmPassword.trim()) {
        next.confirmPassword = '';
      } else {
        const confirmError = validatePasswordConfirmation(password, confirmPassword);
        next.confirmPassword = confirmError ?? '';
      }

      return next;
    });
  };
  const stationOptions = formOptions?.stations ?? [];
  const regionOptions = USER_FORM_REGIONS;
  const districtOptions = userFormDistrictsForRegion(newUser.region);

  const fetchUsers = useCallback(
    async (options?: { page?: number; pageSize?: number; silent?: boolean }) => {
      const queryPage = options?.page ?? page;
      const limit = options?.pageSize ?? pageSize;
      const silent = options?.silent ?? false;
      try {
        if (!silent) {
          setLoading(true);
        }
        setError(null);
        const response = await userApi.getAll({
          page: queryPage,
          limit,
          search: searchTerm.trim() || undefined,
          role: roleFilter !== 'all' ? roleFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        });
        if (response.success && response.data) {
          const data = response.data as Record<string, unknown>;
          const allRows = parseListResponse<Record<string, unknown>>(data, 'users');
          const stats = data.statistics as typeof statistics;
          if (stats && typeof stats === 'object') {
            setStatistics(stats);
          }

          const pag = parsePagination(data);
          const statTotal =
            stats && typeof stats.total === 'number' ? stats.total : null;

          if (pag) {
            setUsers(allRows);
            setListPagination({
              page: queryPage,
              limit: pag.limit ?? limit,
              totalItems: pag.totalItems,
              totalPages: Math.max(1, pag.totalPages),
            });
          } else if (allRows.length > limit) {
            const totalItems = statTotal ?? allRows.length;
            const totalPages = Math.max(1, Math.ceil(totalItems / limit));
            const start = (queryPage - 1) * limit;
            setUsers(allRows.slice(start, start + limit));
            setListPagination({
              page: queryPage,
              limit,
              totalItems,
              totalPages,
            });
          } else {
            const totalItems = statTotal ?? allRows.length;
            setUsers(allRows);
            setListPagination({
              page: queryPage,
              limit,
              totalItems,
              totalPages: Math.max(1, Math.ceil(totalItems / limit) || 1),
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
    },
    [page, pageSize, roleFilter, searchTerm, statusFilter]
  );

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
    void fetchUsers({ page: 1, pageSize: size });
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, roleFilter, statusFilter]);

  useEffect(() => {
    if (pendingAction === 'new-user') {
      handleAddDialogOpenChange(true);
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
    
    const passwordError = validatePasswordStrength(newUser.password);
    if (passwordError) {
      errors.password = passwordError;
    }

    const confirmError = validatePasswordConfirmation(
      newUser.password,
      newUser.confirmPassword
    );
    if (confirmError) {
      errors.confirmPassword = confirmError;
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

        const created = response.data as Record<string, unknown> | undefined;
        if (created && typeof created === 'object' && created.id != null) {
          setUsers((prev) => {
            const id = String(created.id);
            if (prev.some((u) => String(u.id) === id)) return prev;
            return [created, ...prev];
          });
        }

        setPage(1);
        await fetchUsers({ page: 1, silent: true });

        // Reset form
        setNewUser({ 
          username: '', 
          email: '', 
          fullName: '', 
          phone: '', 
          password: '',
          confirmPassword: '',
          role: 'station_worker', 
          stationId: '', 
          region: '', 
          district: '' 
        });
        setFormErrors({});
        setShowNewPassword(false);
        setShowConfirmPassword(false);
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

  const defaultNewUser = (): NewUserFormState => ({
    username: '',
    email: '',
    fullName: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'station_worker',
    stationId: '',
    region: '',
    district: '',
  });

  const resetNewUserForm = () => {
    setFormErrors({});
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setNewUser(defaultNewUser());
  };

  const handleAddDialogOpenChange = (open: boolean) => {
    setShowAddDialog(open);
    if (open) {
      void fetchFormOptions();
    } else {
      resetNewUserForm();
    }
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
        await fetchUsers({ silent: true });
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
        await fetchUsers({ silent: true });
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
      <AccessRestricted message="You need appropriate permissions to manage users." />
    );
  }

  if (loading && users.length === 0 && !error) {
    return (
      <div className="p-6 min-h-[420px] rise-dashboard-page">
        <RisePreloader variant="page" label="Loading users…" />
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

  const hasActiveFilters = roleFilter !== 'all' || statusFilter !== 'all' || Boolean(searchTerm.trim());
  const listTotal = listPagination?.totalItems ?? filteredUsers.length;

  return (
    <div className="min-h-full rise-dashboard-page">
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <PageHeader
          title="User management"
          description="Manage accounts, roles, and station assignments across RISE."
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void fetchUsers()}
                disabled={loading}
              >
                <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
                Refresh
              </Button>
              {canCreateUser ? (
                <Button size="sm" onClick={() => handleAddDialogOpenChange(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add user
                </Button>
              ) : null}
            </>
          }
        />

        {error && users.length === 0 ? (
          <RiseStatusAlert type="error" title="Could not load users">
            {error}
            <Button variant="outline" size="sm" className="mt-3" onClick={() => void fetchUsers()}>
              Try again
            </Button>
          </RiseStatusAlert>
        ) : null}

        {error && users.length > 0 && !loading ? (
          <RiseStatusAlert type="warning" title="User list may be incomplete">
            {error}
          </RiseStatusAlert>
        ) : null}

        <section className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-4 sm:p-5 ring-1 ring-border/40">
          <h2 className="text-sm font-semibold tracking-tight mb-4">Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            <DashboardStatCard title="Total users" value={totalUsers} icon={Users} accent="blue" hint="Registered accounts" />
            <DashboardStatCard title="Administrators" value={adminUsers} icon={Crown} accent="violet" hint="Admin roles" />
            <DashboardStatCard title="Active" value={activeUsers} icon={UserCheck} accent="emerald" hint="Can sign in" />
            <DashboardStatCard title="Suspended" value={suspendedUsers} icon={UserX} accent="amber" hint="Access restricted" />
          </div>
        </section>

      <Card className="rounded-2xl shadow-sm ring-1 ring-border/50 overflow-hidden border-0">
        <CardHeader className="space-y-4 border-b border-border/60 bg-muted/20 pb-4">
          <div>
            <CardTitle className="text-lg font-semibold">User registry</CardTitle>
            <CardDescription className="mt-1">
              {listTotal} user{listTotal === 1 ? '' : 's'} · search and filter
            </CardDescription>
          </div>
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9 h-10 bg-background/80"
                placeholder="Name, username, email…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-10 w-full sm:w-[180px] bg-background/80">
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
              <SelectTrigger className="h-10 w-full sm:w-[160px] bg-background/80">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-10 text-muted-foreground"
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('all');
                  setStatusFilter('all');
                }}
              >
                Clear
              </Button>
            ) : null}
          </div>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
            Super admin accounts are hidden from non–super admin viewers.
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <div className={loading ? 'opacity-60 pointer-events-none transition-opacity' : ''}>
          {filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <Users className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium">No users match your filters</p>
              <p className="text-xs text-muted-foreground mt-1">
                {hasActiveFilters ? 'Clear filters or adjust search.' : 'Add a user to get started.'}
              </p>
            </div>
          ) : (
          <ScrollableTable
            className="border-0 shadow-none ring-0"
            maxHeightClass="max-h-[min(70vh,560px)]"
            minWidthClass="min-w-[960px]"
          >
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>User</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Assignment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                  <TableCell>
                    <UserRoleBadge role={userItem.role} />
                  </TableCell>
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <UserStatusBadge status={userItem.status} />
                      {userItem.isOnline ? <UserOnlineBadge /> : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    {userItem.lastLogin ? (
                      <span className="text-sm">{formatDate(userItem.lastLogin)}</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">Never</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="View user"
                        onClick={() => {
                          setSelectedUser(userItem);
                          setShowDetailsDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Edit user"
                        disabled={!canModify}
                        onClick={() => openEditUser(userItem as EditableUser)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          'h-8 w-8',
                          userItem.status === 'active' && 'text-destructive hover:text-destructive'
                        )}
                        aria-label={userItem.status === 'active' ? 'Suspend user' : 'Activate user'}
                        onClick={() => toggleUserStatus(userItem.id)}
                        disabled={!canModify}
                      >
                        {userItem.status === 'active' ? (
                          <UserX className="h-4 w-4" />
                        ) : (
                          <UserCheck className="h-4 w-4" />
                        )}
                      </Button>
                      {canDeleteUsers ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          aria-label="Delete user"
                          disabled={!canModify}
                          onClick={() => setUserToDelete(userItem as EditableUser)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              );
              })}
            </TableBody>
          </Table>
          </ScrollableTable>
          )}
          </div>
          <TablePagination
            page={page}
            pagination={listPagination}
            onPageChange={handlePageChange}
            loading={loading}
            itemLabel="users"
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
            alwaysShow
          />
        </CardContent>
      </Card>

      <UserEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        user={userToEdit}
        formOptions={formOptions}
        formOptionsLoading={formOptionsLoading}
        onSaved={() => void fetchUsers({ silent: true })}
      />

      <UserCreateDialog
        open={showAddDialog}
        onOpenChange={handleAddDialogOpenChange}
        form={newUser}
        onFormChange={(patch) => setNewUser((prev) => ({ ...prev, ...patch }))}
        formErrors={formErrors}
        onClearFieldError={(field) =>
          setFormErrors((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
          })
        }
        onRoleChange={(value) => {
          setNewUser((prev) => ({ ...prev, role: value, stationId: '', region: '', district: '' }));
          setFormErrors({});
        }}
        onPasswordChange={(password, confirmPassword) => {
          setNewUser((prev) => ({ ...prev, password, confirmPassword }));
          syncPasswordFieldErrors(password, confirmPassword);
        }}
        isSubmitting={isSubmitting}
        formOptionsLoading={formOptionsLoading}
        formOptions={formOptions}
        selectedRoleOption={selectedRoleOption}
        stationOptions={stationOptions}
        regionOptions={regionOptions}
        districtOptions={districtOptions}
        showNewPassword={showNewPassword}
        showConfirmPassword={showConfirmPassword}
        onToggleNewPassword={() => setShowNewPassword((v) => !v)}
        onToggleConfirmPassword={() => setShowConfirmPassword((v) => !v)}
        passwordReady={newUserPasswordReady}
        onSubmit={() => void handleAddUser()}
      />

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent className="rounded-2xl">
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

      <UserDetailsDialog
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        user={selectedUser}
        canEdit={
          selectedUser
            ? canModifyUser(actorContext, selectedUser, isSuperAdmin(), hasPermission)
            : false
        }
        onEdit={() => {
          if (selectedUser) {
            setShowDetailsDialog(false);
            openEditUser(selectedUser as EditableUser);
          }
        }}
      />
      </div>
    </div>
  );
}