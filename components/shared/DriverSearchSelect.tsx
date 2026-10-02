import React, { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback } from '../ui/avatar';
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

export type DriverOption = {
  id: string;
  name: string;
  licenseNumber?: string;
  phone?: string;
  photoUrl?: string;
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

interface DriverSearchSelectProps {
  drivers: DriverOption[];
  value: string;
  onValueChange: (driverId: string) => void;
  label?: string;
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  hideLabel?: boolean;
}

export function DriverSearchSelect({
  drivers,
  value,
  onValueChange,
  label = 'Driver',
  placeholder = 'Search by name, ID, or license…',
  emptyMessage = 'No drivers found.',
  disabled = false,
  hideLabel = false,
}: DriverSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = drivers.find((d) => String(d.id) === String(value));

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
            disabled={disabled}
            className="w-full justify-between font-normal h-auto min-h-10 py-2"
          >
            {selected ? (
              <span className="flex items-center gap-2 min-w-0 text-left">
                <Avatar className="h-8 w-8 shrink-0">
                  {selected.photoUrl ? (
                    <img src={selected.photoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <AvatarFallback className="text-xs">
                      {initials(selected.name || '?')}
                    </AvatarFallback>
                  )}
                </Avatar>
                <span className="truncate">
                  <span className="font-medium">{selected.name}</span>
                  <span className="text-muted-foreground text-xs block truncate">{selected.id}</span>
                </span>
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search drivers…" />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {drivers.map((driver) => (
                  <CommandItem
                    key={driver.id}
                    value={`${driver.name} ${driver.id} ${driver.licenseNumber ?? ''} ${driver.phone ?? ''}`}
                    onSelect={() => {
                      onValueChange(String(driver.id));
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4 shrink-0',
                        String(value) === String(driver.id) ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <Avatar className="h-8 w-8 shrink-0 mr-2">
                      {driver.photoUrl ? (
                        <img src={driver.photoUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <AvatarFallback className="text-xs">
                          {initials(driver.name || '?')}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{driver.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {driver.id}
                        {driver.licenseNumber ? ` · ${driver.licenseNumber}` : ''}
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
