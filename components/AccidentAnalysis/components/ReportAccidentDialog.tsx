import React, { useState } from 'react';
import { AlertTriangle, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../../ui/command';
import { cn } from '../../ui/utils';
import type { NewAccidentForm } from '../types';
import {
  CAUSE_OPTIONS,
  ROAD_OPTIONS,
  SEVERITY_OPTIONS,
  WEATHER_OPTIONS,
} from '../constants';

export interface VehicleOption {
  id: string;
  registrationNumber: string;
}

export interface ResolvedLatestTrip {
  tripId: string;
  route?: string;
  driverName?: string;
}

interface ReportAccidentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: NewAccidentForm;
  onFormChange: (updates: Partial<NewAccidentForm>) => void;
  onSubmit: () => void;
  onCancel: () => void;
  vehicles: VehicleOption[];
  vehiclesLoading?: boolean;
  latestTrip: ResolvedLatestTrip | null;
  latestTripLoading?: boolean;
  latestTripError?: string | null;
  isSubmitting?: boolean;
}

export function ReportAccidentDialog({
  open,
  onOpenChange,
  form,
  onFormChange,
  onSubmit,
  onCancel,
  vehicles,
  vehiclesLoading = false,
  latestTrip,
  latestTripLoading = false,
  latestTripError = null,
  isSubmitting = false,
}: ReportAccidentDialogProps) {
  const [openVehicleCombobox, setOpenVehicleCombobox] = useState(false);

  const selectedRegistration = form.vehicleRegistrationNumber.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Report New Accident
          </DialogTitle>
          <DialogDescription>
            Select the vehicle involved. The latest trip for that vehicle is linked automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vehicle-number">Vehicle Number *</Label>
              <Popover modal open={openVehicleCombobox} onOpenChange={setOpenVehicleCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    id="vehicle-number"
                    variant="outline"
                    role="combobox"
                    aria-expanded={openVehicleCombobox}
                    className="w-full justify-between font-normal"
                  >
                    {selectedRegistration ? (
                      <span className="truncate">{selectedRegistration}</span>
                    ) : (
                      <span className="text-muted-foreground">Search vehicle number…</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search registration…" />
                    <CommandList>
                      <CommandEmpty>
                        {vehiclesLoading ? 'Loading vehicles…' : 'No vehicle found.'}
                      </CommandEmpty>
                      <CommandGroup>
                        {vehicles.map((vehicle) => (
                          <CommandItem
                            key={vehicle.id}
                            value={vehicle.registrationNumber}
                            onSelect={() => {
                              onFormChange({ vehicleRegistrationNumber: vehicle.registrationNumber });
                              setOpenVehicleCombobox(false);
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4 shrink-0',
                                selectedRegistration === vehicle.registrationNumber
                                  ? 'opacity-100'
                                  : 'opacity-0'
                              )}
                            />
                            {vehicle.registrationNumber}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <Input
                className="text-sm"
                value={form.vehicleRegistrationNumber}
                onChange={(e) => onFormChange({ vehicleRegistrationNumber: e.target.value })}
                placeholder="Or type registration (e.g. GR-1234-20)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linked-trip">Trip ID (auto)</Label>
              <div
                id="linked-trip"
                className="flex h-10 w-full items-center rounded-md border border-input bg-muted/40 px-3 text-sm"
              >
                {latestTripLoading ? (
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Resolving latest trip…
                  </span>
                ) : latestTrip?.tripId ? (
                  <span className="font-mono">{latestTrip.tripId}</span>
                ) : selectedRegistration ? (
                  <span className="text-muted-foreground text-xs">
                    {latestTripError ?? 'Enter a valid vehicle number'}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Select a vehicle first</span>
                )}
              </div>
              {latestTrip?.route && (
                <p className="text-xs text-muted-foreground truncate">
                  {latestTrip.route}
                  {latestTrip.driverName ? ` · ${latestTrip.driverName}` : ''}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="severity">Severity *</Label>
              <Select value={form.severity} onValueChange={(value) => onFormChange({ severity: value })}>
                <SelectTrigger id="severity">
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              value={form.location}
              onChange={(e) => onFormChange({ location: e.target.value })}
              placeholder="Exact location of the accident"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="injuries">Number of Injuries</Label>
              <Input
                id="injuries"
                type="number"
                min={0}
                value={form.injuries}
                onChange={(e) => onFormChange({ injuries: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fatalities">Number of Fatalities</Label>
              <Input
                id="fatalities"
                type="number"
                min={0}
                value={form.fatalities}
                onChange={(e) => onFormChange({ fatalities: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => onFormChange({ description: e.target.value })}
              placeholder="Detailed description of what happened..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cause">Probable Cause</Label>
              <Select value={form.cause} onValueChange={(value) => onFormChange({ cause: value })}>
                <SelectTrigger id="cause">
                  <SelectValue placeholder="Select cause" />
                </SelectTrigger>
                <SelectContent>
                  {CAUSE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="weather">Weather</Label>
              <Select
                value={form.weatherConditions}
                onValueChange={(value) => onFormChange({ weatherConditions: value })}
              >
                <SelectTrigger id="weather">
                  <SelectValue placeholder="Weather" />
                </SelectTrigger>
                <SelectContent>
                  {WEATHER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="road">Road Conditions</Label>
              <Select
                value={form.roadConditions}
                onValueChange={(value) => onFormChange({ roadConditions: value })}
              >
                <SelectTrigger id="road">
                  <SelectValue placeholder="Road" />
                </SelectTrigger>
                <SelectContent>
                  {ROAD_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={onSubmit}
              className="flex-1 bg-[#193cb8] hover:bg-[#152f94]"
              disabled={isSubmitting || latestTripLoading || !latestTrip?.tripId}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Submit Report
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
