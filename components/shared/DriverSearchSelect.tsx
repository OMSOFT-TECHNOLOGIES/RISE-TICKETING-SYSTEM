import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback } from '../ui/avatar';
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
}

export function DriverSearchSelect({
  drivers,
  value,
  onValueChange,
  label = 'Driver',
  placeholder = 'Search by name, ID, or license…',
}: DriverSearchSelectProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return drivers;
    return drivers.filter((d) => {
      const id = String(d.id).toLowerCase();
      const name = String(d.name ?? '').toLowerCase();
      const lic = String(d.licenseNumber ?? '').toLowerCase();
      const phone = String(d.phone ?? '').toLowerCase();
      return id.includes(q) || name.includes(q) || lic.includes(q) || phone.includes(q);
    });
  }, [drivers, query]);

  const selected = drivers.find((d) => String(d.id) === String(value));

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-10"
        />
      </div>
      <div className="max-h-48 overflow-y-auto rounded-md border divide-y">
        {filtered.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground text-center">No drivers match your search</p>
        ) : (
          filtered.map((driver) => (
            <button
              key={driver.id}
              type="button"
              className={cn(
                'flex w-full items-center gap-3 p-3 text-left hover:bg-muted/60 transition-colors',
                String(value) === String(driver.id) && 'bg-[#193cb8]/10'
              )}
              onClick={() => onValueChange(String(driver.id))}
            >
              <Avatar className="h-9 w-9 shrink-0">
                {driver.photoUrl ? (
                  <img src={driver.photoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <AvatarFallback className="text-xs">{initials(driver.name || '?')}</AvatarFallback>
                )}
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{driver.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {driver.id}
                  {driver.licenseNumber ? ` · ${driver.licenseNumber}` : ''}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
      {selected && (
        <p className="text-xs text-muted-foreground">
          Selected: <span className="font-medium text-foreground">{selected.name}</span> ({selected.id})
        </p>
      )}
    </div>
  );
}
