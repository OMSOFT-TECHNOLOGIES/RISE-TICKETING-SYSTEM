// Mock data constants for the RISE system

export const mockUsers = [
  {
    id: 'USR001',
    name: 'Kwame Asante',
    email: 'admin@rise.gov.gh',
    phone: '+233 30 222 3456',
    role: 'admin',
    stationId: null,
    stationName: null,
    status: 'active',
    joinDate: '2020-01-15',
    lastLogin: '2024-01-20T09:30:00'
  },
  {
    id: 'USR002',
    name: 'Ama Osei',
    email: 'worker@accra.rise.gov.gh',
    phone: '+233 24 111 1111',
    role: 'worker',
    stationId: 'STA001',
    stationName: 'Accra Central Station',
    status: 'active',
    joinDate: '2021-03-10',
    lastLogin: '2024-01-20T08:15:00'
  },
  {
    id: 'USR003',
    name: 'Kofi Mensah',
    email: 'worker@kumasi.rise.gov.gh',
    phone: '+233 32 202 4567',
    role: 'worker',
    stationId: 'STA002',
    stationName: 'Kumasi Main Station',
    status: 'active',
    joinDate: '2021-05-20',
    lastLogin: '2024-01-19T16:45:00'
  }
];

export const mockStations = [
  {
    id: 'STA001',
    name: 'Accra Central Station',
    region: 'Greater Accra',
    address: 'Liberation Road, Accra Central',
    phone: '+233 30 222 3456',
    email: 'accra.central@rise.gov.gh',
    manager: 'Ama Osei',
    vehicles: 18,
    drivers: 15,
    status: 'active'
  },
  {
    id: 'STA002',
    name: 'Kumasi Main Station',
    region: 'Ashanti',
    address: 'Kejetia Market Area, Kumasi',
    phone: '+233 32 202 4567',
    email: 'kumasi.main@rise.gov.gh',
    manager: 'Kofi Mensah',
    vehicles: 22,
    drivers: 18,
    status: 'active'
  }
];

export const mockDrivers = [
  {
    id: 'DRV001',
    name: 'Kwame Asante',
    phone: '+233 24 123 4567',
    email: 'kwame.asante@email.com',
    licenseNumber: 'DL-GH-123456',
    licenseExpiry: '2025-12-15',
    stationId: 'STA001',
    stationName: 'Accra Central Station',
    assignedVehicle: 'GV-123-20',
    status: 'active',
    experience: 8,
    rating: 4.8,
    totalTrips: 340
  }
];

export const mockVehicles = [
  {
    id: 'VEH001',
    registrationNumber: 'GV-123-20',
    make: 'Hyundai',
    model: 'County',
    year: 2020,
    capacity: 35,
    stationId: 'STA001',
    stationName: 'Accra Central Station',
    status: 'active',
    mileage: 45000,
    fuelType: 'Diesel'
  }
];

export const revenueData = {
  daily: [
    { name: 'Mon', revenue: 2300, trips: 45, passengers: 340 },
    { name: 'Tue', revenue: 2650, trips: 52, passengers: 385 },
    { name: 'Wed', revenue: 2400, trips: 48, passengers: 360 },
    { name: 'Thu', revenue: 3100, trips: 61, passengers: 425 },
    { name: 'Fri', revenue: 2950, trips: 58, passengers: 410 },
    { name: 'Sat', revenue: 3800, trips: 72, passengers: 520 },
    { name: 'Sun', revenue: 3400, trips: 65, passengers: 485 }
  ],
  monthly: [
    { name: 'Jan', revenue: 62000, trips: 1240, passengers: 8900 },
    { name: 'Feb', revenue: 59000, trips: 1180, passengers: 8500 },
    { name: 'Mar', revenue: 67500, trips: 1350, passengers: 9800 },
    { name: 'Apr', revenue: 71000, trips: 1420, passengers: 10200 },
    { name: 'May', revenue: 69000, trips: 1380, passengers: 9950 },
    { name: 'Jun', revenue: 72500, trips: 1450, passengers: 10400 }
  ],
  quarterly: [
    { name: 'Q1 2024', revenue: 188500, trips: 3770, passengers: 27200 },
    { name: 'Q2 2024', revenue: 212500, trips: 4250, passengers: 30550 },
    { name: 'Q3 2024', revenue: 218500, trips: 4390, passengers: 31900 },
    { name: 'Q4 2024', revenue: 227500, trips: 4550, passengers: 32550 }
  ]
};

export const ghanaRegions = [
  'Greater Accra', 'Ashanti', 'Western', 'Central', 'Eastern', 
  'Volta', 'Northern', 'Upper East', 'Upper West', 'Brong Ahafo'
];

export const ghanaDestinations = [
  'Accra Central', 'Kumasi Main', 'Cape Coast', 'Tamale', 'Takoradi',
  'Ho', 'Sunyani', 'Koforidua', 'Wa', 'Bolgatanga'
];

export const userRoles = [
  { value: 'admin', label: 'Administrator', color: 'bg-purple-100 text-purple-800' },
  { value: 'worker', label: 'Station Worker', color: 'bg-blue-100 text-blue-800' }
];

export const statusOptions = {
  user: [
    { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
    { value: 'suspended', label: 'Suspended', color: 'bg-red-100 text-red-800' },
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' }
  ],
  vehicle: [
    { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
    { value: 'maintenance', label: 'Maintenance', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'inactive', label: 'Inactive', color: 'bg-red-100 text-red-800' }
  ]
};