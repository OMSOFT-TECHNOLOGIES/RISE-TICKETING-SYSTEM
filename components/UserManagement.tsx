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
import { mockUsers, mockStations, userRoles, statusOptions } from './constants/mockData';
import { formatDate, generateId, getStatusInfo } from './utils/helpers';

export function UserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState(mockUsers);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'worker',
    stationId: '',
    password: ''
  });

  const handleAddUser = () => {
    const station = mockStations.find(s => s.id === newUser.stationId);
    const userToAdd = {
      ...newUser,
      id: generateId('USR', users.length),
      stationName: station?.name || null,
      status: 'active',
      joinDate: new Date().toISOString().split('T')[0],
      lastLogin: null
    };
    setUsers([...users, userToAdd]);
    setNewUser({ name: '', email: '', phone: '', role: 'worker', stationId: '', password: '' });
    setShowAddDialog(false);
  };

  const getRoleBadge = (role: string) => {
    const roleInfo = userRoles.find(r => r.value === role);
    const IconComponent = role === 'admin' ? Crown : UserCheck;
    return (
      <Badge className={roleInfo?.color || 'bg-gray-100 text-gray-800'}>
        <IconComponent className="h-3 w-3 mr-1" />
        {roleInfo?.label || role}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = getStatusInfo(status, 'user');
    return (
      <Badge className={statusInfo?.color || 'bg-gray-100 text-gray-800'}>
        {statusInfo?.label || status}
      </Badge>
    );
  };

  const toggleUserStatus = (userId: string) => {
    setUsers(users.map(u => {
      if (u.id === userId) {
        return { ...u, status: u.status === 'active' ? 'suspended' : 'active' };
      }
      return u;
    }));
  };

  if (user?.role !== 'admin') {
    return (
      <div className="p-6 text-center">
        <Shield className="h-16 w-16 mx-auto mb-4 text-gray-400" />
        <h2 className="text-2xl font-bold text-gray-600 mb-2">Access Restricted</h2>
        <p className="text-gray-500">Only administrators can access user management.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600">Manage user accounts and permissions across the RISE system</p>
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
              <DialogDescription>Create a new user account for the RISE system.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="userName">Full Name</Label>
                <Input
                  id="userName"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  placeholder="e.g., John Doe"
                />
              </div>
              <div>
                <Label htmlFor="userEmail">Email</Label>
                <Input
                  id="userEmail"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="user@rise.gov.gh"
                />
              </div>
              <div>
                <Label htmlFor="userPhone">Phone Number</Label>
                <Input
                  id="userPhone"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  placeholder="+233 XX XXX XXXX"
                />
              </div>
              <div>
                <Label htmlFor="userRole">Role</Label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {userRoles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {newUser.role === 'worker' && (
                <div>
                  <Label htmlFor="userStation">Station</Label>
                  <Select value={newUser.stationId} onValueChange={(value) => setNewUser({...newUser, stationId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select station" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockStations.map((station) => (
                        <SelectItem key={station.id} value={station.id}>{station.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button onClick={handleAddUser} className="w-full">Create User</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold">{users.length}</p>
            <p className="text-sm text-gray-600">Total Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Crown className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <p className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</p>
            <p className="text-sm text-gray-600">Administrators</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <UserCheck className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold">{users.filter(u => u.status === 'active').length}</p>
            <p className="text-sm text-gray-600">Active Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <UserX className="h-8 w-8 mx-auto mb-2 text-red-600" />
            <p className="text-2xl font-bold">{users.filter(u => u.status === 'suspended').length}</p>
            <p className="text-sm text-gray-600">Suspended</p>
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
                <TableHead>Station</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((userItem) => (
                <TableRow key={userItem.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{userItem.name}</p>
                      <p className="text-sm text-gray-500">{userItem.id}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="flex items-center space-x-1 text-sm">
                        <Mail className="h-3 w-3" />
                        <span>{userItem.email}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-sm">
                        <Phone className="h-3 w-3" />
                        <span>{userItem.phone}</span>
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
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(userItem.status)}</TableCell>
                  <TableCell>
                    {userItem.lastLogin ? (
                      <span className="text-sm">{formatDate(userItem.lastLogin)}</span>
                    ) : (
                      <span className="text-gray-400 text-sm">Never</span>
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
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant={userItem.status === 'active' ? 'destructive' : 'default'}
                        size="sm"
                        onClick={() => toggleUserStatus(userItem.id)}
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
            <DialogDescription>Complete information for {selectedUser?.name}</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700">Full Name</p>
                  <p>{selectedUser.name}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">User ID</p>
                  <p>{selectedUser.id}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700">Email</p>
                  <p>{selectedUser.email}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Phone</p>
                  <p>{selectedUser.phone}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700">Role</p>
                  {getRoleBadge(selectedUser.role)}
                </div>
                <div>
                  <p className="font-medium text-gray-700">Status</p>
                  {getStatusBadge(selectedUser.status)}
                </div>
              </div>
              {selectedUser.stationName && (
                <div className="text-sm">
                  <p className="font-medium text-gray-700">Assigned Station</p>
                  <p>{selectedUser.stationName}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700">Join Date</p>
                  <p>{formatDate(selectedUser.joinDate)}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Last Login</p>
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