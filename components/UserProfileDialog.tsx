import React, { useState, useEffect, useMemo } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { useAuth } from './AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from './ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from './ui/tabs';
import {
  User,
  MapPin,
  Shield,
  Calendar,
  Edit2,
  Save,
  X,
  Key,
  Activity,
  Clock,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { notify } from './utils/notify';
import { PasswordConfirmFeedback } from './shared/PasswordConfirmFeedback';
import {
  passwordsMatch,
  validatePasswordConfirmation,
  validatePasswordStrength,
} from './utils/passwordValidation';
import { authApi, dashboardApi } from './utils/api';
import { userRoles } from './constants/userRoles';

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProfileUser {
  id?: string;
  username?: string;
  fullName?: string;
  name?: string;
  email?: string;
  phone?: string;
  bio?: string;
  role?: string;
  stationName?: string;
  createdAt?: string;
  lastLogin?: string;
}

interface ActivityItem {
  id: string;
  action: string;
  timestamp: string;
  details: string;
}

export function UserProfileDialog({ open, onOpenChange }: UserProfileDialogProps) {
  const { user } = useAuth();
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(user);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.fullName || '',
    email: user?.email || '',
    phone: '',
    bio: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const displayName = profileUser?.fullName ?? profileUser?.name ?? user?.fullName ?? '';
  const displayEmail = profileUser?.email ?? user?.email ?? '';
  const displayRole = profileUser?.role ?? user?.role ?? '';

  const passwordChangeReady = useMemo(() => {
    if (!editForm.currentPassword.trim()) return false;
    if (validatePasswordStrength(editForm.newPassword)) return false;
    return passwordsMatch(editForm.newPassword, editForm.confirmPassword);
  }, [editForm.currentPassword, editForm.newPassword, editForm.confirmPassword]);

  const getRoleLabel = (role: string) => {
    const roleInfo = userRoles.find((r) => r.value === role);
    return roleInfo?.label ?? role.replace(/_/g, ' ');
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };

  useEffect(() => {
    if (!open) return;

    const loadProfile = async () => {
      setLoadingProfile(true);
      try {
        const response = await authApi.getCurrentUser();
        if (response.success && response.data) {
          const data = response.data as ProfileUser;
          setProfileUser(data);
          setEditForm({
            name: data.fullName ?? data.name ?? user?.fullName ?? '',
            email: data.email ?? user?.email ?? '',
            phone: data.phone ?? '',
            bio: data.bio ?? '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoadingProfile(false);
      }
    };

    const loadActivities = async () => {
      setLoadingActivities(true);
      try {
        const response = await dashboardApi.getActivities({ limit: 10, stationId: user?.stationId });
        if (response.success && response.data) {
          const items = Array.isArray(response.data)
            ? response.data
            : (response.data as { activities?: unknown[] }).activities ?? [];
          setActivities(
            (items as Record<string, unknown>[]).map((item, index) => ({
              id: String(item.id ?? index),
              action: String(item.action ?? item.type ?? item.message ?? 'Activity'),
              timestamp: String(item.timestamp ?? item.time ?? item.createdAt ?? new Date().toISOString()),
              details: String(item.details ?? item.description ?? item.message ?? ''),
            }))
          );
        }
      } catch (err) {
        console.error('Failed to load activities:', err);
      } finally {
        setLoadingActivities(false);
      }
    };

    void loadProfile();
    void loadActivities();
  }, [open, user?.fullName, user?.email, user?.stationId]);

  const handleSaveProfile = async () => {
    if (!editForm.name || !editForm.email) {
      notify.error('Name and email are required');
      return;
    }

    setIsSaving(true);
    try {
      const response = await authApi.updateProfile({
        fullName: editForm.name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim() || undefined,
        bio: editForm.bio.trim() || undefined,
      });

      if (response.success) {
        notify.success(response.message || 'Profile updated successfully');
        setProfileUser((prev) => ({
          ...prev,
          fullName: editForm.name.trim(),
          email: editForm.email.trim(),
          phone: editForm.phone.trim(),
          bio: editForm.bio.trim(),
        }));
        setIsEditing(false);
      } else {
        notify.error('Failed to update profile', { description: response.error });
      }
    } catch (err) {
      notify.error('Failed to update profile', {
        description: err instanceof Error ? err.message : 'Please try again',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!editForm.currentPassword.trim()) {
      notify.error('Please enter your current password');
      return;
    }

    const strengthError = validatePasswordStrength(editForm.newPassword);
    if (strengthError) {
      notify.error(strengthError);
      return;
    }

    const confirmError = validatePasswordConfirmation(
      editForm.newPassword,
      editForm.confirmPassword
    );
    if (confirmError) {
      notify.error(confirmError);
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await authApi.changePassword({
        currentPassword: editForm.currentPassword,
        newPassword: editForm.newPassword,
      });

      if (response.success) {
        notify.success(response.message || 'Password changed successfully');
        setEditForm({
          ...editForm,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        notify.error('Failed to change password', { description: response.error });
      }
    } catch (err) {
      notify.error('Failed to change password', {
        description: err instanceof Error ? err.message : 'Please try again',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Profile
          </DialogTitle>
          <DialogDescription>
            View and manage your account information and settings
          </DialogDescription>
        </DialogHeader>

        {loadingProfile ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#193cb8]" />
          </div>
        ) : (
          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                          {displayName ? getUserInitials(displayName) : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-semibold">{displayName}</h3>
                        <p className="text-sm text-muted-foreground">{displayEmail}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={displayRole.includes('admin') ? 'default' : 'secondary'}>
                            <Shield className="h-3 w-3 mr-1" />
                            {getRoleLabel(displayRole)}
                          </Badge>
                          {(profileUser?.stationName ?? user?.stationName) && (
                            <Badge variant="outline">
                              <MapPin className="h-3 w-3 mr-1" />
                              {profileUser?.stationName ?? user?.stationName}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant={isEditing ? 'destructive' : 'outline'}
                      size="sm"
                      onClick={() => {
                        if (isEditing) {
                          setEditForm({
                            name: displayName,
                            email: displayEmail,
                            phone: profileUser?.phone ?? '',
                            bio: profileUser?.bio ?? '',
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: '',
                          });
                        }
                        setIsEditing(!isEditing);
                      }}
                    >
                      {isEditing ? (
                        <>
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </>
                      ) : (
                        <>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="profile-name">Full Name</Label>
                      <Input
                        id="profile-name"
                        value={isEditing ? editForm.name : displayName}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profile-email">Email Address</Label>
                      <Input
                        id="profile-email"
                        type="email"
                        value={isEditing ? editForm.email : displayEmail}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profile-phone">Phone Number</Label>
                      <Input
                        id="profile-phone"
                        value={isEditing ? editForm.phone : profileUser?.phone ?? ''}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        disabled={!isEditing}
                        placeholder="Not provided"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profile-role">Role</Label>
                      <Input id="profile-role" value={getRoleLabel(displayRole)} disabled />
                    </div>
                  </div>

                  {(profileUser?.stationName ?? user?.stationName) && (
                    <div className="space-y-2">
                      <Label htmlFor="profile-station">Assigned Station</Label>
                      <Input
                        id="profile-station"
                        value={profileUser?.stationName ?? user?.stationName ?? ''}
                        disabled
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="profile-bio">Bio / Notes</Label>
                    <Textarea
                      id="profile-bio"
                      value={isEditing ? editForm.bio : profileUser?.bio ?? ''}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Add a brief description about yourself..."
                      rows={3}
                    />
                  </div>

                  {isEditing && (
                    <div className="flex gap-2">
                      <Button onClick={handleSaveProfile} className="flex-1" disabled={isSaving}>
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Changes
                      </Button>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Member since:</span>
                        <p className="font-medium">
                          {profileUser?.createdAt
                            ? new Date(profileUser.createdAt).toLocaleDateString()
                            : '—'}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last login:</span>
                        <p className="font-medium">
                          {profileUser?.lastLogin
                            ? new Date(profileUser.lastLogin).toLocaleString()
                            : '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Change Password
                  </CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={editForm.currentPassword}
                      onChange={(e) => setEditForm({ ...editForm, currentPassword: e.target.value })}
                      placeholder="Enter current password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={editForm.newPassword}
                      onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={editForm.confirmPassword}
                      onChange={(e) => setEditForm({ ...editForm, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                    />
                  </div>
                  <PasswordConfirmFeedback
                    password={editForm.newPassword}
                    confirmPassword={editForm.confirmPassword}
                  />
                  <Button
                    onClick={handleChangePassword}
                    className="w-full"
                    disabled={isChangingPassword || !passwordChangeReady}
                  >
                    {isChangingPassword ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Key className="h-4 w-4 mr-2" />
                    )}
                    Change Password
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Security Information</CardTitle>
                  <CardDescription>
                    Account security and access details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Account Status</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Active & Verified</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-[#193cb8]" />
                        <span className="text-sm font-medium">Last Login</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {profileUser?.lastLogin
                          ? new Date(profileUser.lastLogin).toLocaleString()
                          : '—'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>
                    Your recent actions and system usage
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingActivities ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-[#193cb8]" />
                    </div>
                  ) : activities.length > 0 ? (
                    <div className="space-y-4">
                      {activities.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{activity.action}</p>
                            <p className="text-sm text-muted-foreground">{activity.details}</p>
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {new Date(activity.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No recent activity found
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
