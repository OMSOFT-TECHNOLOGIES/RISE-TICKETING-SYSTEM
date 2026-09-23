export type AccidentSeverity = 'minor' | 'major' | 'critical';
export type AccidentStatus = 'pending' | 'investigated' | 'under_investigation' | 'closed';
export type InsuranceClaimStatus = 'approved' | 'processing' | 'pending' | 'denied';

export interface Accident {
  id: string;
  tripId: string;
  date: string;
  location: string;
  severity: AccidentSeverity;
  vehicleId: string;
  driverId: string;
  driverName: string;
  route: string;
  passengersAboard: number;
  injuries: number;
  fatalities: number;
  description: string;
  cause: string;
  weatherConditions?: string | null;
  roadConditions?: string | null;
  timeOfDay?: string | null;
  reportedBy: string;
  stationId: string;
  status: AccidentStatus;
  insuranceClaim: InsuranceClaimStatus;
  cost: number;
}

export interface AccidentFilters {
  search: string;
  severity: string;
  status: string;
}

export interface AccidentStats {
  total: number;
  injuries: number;
  fatalities: number;
  totalCost: number;
  avgInjuries: number;
  avgCost: number;
  fatalityRate: number;
}

export interface NewAccidentForm {
  vehicleRegistrationNumber: string;
  location: string;
  severity: string;
  description: string;
  injuries: string;
  fatalities: string;
  cause: string;
  weatherConditions: string;
  roadConditions: string;
}

export interface TrendDataPoint {
  month: string;
  accidents: number;
  injuries: number;
  cost: number;
}

export interface SeverityDistribution {
  severity: string;
  count: number;
  percentage: number;
  color: string;
}

export interface CauseAnalysisItem {
  cause: string;
  count: number;
  color: string;
}
