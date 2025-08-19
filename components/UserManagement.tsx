import React, { useState } from 'react';
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
  Crown
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { mockUsers, mockStations, userRoles } from './constants/mockData';
import { formatDate, generateId, getStatusBadgeClass, getRoleBadgeClass } from './utils/helpers';
import { toast } from 'sonner';

export function UserManagement() {
  const { user, isSuperAdmin, hasPermission } = useAuth();
  const [users, setUsers] = useState(mockUsers);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    fullName: '',
    role: 'station_worker',
    stationId: '',
    region: '',
    district: ''
  });

  const handleAddUser = () => {
    if (!newUser.username || !newUser.email || !newUser.fullName) {
      toast.error('Please fill in all required fields');
      return;
    }

    const station = mockStations.find(s => s.id === newUser.stationId);
    const userToAdd = {
      id: generateId('USR', users.length),
      username: newUser.username,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
      stationId: newUser.stationId || undefined,
      stationName: station?.name || undefined,
      region: newUser.region || undefined,
      district: newUser.district || undefined,
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      lastLogin: undefined,
      permissions: [] // This would be determined by role in a real system
    };
    
    setUsers([...users, userToAdd]);
    setNewUser({ 
      username: '', 
      email: '', 
      fullName: '', 
      role: 'station_worker', 
      stationId: '', 
      region: '', 
      district: '' 
    });
    setShowAddDialog(false);
    toast.success('User created successfully');
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

  const toggleUserStatus = (userId: string) => {
    setUsers(users.map(u => {
      if (u.id === userId) {
        const newStatus = u.status === 'active' ? 'suspended' : 'active';
        toast.success(`User ${newStatus === 'active' ? 'activated' : 'suspended'} successfully`);
        return { ...u, status: newStatus };
      }
      return u;
    }));
  };

  // Check access permissions - Super Admin always has access
  const canManageUsers = isSuperAdmin() || hasPermission('manage_basic_users');
  
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

  // Filter users based on permissions
  const filteredUsers = isSuperAdmin() ? 
    users : 
    users.filter(u => u.role !== 'super_admin'); // Regular admins can't see super admin accounts

  const totalUsers = filteredUsers.length;
  const adminUsers = filteredUsers.filter(u => u.role.includes('admin')).length;
  const activeUsers = filteredUsers.filter(u => u.status === 'active').length;
  const suspendedUsers = filteredUsers.filter(u => u.status === 'suspended').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>User Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts and permissions across the RISE system
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account for the RISE system. Fill in the required information below.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  placeholder="e.g., john.doe"
                />
              </div>
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({...newUser, fullName: e.target.value})}
                  placeholder="e.g., John Doe"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="user@rise.gov.gh"
                />
              </div>
              <div>
                <Label htmlFor="role">Role *</Label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {userRoles
                      .filter(role => isSuperAdmin() || role.value !== 'super_admin') // Regular admins can't create super admin users
                      .map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div>
                          <div className="font-medium">{role.label}</div>
                          <div className="text-sm text-muted-foreground">{role.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {newUser.role === 'station_worker' && (
                <div>
                  <Label htmlFor="station">Station</Label>
                  <Select value={newUser.stationId} onValueChange={(value) => setNewUser({...newUser, stationId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select station" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockStations.map((station) => (
                        <SelectItem key={station.id} value={station.id}>
                          {station.name} - {station.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {(newUser.role.includes('manager') || newUser.role.includes('reporter')) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="region">Region</Label>
                    <Input
                      id="region"
                      value={newUser.region}
                      onChange={(e) => setNewUser({...newUser, region: e.target.value})}
                      placeholder="e.g., Greater Accra"
                    />
                  </div>
                  <div>
                    <Label htmlFor="district">District</Label>
                    <Input
                      id="district"
                      value={newUser.district}
                      onChange={(e) => setNewUser({...newUser, district: e.target.value})}
                      placeholder="e.g., Accra"
                    />
                  </div>
                </div>
              )}
              <Button onClick={handleAddUser} className="w-full">
                Create User
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold">{totalUsers}</p>
            <p className="text-sm text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Crown className="h-8 w-8 mx-auto mb-2 text-purple-600" />
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
        <CardHeader>
          <CardTitle>User Registry</CardTitle>
        </CardHeader>
        <CardContent>
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
              {filteredUsers.map((userItem) => (
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
                  <TableCell>{getStatusBadge(userItem.status)}</TableCell>
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
                      <Button variant="outline" size="sm" disabled={!isSuperAdmin() && userItem.role.includes('admin')}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant={userItem.status === 'active' ? 'destructive' : 'default'}
                        size="sm"
                        onClick={() => toggleUserStatus(userItem.id)}
                        disabled={!isSuperAdmin() && userItem.role.includes('admin')}
                      >
                        {userItem.status === 'active' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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