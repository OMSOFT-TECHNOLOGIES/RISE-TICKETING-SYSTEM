import React, { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../ui/command';
import { cn } from '../ui/utils';

export type VehicleOption = {
  id: string;
  registration: string;
  capacity?: number;
  make?: string;
  model?: string;
  driverName?: string;
};

interface VehicleSearchSelectProps {
  vehicles: VehicleOption[];
  value: string;
  onValueChange: (registration: string) => void;
  label?: string;
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  loading?: boolean;
  hideLabel?: boolean;
}

export function VehicleSearchSelect({
  vehicles,
  value,
  onValueChange,
  label = 'Vehicle',
  placeholder = 'Search registration, make, or model…',
  emptyMessage = 'No vehicles found.',
  disabled = false,
  loading = false,
  hideLabel = false,
}: VehicleSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = vehicles.find((v) => v.registration === value);

  return (
    <div className="space-y-2">
      {!hideLabel ? <Label>{label}</Label> : null}
      <Popover modal open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || loading}
            className="w-full justify-between font-normal"
          >
            {loading ? (
              <span className="text-muted-foreground">Loading vehicles…</span>
            ) : selected ? (
              <span className="truncate">
                {selected.registration}
                {selected.capacity != null ? ` (${selected.capacity} seats)` : ''}
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search vehicles…" />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {vehicles.map((vehicle) => (
                  <CommandItem
                    key={vehicle.id || vehicle.registration}
                    value={`${vehicle.registration} ${vehicle.make ?? ''} ${vehicle.model ?? ''} ${vehicle.driverName ?? ''}`}
                    onSelect={() => {
                      onValueChange(vehicle.registration);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4 shrink-0',
                        value === vehicle.registration ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{vehicle.registration}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {vehicle.capacity != null ? `${vehicle.capacity} seats` : '—'}
                        {vehicle.make || vehicle.model
                          ? ` · ${[vehicle.make, vehicle.model].filter(Boolean).join(' ')}`
                          : ''}
                        {vehicle.driverName ? ` · ${vehicle.driverName}` : ''}
                      </p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
