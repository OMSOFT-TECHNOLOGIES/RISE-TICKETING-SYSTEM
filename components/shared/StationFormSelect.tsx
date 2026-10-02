import React from 'react';
import { StationSearchSelect } from './StationSearchSelect';
import type { StationPickerOption } from '../utils/stationPicker';

type StationOption = StationPickerOption;

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
    <StationSearchSelect
      label={label + (required ? '' : ' (optional)')}
      stations={stations}
      value={value}
      onValueChange={onChange}
      disabled={disabled}
      placeholder="Search and select station…"
    />
  );
}
