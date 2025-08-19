// Enhanced mock data for RISE transport management system

export interface Union {
  id: string;
  name: string;
  acronym: string;
  description: string;
  region: string;
  established: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  memberCount: number;
  isActive: boolean;
}

export interface Station {
  id: string;
  name: string;
  code: string; // Auto-generated
  location: string;
  region: string;
  district: string;
  capacity: number; // Number of vehicles that can be stationed
  platformCount: number; // Number of boarding platforms
  manager: string;
  contactPhone: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  facilities: string[];
  operatingHours: {
    open: string;
    close: string;
  };
  status: 'active' | 'inactive' | 'maintenance';
  established: string;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  type: 'bus' | 'trotro' | 'taxi' | 'truck';
  model: string;
  year: number;
  capacity: number;
  stationId: string;
  driverId?: string;
  status: 'active' | 'maintenance' | 'out_of_service' | 'broken_down';
  lastMaintenance: string;
  nextMaintenance: string;
  mileage: number;
  fuelType: 'petrol' | 'diesel' | 'gas';
  insuranceExpiry: string;
  roadworthyExpiry: string;
}

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseClass: string;
  phone: string;
  email?: string;
  address: string;
  dateOfBirth: string;
  hireDate: string;
  stationId: string;
  unionId: string;
  status: 'active' | 'suspended' | 'on_leave' | 'terminated';
  licenseExpiry: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalCertExpiry: string;
  currentVehicleId?: string;
}

export interface Passenger {
  id: string;
  name: string;
  phone: string;
  email?: string;
  idType: 'ghana_card' | 'voters_id' | 'passport' | 'drivers_license';
  idNumber: string;
  address: string;
  dateOfBirth?: string;
  gender: 'male' | 'female';
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  registrationDate: string;
  totalTrips: number;
}

export interface Trip {
  id: string;
  vehicleId: string;
  driverId: string;
  fromStationId: string;
  toStationId: string;
  departureTime: string;
  arrivalTime?: string;
  estimatedDuration: number; // in minutes
  distance: number; // in kilometers
  basefare: number;
  tier: 1 | 2 | 3;
  tierPenalty: number;
  totalFare: number;
  passengers: string[]; // passenger IDs
  capacity: number;
  bookedSeats: number;
  status: 'booking' | 'on_road' | 'arrived' | 'broken_down' | 'rescheduled' | 'offloaded';
  speedStatus: 'normal_speed' | 'over_speed';
  route: string;
  createdAt: string;
  createdBy: string;
}

export interface TripBooking {
  id: string;
  tripId: string;
  passengerId: string;
  seatNumber: string;
  bookingDate: string;
  fare: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentMethod: 'cash' | 'mobile_money' | 'card';
  bookingReference: string;
  status: 'confirmed' | 'cancelled' | 'completed';
}

export interface Incident {
  id: string;
  type: 'accident' | 'breakdown' | 'theft' | 'assault' | 'other';
  severity: 'minor' | 'moderate' | 'severe' | 'fatal';
  tripId?: string;
  vehicleId?: string;
  driverId?: string;
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  description: string;
  reportedBy: string;
  reportedAt: string;
  status: 'reported' | 'investigating' | 'resolved' | 'closed';
  casualties: number;
  injuries: {
    minor: number;
    moderate: number;
    severe: number;
    fatalities: number;
  };
  estimatedDamage: number;
  policeReport?: string;
  insuranceClaim?: string;
}

export interface IncidentClaim {
  id: string;
  incidentId: string;
  claimantName: string;
  claimantPhone: string;
  claimantId: string;
  injuryType: 'minor' | 'moderate' | 'severe';
  compensationAmount: number;
  description: string;
  medicalReports: string[];
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  paymentDate?: string;
}

export interface DeathTrapReport {
  id: string;
  type: 'faulty_vehicle' | 'broken_down_vehicle' | 'fatal_pothole' | 
        'faulty_bridge' | 'material_roadside' | 'no_caution_sign' | 
        'zebra_crossing_faded' | 'faulty_streetlight';
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  description: string;
  severityLevel: 'low' | 'medium' | 'high' | 'critical';
  reportedBy: string;
  reportedAt: string;
  status: 'reported' | 'acknowledged' | 'in_progress' | 'resolved' | 'escalated';
  images?: string[];
  affectedRoutes: string[];
  estimatedRepairCost?: number;
  priorityScore: number;
  assignedTo?: string;
  resolvedAt?: string;
}

// User interface for UserManagement
export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  stationId?: string;
  stationName?: string;
  region?: string;
  district?: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  lastLogin?: string;
  permissions: string[];
}

// Revenue data interface
export interface RevenueData {
  period: string;
  totalRevenue: number;
  tripRevenue: number;
  penalties: number;
  fuelCosts: number;
  maintenanceCosts: number;
  profit: number;
  tripCount: number;
  avgFarePerTrip: number;
}

// Mock data
export const mockUnions: Union[] = [
  {
    id: 'UN001',
    name: 'Ghana Private Road Transport Union',
    acronym: 'GPRTU',
    description: 'Main transport union for commercial vehicle operators in Ghana',
    region: 'National',
    established: '1983-05-15',
    contactPerson: 'Kwame Boateng',
    contactPhone: '+233244123456',
    contactEmail: 'info@gprtu.org.gh',
    memberCount: 15420,
    isActive: true
  },
  {
    id: 'UN002',
    name: 'Progressive Transport Owners Association',
    acronym: 'PROTOA',
    description: 'Association for progressive transport owners and operators',
    region: 'Greater Accra',
    established: '1995-03-20',
    contactPerson: 'Ama Serwaa',
    contactPhone: '+233244234567',
    contactEmail: 'contact@protoa.gh',
    memberCount: 8350,
    isActive: true
  },
  {
    id: 'UN003',
    name: 'Ghana Cooperative Transport Association',
    acronym: 'GCTA',
    description: 'Cooperative association for small-scale transport operators',
    region: 'Ashanti',
    established: '2001-11-10',
    contactPerson: 'Yaw Asante',
    contactPhone: '+233244345678',
    contactEmail: 'info@gcta.com.gh',
    memberCount: 5230,
    isActive: true
  }
];

export const mockStations: Station[] = [
  {
    id: 'ST001',
    name: 'Accra Central Station',
    code: 'ACS-001',
    location: 'Circle, Accra',
    region: 'Greater Accra',
    district: 'Accra Metropolitan',
    capacity: 45,
    platformCount: 6,
    manager: 'Kwame Mensah',
    contactPhone: '+233302123456',
    coordinates: { lat: 5.5600, lng: -0.2057 },
    facilities: ['Waiting Area', 'Restrooms', 'Food Court', 'ATM', 'First Aid', 'Security'],
    operatingHours: { open: '05:00', close: '22:00' },
    status: 'active',
    established: '1995-06-15'
  },
  {
    id: 'ST002',
    name: 'Kumasi Kejetia Station',
    code: 'KKS-002',
    location: 'Kejetia, Kumasi',
    region: 'Ashanti',
    district: 'Kumasi Metropolitan',
    capacity: 60,
    platformCount: 8,
    manager: 'Akosua Osei',
    contactPhone: '+233322234567',
    coordinates: { lat: 6.6885, lng: -1.6244 },
    facilities: ['Waiting Area', 'Restrooms', 'Market', 'Banking', 'Medical Center'],
    operatingHours: { open: '04:30', close: '23:00' },
    status: 'active',
    established: '1990-03-20'
  },
  {
    id: 'ST003',
    name: 'Tamale Station',
    code: 'TMS-003',
    location: 'Central Tamale',
    region: 'Northern',
    district: 'Tamale Metropolitan',
    capacity: 30,
    platformCount: 4,
    manager: 'Abdul Rahman',
    contactPhone: '+233372345678',
    coordinates: { lat: 9.4008, lng: -0.8393 },
    facilities: ['Waiting Area', 'Restrooms', 'Food Vendors', 'Security'],
    operatingHours: { open: '05:00', close: '21:00' },
    status: 'active',
    established: '2000-09-10'
  }
];

export const mockVehicles: Vehicle[] = [
  {
    id: 'VH001',
    plateNumber: 'GR 1234-20',
    type: 'bus',
    model: 'Mercedes Benz Sprinter',
    year: 2020,
    capacity: 23,
    stationId: 'ST001',
    driverId: 'DR001',
    status: 'active',
    lastMaintenance: '2024-07-15',
    nextMaintenance: '2024-10-15',
    mileage: 45000,
    fuelType: 'diesel',
    insuranceExpiry: '2024-12-31',
    roadworthyExpiry: '2024-11-30'
  },
  {
    id: 'VH002',
    plateNumber: 'AS 5678-21',
    type: 'trotro',
    model: 'Hyundai H100',
    year: 2021,
    capacity: 15,
    stationId: 'ST002',
    driverId: 'DR002',
    status: 'active',
    lastMaintenance: '2024-08-01',
    nextMaintenance: '2024-11-01',
    mileage: 32000,
    fuelType: 'petrol',
    insuranceExpiry: '2025-01-15',
    roadworthyExpiry: '2024-12-15'
  }
];

export const mockDrivers: Driver[] = [
  {
    id: 'DR001',
    name: 'Kwame Asante',
    licenseNumber: 'DL123456789',
    licenseClass: 'D',
    phone: '+233244123456',
    email: 'kwame.asante@email.com',
    address: 'Dansoman, Accra',
    dateOfBirth: '1985-03-15',
    hireDate: '2020-01-15',
    stationId: 'ST001',
    unionId: 'UN001',
    status: 'active',
    licenseExpiry: '2026-03-15',
    emergencyContact: {
      name: 'Ama Asante',
      phone: '+233244654321',
      relationship: 'Wife'
    },
    medicalCertExpiry: '2024-12-31',
    currentVehicleId: 'VH001'
  },
  {
    id: 'DR002',
    name: 'Akosua Boateng',
    licenseNumber: 'DL987654321',
    licenseClass: 'C',
    phone: '+233244234567',
    address: 'Bantama, Kumasi',
    dateOfBirth: '1990-07-22',
    hireDate: '2021-03-01',
    stationId: 'ST002',
    unionId: 'UN001',
    status: 'active',
    licenseExpiry: '2025-07-22',
    emergencyContact: {
      name: 'Yaw Boateng',
      phone: '+233244765432',
      relationship: 'Brother'
    },
    medicalCertExpiry: '2024-11-30',
    currentVehicleId: 'VH002'
  }
];

export const mockPassengers: Passenger[] = [
  {
    id: 'PS001',
    name: 'Adwoa Mensah',
    phone: '+233244111222',
    email: 'adwoa.mensah@email.com',
    idType: 'ghana_card',
    idNumber: 'GHA-123456789-0',
    address: 'East Legon, Accra',
    dateOfBirth: '1992-05-10',
    gender: 'female',
    emergencyContact: {
      name: 'Joseph Mensah',
      phone: '+233244333444',
      relationship: 'Husband'
    },
    registrationDate: '2023-01-15',
    totalTrips: 25
  },
  {
    id: 'PS002',
    name: 'Kojo Asamoah',
    phone: '+233244555666',
    idType: 'voters_id',
    idNumber: 'VID987654321',
    address: 'Tema Community 1',
    dateOfBirth: '1988-11-20',
    gender: 'male',
    emergencyContact: {
      name: 'Esi Asamoah',
      phone: '+233244777888',
      relationship: 'Sister'
    },
    registrationDate: '2023-03-20',
    totalTrips: 18
  }
];

export const mockTrips: Trip[] = [
  {
    id: 'TR001',
    vehicleId: 'VH001',
    driverId: 'DR001',
    fromStationId: 'ST001',
    toStationId: 'ST002',
    departureTime: '2024-08-16T08:00:00Z',
    estimatedDuration: 240,
    distance: 250,
    basefare: 45,
    tier: 2,
    tierPenalty: 1.0,
    totalFare: 46,
    passengers: ['PS001'],
    capacity: 23,
    bookedSeats: 1,
    status: 'booking',
    speedStatus: 'normal_speed',
    route: 'Accra - Kumasi Highway',
    createdAt: '2024-08-15T10:00:00Z',
    createdBy: 'worker'
  }
];

export const mockIncidents: Incident[] = [
  {
    id: 'IN001',
    type: 'accident',
    severity: 'moderate',
    tripId: 'TR001',
    vehicleId: 'VH001',
    driverId: 'DR001',
    location: 'Accra-Kumasi Highway, Mile 50',
    coordinates: { lat: 6.1234, lng: -0.5678 },
    description: 'Minor collision with another vehicle due to poor visibility',
    reportedBy: 'DR001',
    reportedAt: '2024-08-15T14:30:00Z',
    status: 'investigating',
    casualties: 0,
    injuries: { minor: 2, moderate: 0, severe: 0, fatalities: 0 },
    estimatedDamage: 5000,
    policeReport: 'PR123456',
    insuranceClaim: 'IC789012'
  }
];

export const mockIncidentClaims: IncidentClaim[] = [
  {
    id: 'IC001',
    incidentId: 'IN001',
    claimantName: 'Adwoa Mensah',
    claimantPhone: '+233244111222',
    claimantId: 'GHA-123456789-0',
    injuryType: 'minor',
    compensationAmount: 500,
    description: 'Minor bruises and shock from accident',
    medicalReports: ['MR001.pdf'],
    status: 'pending',
    submittedAt: '2024-08-15T16:00:00Z'
  }
];

export const mockDeathTraps: DeathTrapReport[] = [
  {
    id: 'DT001',
    type: 'fatal_pothole',
    location: 'Accra-Kumasi Highway, Mile 45',
    coordinates: { lat: 6.0987, lng: -0.6543 },
    description: 'Large pothole causing vehicle damage and potential accidents',
    severityLevel: 'high',
    reportedBy: 'DR001',
    reportedAt: '2024-08-14T09:00:00Z',
    status: 'reported',
    affectedRoutes: ['Accra-Kumasi', 'Tema-Kumasi'],
    estimatedRepairCost: 15000,
    priorityScore: 85
  },
  {
    id: 'DT002',
    type: 'faulty_streetlight',
    location: 'Circle Overpass, Accra',
    coordinates: { lat: 5.5601, lng: -0.2058 },
    description: 'Multiple streetlights not working, creating dangerous conditions at night',
    severityLevel: 'medium',
    reportedBy: 'incident_reporter',
    reportedAt: '2024-08-13T20:30:00Z',
    status: 'acknowledged',
    affectedRoutes: ['Circle-Kaneshie', 'Circle-Achimota'],
    priorityScore: 65
  }
];

// Mock Users for UserManagement
export const mockUsers: User[] = [
  {
    id: '1',
    username: 'superadmin',
    email: 'superadmin@rise.gov.gh',
    fullName: 'Super Administrator',
    role: 'super_admin',
    status: 'active',
    createdAt: '2023-01-01T00:00:00Z',
    lastLogin: '2024-08-16T08:00:00Z',
    permissions: ['*']
  },
  {
    id: '2',
    username: 'admin',
    email: 'admin@rise.gov.gh',
    fullName: 'System Administrator',
    role: 'admin',
    status: 'active',
    createdAt: '2023-01-01T00:00:00Z',
    lastLogin: '2024-08-15T14:00:00Z',
    permissions: ['view_dashboard', 'manage_users', 'manage_stations', 'manage_vehicles']
  },
  {
    id: '3',
    username: 'rmgr_ashanti',
    email: 'regional.ashanti@rise.gov.gh',
    fullName: 'Kwame Asante',
    role: 'regional_manager',
    region: 'Ashanti',
    status: 'active',
    createdAt: '2023-02-01T00:00:00Z',
    lastLogin: '2024-08-16T07:30:00Z',
    permissions: ['view_dashboard', 'manage_stations', 'manage_vehicles']
  },
  {
    id: '4',
    username: 'dmgr_kumasi',
    email: 'district.kumasi@rise.gov.gh',
    fullName: 'Akosua Mensah',
    role: 'district_manager',
    region: 'Ashanti',
    district: 'Kumasi',
    status: 'active',
    createdAt: '2023-02-15T00:00:00Z',
    lastLogin: '2024-08-15T16:20:00Z',
    permissions: ['view_dashboard', 'manage_stations']
  },
  {
    id: '5',
    username: 'ops_admin',
    email: 'operations@rise.gov.gh',
    fullName: 'Yaw Boateng',
    role: 'admin_operation',
    status: 'active',
    createdAt: '2023-03-01T00:00:00Z',
    lastLogin: '2024-08-16T09:00:00Z',
    permissions: ['view_dashboard', 'manage_trips', 'manage_vehicles']
  },
  {
    id: '6',
    username: 'hr_admin',
    email: 'hr@rise.gov.gh',
    fullName: 'Ama Owusu',
    role: 'admin_hrm',
    status: 'active',
    createdAt: '2023-03-15T00:00:00Z',
    lastLogin: '2024-08-15T11:45:00Z',
    permissions: ['view_dashboard', 'manage_users', 'manage_drivers']
  },
  {
    id: '7',
    username: 'incident_reporter',
    email: 'incidents.accra@rise.gov.gh',
    fullName: 'Kojo Asamoah',
    role: 'district_incident_reporter',
    region: 'Greater Accra',
    district: 'Accra',
    status: 'active',
    createdAt: '2023-04-01T00:00:00Z',
    lastLogin: '2024-08-16T06:30:00Z',
    permissions: ['view_dashboard', 'manage_incidents', 'manage_claims']
  },
  {
    id: '8',
    username: 'worker',
    email: 'worker.station1@rise.gov.gh',
    fullName: 'Adwoa Adjei',
    role: 'station_worker',
    stationId: 'ST001',
    stationName: 'Accra Central Station',
    status: 'active',
    createdAt: '2023-05-01T00:00:00Z',
    lastLogin: '2024-08-16T05:00:00Z',
    permissions: ['view_dashboard', 'manage_trips', 'manage_passengers']
  }
];

// User roles for UserManagement
export const userRoles = [
  { value: 'super_admin', label: 'Super Administrator', description: 'Full system access' },
  { value: 'admin', label: 'Administrator', description: 'Administrative access' },
  { value: 'regional_manager', label: 'Regional Manager', description: 'Regional management access' },
  { value: 'district_manager', label: 'District Manager', description: 'District management access' },
  { value: 'admin_operation', label: 'Operations Admin', description: 'Operations management' },
  { value: 'admin_hrm', label: 'HR Admin', description: 'Human resources management' },
  { value: 'district_incident_reporter', label: 'Incident Reporter', description: 'Incident reporting and management' },
  { value: 'station_worker', label: 'Station Worker', description: 'Station-level operations' }
];

// Revenue data for Revenue component
export const revenueData: RevenueData[] = [
  {
    period: '2024-01',
    totalRevenue: 125000,
    tripRevenue: 120000,
    penalties: 5000,
    fuelCosts: 45000,
    maintenanceCosts: 15000,
    profit: 65000,
    tripCount: 2400,
    avgFarePerTrip: 50
  },
  {
    period: '2024-02',
    totalRevenue: 135000,
    tripRevenue: 128000,
    penalties: 7000,
    fuelCosts: 48000,
    maintenanceCosts: 18000,
    profit: 69000,
    tripCount: 2560,
    avgFarePerTrip: 50
  },
  {
    period: '2024-03',
    totalRevenue: 142000,
    tripRevenue: 135000,
    penalties: 7000,
    fuelCosts: 50000,
    maintenanceCosts: 20000,
    profit: 72000,
    tripCount: 2700,
    avgFarePerTrip: 50
  },
  {
    period: '2024-04',
    totalRevenue: 138000,
    tripRevenue: 132000,
    penalties: 6000,
    fuelCosts: 52000,
    maintenanceCosts: 16000,
    profit: 70000,
    tripCount: 2640,
    avgFarePerTrip: 50
  },
  {
    period: '2024-05',
    totalRevenue: 148000,
    tripRevenue: 140000,
    penalties: 8000,
    fuelCosts: 54000,
    maintenanceCosts: 22000,
    profit: 72000,
    tripCount: 2800,
    avgFarePerTrip: 50
  },
  {
    period: '2024-06',
    totalRevenue: 155000,
    tripRevenue: 145000,
    penalties: 10000,
    fuelCosts: 56000,
    maintenanceCosts: 25000,
    profit: 74000,
    tripCount: 2900,
    avgFarePerTrip: 50
  }
];

// Status options for helpers
export const statusOptions = [
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'inactive', label: 'Inactive', color: 'gray' },
  { value: 'suspended', label: 'Suspended', color: 'red' },
  { value: 'maintenance', label: 'Maintenance', color: 'yellow' },
  { value: 'pending', label: 'Pending', color: 'orange' },
  { value: 'resolved', label: 'Resolved', color: 'blue' },
  { value: 'reported', label: 'Reported', color: 'purple' }
];

// Tier calculation helper
export const calculateTripTier = (baseFare: number): { tier: 1 | 2 | 3; penalty: number } => {
  if (baseFare <= 29) {
    return { tier: 1, penalty: 0.50 };
  } else if (baseFare <= 59) {
    return { tier: 2, penalty: 1.0 };
  } else {
    return { tier: 3, penalty: 2.0 };
  }
};

// Station code generator
export const generateStationCode = (name: string, region: string, index: number): string => {
  const nameAbbr = name.split(' ').map(word => word.charAt(0)).join('').substring(0, 3).toUpperCase();
  const regionAbbr = region.split(' ').map(word => word.charAt(0)).join('').substring(0, 2).toUpperCase();
  const indexStr = index.toString().padStart(3, '0');
  return `${nameAbbr}-${regionAbbr}${indexStr}`;
};

// Platform explanation helper
export const getPlatformExplanation = (): string => {
  return "Platform refers to the designated boarding and alighting areas where passengers wait for and board vehicles. Each platform can handle multiple vehicles simultaneously and helps organize passenger flow and vehicle operations efficiently.";
};

// Capacity explanation helper
export const getCapacityExplanation = (): string => {
  return "Station capacity refers to the maximum number of vehicles that can be stationed or parked at the station at any given time. This includes both active vehicles waiting for passengers and vehicles in temporary storage.";
};

// Trip status options
export const tripStatuses = [
  { value: 'booking', label: 'Booking', color: 'blue' },
  { value: 'on_road', label: 'On Road', color: 'yellow' },
  { value: 'arrived', label: 'Arrived', color: 'green' },
  { value: 'broken_down', label: 'Broken Down', color: 'red' },
  { value: 'rescheduled', label: 'Rescheduled', color: 'orange' },
  { value: 'offloaded', label: 'Offloaded', color: 'purple' }
];

// Speed status options
export const speedStatuses = [
  { value: 'normal_speed', label: 'Normal Speed', color: 'green' },
  { value: 'over_speed', label: 'Over Speed', color: 'red' }
];