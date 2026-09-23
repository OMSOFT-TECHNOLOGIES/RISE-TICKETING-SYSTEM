export type IncidentType = 'accident' | 'breakdown' | 'theft' | 'violence' | 'medical' | 'other';
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'reported' | 'investigating' | 'resolved' | 'closed';
export type IncidentPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export interface IncidentCoordinates {
  lat: number;
  lng: number;
  address?: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  reportedAt: string;
  reportedBy: string;
  location: string;
  coordinates?: IncidentCoordinates;
  vehicleRegNumber?: string;
  driverName?: string;
  passengersInvolved?: number;
  injuriesReported?: number;
  fatalitiesReported?: number;
  policeReportNumber?: string;
  assignedTo?: string;
  updatedAt: string;
  priority: IncidentPriority;
  region: string;
  district: string;
  contactNumber?: string;
  contactEmail?: string;
  evidenceFiles?: string[];
  estimatedDamage?: number;
  insuranceClaimNumber?: string;
  weatherConditions?: string;
  roadConditions?: string;
  timeOfDay?: TimeOfDay;
  witnesses?: string[];
  emergencyServices?: string[];
}

export interface NewIncidentForm {
  title: string;
  description: string;
  type: string;
  severity: string;
  location: string;
  vehicleRegNumber: string;
  driverName: string;
  passengersInvolved: string;
  injuriesReported: string;
  fatalitiesReported: string;
  contactNumber: string;
  contactEmail: string;
  weatherConditions: string;
  roadConditions: string;
  timeOfDay: string;
  emergencyServices: string[];
}

export interface IncidentFilters {
  search: string;
  type: string;
  status: string;
  severity: string;
}

export interface IncidentStats {
  total: number;
  reported: number;
  investigating: number;
  resolved: number;
  critical: number;
  high: number;
}

export type ViewMode = 'table' | 'map';
