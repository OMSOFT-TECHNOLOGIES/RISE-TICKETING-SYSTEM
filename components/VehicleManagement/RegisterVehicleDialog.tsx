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
import { Bus, Gauge, Loader2, MapPin, Settings2 } from 'lucide-react';
import { StationFormSelect } from '../shared/StationFormSelect';
import { cn } from '../ui/utils';
import type { StationPickerOption } from '../utils/stationPicker';
import { fuelTypes, vehicleMakes } from './vehicleFormConstants';

export type RegisterVehicleFormState = {
  registrationNumber: string;
  make: string;
  model: string;
  year: string;
  capacity: string;
  fuelType: string;
  mileage: string;
};

type RegisterVehicleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: RegisterVehicleFormState;
  onFormChange: (patch: Partial<RegisterVehicleFormState>) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  showStationPicker?: boolean;
  registerStationId: string;
  onRegisterStationIdChange: (id: string) => void;
  stations: StationPickerOption[];
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

export function RegisterVehicleDialog({
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
}: RegisterVehicleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden rounded-2xl sm:max-w-2xl">
        <DialogHeader className="border-b border-border/80 bg-gradient-to-br from-muted/50 to-background px-6 py-5">
          <div className="flex items-start gap-4 pr-6">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
              <Bus className="h-5 w-5" strokeWidth={2.25} />
            </span>
            <div className="space-y-1 min-w-0">
              <DialogTitle className="text-xl font-semibold tracking-tight">
                Register vehicle
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed">
                Add a bus or coach to the fleet registry. Assign a driver later from the vehicle
                actions menu.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody className="px-6 py-5 space-y-8 max-h-[min(58vh,520px)]">
          <FormSection
            title="Station assignment"
            description="Where this vehicle is based."
            icon={MapPin}
          >
            {showStationPicker ? (
              <StationFormSelect
                value={registerStationId}
                stations={stations}
                onChange={onRegisterStationIdChange}
              />
            ) : (
              <p className="text-sm text-muted-foreground rounded-lg border border-dashed border-border/80 bg-muted/20 px-3 py-2.5">
                Vehicle will be registered at your assigned station.
              </p>
            )}
          </FormSection>

          <FormSection
            title="Registration"
            description="Official plate or fleet number."
            icon={Bus}
          >
            <div className="space-y-2">
              <Label htmlFor="regNumber">
                Registration number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="regNumber"
                className={cn(fieldInputClass, 'font-mono uppercase tracking-wide')}
                value={form.registrationNumber}
                onChange={(e) => onFormChange({ registrationNumber: e.target.value })}
                placeholder="e.g. GV-123-20"
                autoComplete="off"
              />
            </div>
          </FormSection>

          <FormSection
            title="Specifications"
            description="Make, model, capacity, and fuel."
            icon={Settings2}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="make">
                  Make <span className="text-destructive">*</span>
                </Label>
                <Select value={form.make} onValueChange={(value) => onFormChange({ make: value })}>
                  <SelectTrigger id="make" className={fieldInputClass}>
                    <SelectValue placeholder="Select make" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleMakes.map((make) => (
                      <SelectItem key={make} value={make}>
                        {make}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">
                  Model <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="model"
                  className={fieldInputClass}
                  value={form.model}
                  onChange={(e) => onFormChange({ model: e.target.value })}
                  placeholder="e.g. County"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">
                  Year <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="year"
                  type="number"
                  min={1990}
                  max={2100}
                  className={fieldInputClass}
                  value={form.year}
                  onChange={(e) => onFormChange({ year: e.target.value })}
                  placeholder="2024"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">
                  Passenger capacity <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="capacity"
                  type="number"
                  min={1}
                  className={fieldInputClass}
                  value={form.capacity}
                  onChange={(e) => onFormChange({ capacity: e.target.value })}
                  placeholder="35"
                />
              </div>
            </div>
            <div className="space-y-2 max-w-sm">
              <Label htmlFor="fuelType">
                Fuel type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.fuelType}
                onValueChange={(value) => onFormChange({ fuelType: value })}
              >
                <SelectTrigger id="fuelType" className={fieldInputClass}>
                  <SelectValue placeholder="Select fuel type" />
                </SelectTrigger>
                <SelectContent>
                  {fuelTypes.map((fuel) => (
                    <SelectItem key={fuel} value={fuel}>
                      {fuel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FormSection>

          <FormSection
            title="Odometer"
            description="Optional reading for maintenance tracking."
            icon={Gauge}
            className="pb-1"
          >
            <div className="space-y-2 max-w-xs">
              <Label htmlFor="mileage">Current mileage (km)</Label>
              <Input
                id="mileage"
                type="text"
                inputMode="numeric"
                className={fieldInputClass}
                value={form.mileage}
                onChange={(e) => onFormChange({ mileage: e.target.value })}
                placeholder="Leave blank if unknown"
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
                <Bus className="h-4 w-4 mr-2" />
                Register vehicle
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
