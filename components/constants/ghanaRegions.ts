/** Ghana’s 16 administrative regions (2019 reorganization). */
export const GHANA_REGIONS = [
  'Greater Accra',
  'Ashanti',
  'Western',
  'Central',
  'Eastern',
  'Northern',
  'Upper East',
  'Upper West',
  'Volta',
  'Bono',
  'Bono East',
  'Ahafo',
  'Western North',
  'North East',
  'Savannah',
  'Oti',
] as const;

export type GhanaRegion = (typeof GHANA_REGIONS)[number];
