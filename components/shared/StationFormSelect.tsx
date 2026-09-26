import React from 'react';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

type StationOption = { id: string; name: string };

interface StationFormSelectProps {
  label?: string;
  value: string;
  stations: StationOption[];
  onChange: (stationId: string) => void;
  required?: boolean;
  disabled?: boolean;
}

export function StationFormSelect({
  label = 'Station',
  value,
  stations,
  onChange,
  required = true,
  disabled = false,
}: StationFormSelectProps) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required ? ' *' : ''}
      </Label>
      <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder="Select station" />
        </SelectTrigger>
        <SelectContent>
          {stations.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
