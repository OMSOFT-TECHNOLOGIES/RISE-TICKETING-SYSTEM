import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AlertCircle, Building, Loader2, Pencil, Shield, Users } from 'lucide-react';
import { userApi } from '../utils/api';
import { notify } from '../utils/notify';
import {
  USER_FORM_REGIONS,
  userFormDistrictsForRegion,
} from './userFormGeoOptions';
import { UserFieldError, UserFormSection, userFieldClass } from './userFormUi';

export type UserFormRoleOption = {
  value: string;
  label: string;
  description: string;
  requiresStation: boolean;
  requiresRegion: boolean;
};

export type UserFormStationOption = {
  id: string;
  name: string;
  region?: string;
  district?: string;
  city?: string;
};

export type UserFormOptions = {
  roles: UserFormRoleOption[];
  regions: string[];
  districtsByRegion: Record<string, string[]>;
  stations: UserFormStationOption[];
};

export type EditableUser = {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  stationId?: string;
  stationName?: string;
  region?: string;
  district?: string;
  status: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: EditableUser | null;
  formOptions: UserFormOptions | null;
  formOptionsLoading: boolean;
  onSaved: () => void;
};

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
];

export function UserEditDialog({
  open,
  onOpenChange,
  user,
  formOptions,
  formOptionsLoading,
  onSaved,
}: Props) {
  const [form, setForm] = useState<EditableUser | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && user) {
      setForm({ ...user, phone: user.phone ?? '' });
      setErrors({});
    }
  }, [open, user]);

  const selectedRoleOption = useMemo(
    () => formOptions?.roles.find((role) => role.value === form?.role),
    [formOptions, form?.role]
  );

  const regionOptions = USER_FORM_REGIONS;
  const districtOptions = userFormDistrictsForRegion(form?.region);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form?.fullName.trim()) next.fullName = 'Full name is required';
    if (!form?.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = 'Valid email is required';
    }
    if (!form?.phone?.trim() || !/^[0-9+\s()-]{10,}$/.test(form.phone)) {
      next.phone = 'Valid phone number is required';
    }
    if (selectedRoleOption?.requiresStation && !form?.stationId) {
      next.stationId = 'Station is required for this role';
    }
    if (selectedRoleOption?.requiresRegion && !form?.region?.trim()) {
      next.region = 'Region is required for this role';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!form) return;
    if (!validate()) {
      notify.error('Please correct the errors in the form');
      return;
    }

    setSubmitting(true);
    try {
      const assignedStation = formOptions?.stations.find((s) => s.id === form.stationId);
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone?.trim(),
        role: form.role,
        status: form.status,
        stationId: form.stationId || undefined,
        stationName: assignedStation?.name ?? form.stationName,
        region: form.region?.trim() || undefined,
        district: form.district?.trim() || undefined,
      };

      const response = await userApi.update(form.id, payload);
      if (response.success) {
        notify.success(response.message || 'User updated successfully');
        onSaved();
        onOpenChange(false);
      } else {
        notify.error('Failed to update user', { description: response.error });
      }
    } catch (err) {
      notify.error('Failed to update user', {
        description: err instanceof Error ? err.message : 'Please try again',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!form) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden rounded-2xl max-h-[min(92dvh,calc(100%-2rem))] flex flex-col">
        <DialogHeader className="border-b border-border/80 bg-gradient-to-br from-muted/50 to-background px-6 py-5 shrink-0">
          <div className="flex items-start gap-4 pr-6">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
              <Pencil className="h-5 w-5" strokeWidth={2.25} />
            </span>
            <div className="space-y-1 min-w-0">
              <DialogTitle className="text-xl font-semibold tracking-tight">Edit user</DialogTitle>
              <DialogDescription className="text-sm font-mono">@{form.username}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody className="px-6 py-5 space-y-8 flex-1 overflow-y-auto max-h-[min(58vh,520px)]">
          <UserFormSection title="Profile" description="Contact details and display name." icon={Users}>
            <div className="space-y-2">
              <Label htmlFor="edit-fullName">Full name</Label>
              <Input
                id="edit-fullName"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className={userFieldClass(Boolean(errors.fullName))}
                disabled={submitting}
              />
              <UserFieldError message={errors.fullName} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={userFieldClass(Boolean(errors.email))}
                  disabled={submitting}
                />
                <UserFieldError message={errors.email} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={form.phone ?? ''}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={userFieldClass(Boolean(errors.phone))}
                  disabled={submitting}
                />
                <UserFieldError message={errors.phone} />
              </div>
            </div>
          </UserFormSection>

          <UserFormSection title="Access" description="Role, status, and assignment." icon={Shield}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={form.role}
                  onValueChange={(value) =>
                    setForm({ ...form, role: value, stationId: '', region: '', district: '' })
                  }
                  disabled={submitting || formOptionsLoading}
                >
                  <SelectTrigger className={userFieldClass(false)}>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {(formOptions?.roles ?? []).map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) => setForm({ ...form, status: value })}
                  disabled={submitting}
                >
                  <SelectTrigger className={userFieldClass(false)}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedRoleOption?.requiresStation ? (
              <div className="space-y-2">
                <Label>Assigned station</Label>
                <Select
                  value={form.stationId ?? ''}
                  onValueChange={(value) => setForm({ ...form, stationId: value })}
                  disabled={submitting || formOptionsLoading}
                >
                  <SelectTrigger className={userFieldClass(Boolean(errors.stationId))}>
                    <SelectValue placeholder="Select station" />
                  </SelectTrigger>
                  <SelectContent>
                    {(formOptions?.stations ?? []).map((station) => (
                      <SelectItem key={station.id} value={station.id}>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 shrink-0 opacity-70" />
                          {station.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <UserFieldError message={errors.stationId} />
              </div>
            ) : null}

            {selectedRoleOption?.requiresRegion ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Region</Label>
                  <Select
                    value={form.region ?? ''}
                    onValueChange={(value) => setForm({ ...form, region: value, district: '' })}
                    disabled={submitting || formOptionsLoading}
                  >
                    <SelectTrigger className={userFieldClass(Boolean(errors.region))}>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {regionOptions.map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <UserFieldError message={errors.region} />
                </div>
                <div className="space-y-2">
                  <Label>District (optional)</Label>
                  <Select
                    value={form.district ?? ''}
                    onValueChange={(value) => setForm({ ...form, district: value })}
                    disabled={submitting || !form.region}
                  >
                    <SelectTrigger className={userFieldClass(false)}>
                      <SelectValue placeholder="Select district" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {districtOptions.map((district) => (
                        <SelectItem key={district} value={district}>
                          {district}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : null}

            {formOptionsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading form options…
              </div>
            ) : null}

            {!formOptions && !formOptionsLoading ? (
              <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Form options unavailable — lists may be incomplete.
              </div>
            ) : null}
          </UserFormSection>
        </DialogBody>

        <DialogFooter className="px-6 py-4 border-t border-border/80 bg-muted/20 gap-2 sm:justify-end shrink-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : (
              'Save changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
