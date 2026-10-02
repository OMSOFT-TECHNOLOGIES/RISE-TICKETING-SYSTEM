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
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { IdCard, Loader2, MapPin, Phone, UserCheck, UserPlus } from 'lucide-react';
import { StationFormSelect } from '../shared/StationFormSelect';
import { cn } from '../ui/utils';
import type { StationPickerOption } from '../utils/stationPicker';

export type RegisterDriverFormState = {
  name: string;
  phone: string;
  email: string;
  licenseNumber: string;
  licenseExpiry: string;
  experience: string;
  address: string;
  emergencyContact: string;
  vehicleId: string;
};

type VehicleOption = {
  id: number | string;
  registrationNumber: string;
  make?: string;
  model?: string;
};

type RegisterDriverDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: RegisterDriverFormState;
  onFormChange: (patch: Partial<RegisterDriverFormState>) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  showStationPicker?: boolean;
  registerStationId: string;
  onRegisterStationIdChange: (id: string) => void;
  stations: StationPickerOption[];
  vehicleOptions: VehicleOption[];
  formatVehicleRefId: (id: number | string) => string;
};

function FormSection({
  title,
  description,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('space-y-4', className)}>
      <div className="flex items-start gap-3">
        {Icon ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
            <Icon className="h-4 w-4" strokeWidth={2} />
          </span>
        ) : null}
        <div className="min-w-0 pt-0.5">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
          {description ? (
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
          ) : null}
        </div>
      </div>
      <div className="space-y-4 pl-0 sm:pl-12">{children}</div>
    </section>
  );
}

const fieldInputClass = 'h-10 bg-muted/30 border-border/80';

export function RegisterDriverDialog({
  open,
  onOpenChange,
  form,
  onFormChange,
  onSubmit,
  isSubmitting = false,
  showStationPicker = false,
  registerStationId,
  onRegisterStationIdChange,
  stations,
  vehicleOptions,
  formatVehicleRefId,
}: RegisterDriverDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden rounded-2xl sm:max-w-2xl">
        <DialogHeader className="border-b border-border/80 bg-gradient-to-br from-muted/50 to-background px-6 py-5">
          <div className="flex items-start gap-4 pr-6">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
              <UserPlus className="h-5 w-5" strokeWidth={2.25} />
            </span>
            <div className="space-y-1 min-w-0">
              <DialogTitle className="text-xl font-semibold tracking-tight">
                Register driver
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed">
                Add a licensed driver to the roster. Name, phone, and license number are required;
                other fields help with compliance and contact.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody className="px-6 py-5 space-y-8 max-h-[min(58vh,520px)]">
          <FormSection
            title="Assignment"
            description="Station and optional vehicle at registration."
            icon={MapPin}
          >
            {showStationPicker ? (
              <StationFormSelect
                value={registerStationId}
                stations={stations}
                onChange={onRegisterStationIdChange}
              />
            ) : null}
              <div className="space-y-2">
                <Label htmlFor="registerVehicle">Vehicle (optional)</Label>
                <Select
                  value={form.vehicleId || '__none__'}
                  onValueChange={(value) =>
                    onFormChange({ vehicleId: value === '__none__' ? '' : value })
                  }
                >
                  <SelectTrigger id="registerVehicle" className={fieldInputClass}>
                    <SelectValue placeholder="No vehicle assigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No vehicle</SelectItem>
                    {vehicleOptions.map((vehicle) => {
                      const ref = formatVehicleRefId(vehicle.id);
                      const desc = [vehicle.make, vehicle.model].filter(Boolean).join(' ');
                      return (
                        <SelectItem key={ref} value={ref}>
                          {vehicle.registrationNumber}
                          {desc ? ` · ${desc}` : ''}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Unassigned vehicles at the selected station only.
                </p>
              </div>
          </FormSection>

          <FormSection
            title="Personal details"
            description="How we identify and reach the driver."
            icon={UserCheck}
          >
            <div className="space-y-2">
              <Label htmlFor="driverName">
                Full name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="driverName"
                className={fieldInputClass}
                value={form.name}
                onChange={(e) => onFormChange({ name: e.target.value })}
                placeholder="e.g. Kwame Asante"
                autoComplete="name"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="phone"
                    className={cn(fieldInputClass, 'pl-9')}
                    value={form.phone}
                    onChange={(e) => onFormChange({ phone: e.target.value })}
                    placeholder="+233 24 000 0000"
                    autoComplete="tel"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  className={fieldInputClass}
                  value={form.email}
                  onChange={(e) => onFormChange({ email: e.target.value })}
                  placeholder="driver@email.com"
                  autoComplete="email"
                />
              </div>
            </div>
          </FormSection>

          <FormSection
            title="License & experience"
            description="DVLA details and expiry reminders."
            icon={IdCard}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="license">
                  License number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="license"
                  className={cn(fieldInputClass, 'font-mono text-sm')}
                  value={form.licenseNumber}
                  onChange={(e) => onFormChange({ licenseNumber: e.target.value })}
                  placeholder="DL-GH-XXXXXX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry">License expiry</Label>
                <Input
                  id="expiry"
                  type="date"
                  className={fieldInputClass}
                  value={form.licenseExpiry}
                  onChange={(e) => onFormChange({ licenseExpiry: e.target.value })}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground -mt-2">
              SMS reminders at 7 days, 3 days, and on the expiry date.
            </p>
            <div className="space-y-2 max-w-[200px]">
              <Label htmlFor="experience">Years of experience</Label>
              <Input
                id="experience"
                type="number"
                min={0}
                className={fieldInputClass}
                value={form.experience}
                onChange={(e) => onFormChange({ experience: e.target.value })}
                placeholder="5"
              />
            </div>
          </FormSection>

          <FormSection
            title="Additional contact"
            description="Address and person to call in an emergency."
            icon={Phone}
            className="pb-1"
          >
            <div className="space-y-2">
              <Label htmlFor="address">Residential address</Label>
              <Textarea
                id="address"
                value={form.address}
                onChange={(e) => onFormChange({ address: e.target.value })}
                placeholder="Street, city, region"
                className="min-h-[80px] resize-y bg-muted/30 border-border/80"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency">Emergency contact</Label>
              <Input
                id="emergency"
                className={fieldInputClass}
                value={form.emergencyContact}
                onChange={(e) => onFormChange({ emergencyContact: e.target.value })}
                placeholder="+233 24 000 0000"
              />
            </div>
          </FormSection>
        </DialogBody>

        <DialogFooter className="gap-2 sm:gap-2 bg-muted/20">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="button" onClick={onSubmit} disabled={isSubmitting} className="min-w-[140px]">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Registering…
              </>
            ) : (
              <>
                <UserCheck className="h-4 w-4 mr-2" />
                Register driver
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
