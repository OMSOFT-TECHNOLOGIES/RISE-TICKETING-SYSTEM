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
import type { StationPickerOption } from '../utils/stationPicker';

function stationSubtitle(station: StationPickerOption): string {
  return [station.code, station.city, station.district, station.region]
    .filter(Boolean)
    .join(' · ');
}

interface StationSearchSelectProps {
  stations: StationPickerOption[];
  value: string;
  onValueChange: (stationId: string) => void;
  label?: string;
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  loading?: boolean;
  hideLabel?: boolean;
  id?: string;
}

export function StationSearchSelect({
  stations,
  value,
  onValueChange,
  label = 'Station',
  placeholder = 'Search station name, code, or location…',
  emptyMessage = 'No stations found.',
  disabled = false,
  loading = false,
  hideLabel = false,
  id,
}: StationSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = stations.find((s) => String(s.id) === String(value));

  return (
    <div className="space-y-1.5">
      {!hideLabel ? (
        <Label htmlFor={id} className="text-xs font-medium">
          {label} <span className="text-destructive">*</span>
        </Label>
      ) : null}
      <Popover modal open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || loading}
            className="w-full justify-between font-normal h-10 bg-background"
          >
            {loading ? (
              <span className="text-muted-foreground">Loading stations…</span>
            ) : selected ? (
              <span className="truncate text-left">
                <span className="font-medium">{selected.name}</span>
                {stationSubtitle(selected) ? (
                  <span className="text-muted-foreground text-xs block truncate">
                    {stationSubtitle(selected)}
                  </span>
                ) : null}
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search stations…" />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {stations.map((station) => {
                  const subtitle = stationSubtitle(station);
                  return (
                    <CommandItem
                      key={station.id}
                      value={`${station.name} ${station.id} ${station.code ?? ''} ${station.city ?? ''} ${station.district ?? ''} ${station.region ?? ''}`}
                      onSelect={() => {
                        onValueChange(station.id);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4 shrink-0',
                          String(value) === String(station.id) ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{station.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {subtitle || station.id}
                        </p>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
