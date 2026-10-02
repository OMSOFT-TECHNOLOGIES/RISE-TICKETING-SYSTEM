export const vehicleMakes = [
  'Hyundai',
  'Tata',
  'Mercedes',
  'Isuzu',
  'Toyota',
  'Ford',
  'Volkswagen',
] as const;

export const fuelTypes = ['Diesel', 'Petrol', 'CNG', 'Electric'] as const;

export const vehicleStatusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'inactive', label: 'Inactive' },
] as const;
