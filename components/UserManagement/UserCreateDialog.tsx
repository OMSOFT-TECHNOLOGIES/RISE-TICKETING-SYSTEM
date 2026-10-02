import React from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { AlertCircle, Building, Eye, EyeOff, Loader2, Shield, UserPlus, Users } from 'lucide-react';
import { cn } from '../ui/utils';
import { PasswordConfirmFeedback } from '../shared/PasswordConfirmFeedback';
import { UserFieldError, UserFormHint, UserFormSection, userFieldClass } from './userFormUi';
import { UserRoleBadge } from './userBadges';
import type { UserFormOptions, UserFormRoleOption } from './UserEditDialog';

export type NewUserFormState = {
  username: string;
  email: string;
  fullName: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: string;
  stationId: string;
  region: string;
  district: string;
};

type StationOption = UserFormOptions['stations'][number];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: NewUserFormState;
  onFormChange: (patch: Partial<NewUserFormState>) => void;
  formErrors: Record<string, string>;
  onClearFieldError: (field: string) => void;
  onRoleChange: (role: string) => void;
  onPasswordChange: (password: string, confirmPassword: string) => void;
  isSubmitting: boolean;
  formOptionsLoading: boolean;
  formOptions: UserFormOptions | null;
  selectedRoleOption?: UserFormRoleOption;
  stationOptions: StationOption[];
  regionOptions: string[];
  districtOptions: string[];
  showNewPassword: boolean;
  showConfirmPassword: boolean;
  onToggleNewPassword: () => void;
  onToggleConfirmPassword: () => void;
  passwordReady: boolean;
  onSubmit: () => void;
};

function FieldLabel({ htmlFor, required, children }: { htmlFor?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <Label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
      {children}
      {required ? <span className="text-destructive ml-0.5">*</span> : null}
    </Label>
  );
}

export function UserCreateDialog({
  open,
  onOpenChange,
  form,
  onFormChange,
  formErrors,
  onClearFieldError,
  onRoleChange,
  onPasswordChange,
  isSubmitting,
  formOptionsLoading,
  formOptions,
  selectedRoleOption,
  stationOptions,
  regionOptions,
  districtOptions,
  showNewPassword,
  showConfirmPassword,
  onToggleNewPassword,
  onToggleConfirmPassword,
  passwordReady,
  onSubmit,
}: Props) {
  const disabled = isSubmitting || formOptionsLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex w-full max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-border bg-gradient-to-br from-muted/60 to-background px-6 py-5 shrink-0">
          <div className="flex items-start gap-4 pr-8">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
              <UserPlus className="h-5 w-5" strokeWidth={2.25} />
            </span>
            <div className="space-y-1 min-w-0">
              <DialogTitle className="text-xl font-semibold tracking-tight text-foreground">
                Add user
              </DialogTitle>
              <DialogDescription className="text-sm text-foreground/70 leading-relaxed">
                Create a RISE account with role, credentials, and station or region assignment where
                required.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody className="px-6 py-5 space-y-8 min-h-0 flex-1">
          {!formOptions && !formOptionsLoading ? (
            <div
              className="flex items-start gap-2 rounded-lg border border-amber-400 bg-amber-100 px-3 py-2.5 text-sm text-amber-950 dark:bg-amber-950/50 dark:border-amber-500/60 dark:text-amber-100"
              role="alert"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Could not load roles and stations. Refresh the page and try again.</span>
            </div>
          ) : null}

          <UserFormSection
            title="Personal information"
            description="Legal name and sign-in credentials."
            icon={Users}
          >
            <div className="space-y-2">
              <FieldLabel htmlFor="create-fullName" required>
                Full name
              </FieldLabel>
              <Input
                id="create-fullName"
                value={form.fullName}
                onChange={(e) => {
                  onFormChange({ fullName: e.target.value });
                  onClearFieldError('fullName');
                }}
                placeholder="e.g. John Mensah Doe"
                className={userFieldClass(Boolean(formErrors.fullName))}
                disabled={disabled}
              />
              <UserFieldError message={formErrors.fullName} />
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="create-username" required>
                Username
              </FieldLabel>
              <Input
                id="create-username"
                value={form.username}
                onChange={(e) => {
                  onFormChange({ username: e.target.value.toLowerCase() });
                  onClearFieldError('username');
                }}
                placeholder="j.doe"
                className={cn(userFieldClass(Boolean(formErrors.username)), 'font-mono')}
                disabled={disabled}
              />
              <UserFieldError message={formErrors.username} />
              {!formErrors.username ? (
                <UserFormHint>Lowercase letters, numbers, dots, hyphens, underscores</UserFormHint>
              ) : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <FieldLabel htmlFor="create-email" required>
                  Email
                </FieldLabel>
                <Input
                  id="create-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => {
                    onFormChange({ email: e.target.value });
                    onClearFieldError('email');
                  }}
                  placeholder="user@rise.gov.gh"
                  className={userFieldClass(Boolean(formErrors.email))}
                  disabled={disabled}
                />
                <UserFieldError message={formErrors.email} />
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="create-phone" required>
                  Phone
                </FieldLabel>
                <Input
                  id="create-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => {
                    onFormChange({ phone: e.target.value });
                    onClearFieldError('phone');
                  }}
                  placeholder="+233 XX XXX XXXX"
                  className={userFieldClass(Boolean(formErrors.phone))}
                  disabled={disabled}
                />
                <UserFieldError message={formErrors.phone} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <FieldLabel htmlFor="create-password" required>
                  Password
                </FieldLabel>
                <div className="relative">
                  <Input
                    id="create-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => onPasswordChange(e.target.value, form.confirmPassword)}
                    placeholder="Min. 8 characters"
                    className={cn(userFieldClass(Boolean(formErrors.password)), 'pr-10')}
                    disabled={disabled}
                    autoComplete="new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-10 w-10 text-foreground/70 hover:text-foreground"
                    onClick={onToggleNewPassword}
                    tabIndex={-1}
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <UserFieldError message={formErrors.password} />
                {!formErrors.password ? (
                  <UserFormHint>Uppercase, lowercase, and a number</UserFormHint>
                ) : null}
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="create-confirmPassword" required>
                  Confirm password
                </FieldLabel>
                <div className="relative">
                  <Input
                    id="create-confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={(e) => onPasswordChange(form.password, e.target.value)}
                    placeholder="Re-enter password"
                    className={cn(userFieldClass(Boolean(formErrors.confirmPassword)), 'pr-10')}
                    disabled={disabled}
                    autoComplete="new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-10 w-10 text-foreground/70 hover:text-foreground"
                    onClick={onToggleConfirmPassword}
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <UserFieldError message={formErrors.confirmPassword} />
              </div>
            </div>
            <PasswordConfirmFeedback password={form.password} confirmPassword={form.confirmPassword} />
          </UserFormSection>

          <UserFormSection
            title="Role and assignment"
            description="Access level and operational scope."
            icon={Shield}
          >
            <div className="space-y-2">
              <FieldLabel required>System role</FieldLabel>
              <Select value={form.role} onValueChange={onRoleChange} disabled={disabled}>
                <SelectTrigger className={userFieldClass(false)}>
                  <SelectValue placeholder={formOptionsLoading ? 'Loading roles…' : 'Select role'} />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {(formOptions?.roles ?? []).map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="py-0.5 text-left">
                        <div className="font-medium text-foreground">{role.label}</div>
                        <div className="text-xs text-foreground/65">{role.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {form.role ? (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                <span className="text-xs font-medium text-foreground/70">Selected role</span>
                <UserRoleBadge role={form.role} />
              </div>
            ) : null}

            {selectedRoleOption ? (
              <div className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground/85 leading-relaxed">
                {selectedRoleOption.description}
                {selectedRoleOption.requiresStation ? (
                  <span className="block mt-1 text-xs font-medium text-foreground">
                    Requires an assigned station.
                  </span>
                ) : null}
                {selectedRoleOption.requiresRegion ? (
                  <span className="block mt-1 text-xs font-medium text-foreground">
                    Requires a region (district optional).
                  </span>
                ) : null}
              </div>
            ) : null}

            {selectedRoleOption?.requiresStation ? (
              <div className="space-y-2">
                <FieldLabel required>Assigned station</FieldLabel>
                <Select
                  value={form.stationId}
                  onValueChange={(value) => {
                    onFormChange({ stationId: value });
                    onClearFieldError('stationId');
                  }}
                  disabled={disabled}
                >
                  <SelectTrigger className={userFieldClass(Boolean(formErrors.stationId))}>
                    <SelectValue placeholder={formOptionsLoading ? 'Loading…' : 'Select station'} />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {stationOptions.length === 0 ? (
                      <div className="px-2 py-4 text-center text-sm text-foreground/70">
                        No stations available
                      </div>
                    ) : (
                      stationOptions.map((station) => (
                        <SelectItem key={station.id} value={station.id}>
                          <div className="flex items-start gap-2 py-0.5">
                            <Building className="h-4 w-4 shrink-0 mt-0.5 text-foreground/70" />
                            <div className="text-left">
                              <div className="font-medium text-foreground">{station.name}</div>
                              {(station.city || station.region) && (
                                <div className="text-xs text-foreground/65">
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
                <UserFieldError message={formErrors.stationId} />
              </div>
            ) : null}

            {selectedRoleOption?.requiresRegion ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <FieldLabel required>Region</FieldLabel>
                  <Select
                    value={form.region}
                    onValueChange={(value) => {
                      onFormChange({ region: value, district: '' });
                      onClearFieldError('region');
                    }}
                    disabled={disabled}
                  >
                    <SelectTrigger className={userFieldClass(Boolean(formErrors.region))}>
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
                  <UserFieldError message={formErrors.region} />
                </div>
                <div className="space-y-2">
                  <FieldLabel>District (optional)</FieldLabel>
                  <Select
                    value={form.district || undefined}
                    onValueChange={(value) => onFormChange({ district: value })}
                    disabled={disabled || !form.region}
                  >
                    <SelectTrigger className={userFieldClass(false)}>
                      <SelectValue placeholder={form.region ? 'Select district' : 'Select region first'} />
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
              <div className="flex items-center gap-2 text-sm font-medium text-foreground/70">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading roles and stations…
              </div>
            ) : null}
          </UserFormSection>
        </DialogBody>

        <DialogFooter className="px-6 py-4 border-t border-border bg-muted/40 gap-2 sm:justify-end shrink-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || formOptionsLoading || !formOptions || !passwordReady}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating…
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Create user
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
