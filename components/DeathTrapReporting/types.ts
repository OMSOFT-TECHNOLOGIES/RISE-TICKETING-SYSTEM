export type DeathTrapType =
  | 'fatal_pothole'
  | 'faulty_bridge'
  | 'broken_down_vehicle'
  | 'faulty_vehicle'
  | 'material_roadside'
  | 'no_caution_sign'
  | 'zebra_crossing_faded'
  | 'faulty_streetlight';

export type DeathTrapSeverity = 'low' | 'medium' | 'high' | 'critical';

export type DeathTrapStatus =
  | 'reported'
  | 'acknowledged'
  | 'in_progress'
  | 'resolved'
  | 'escalated';

export interface DeathTrapReport {
  id: string;
  type: DeathTrapType;
  location: string;
  coordinates: { lat: number; lng: number };
  description: string;
  severityLevel: DeathTrapSeverity;
  reportedBy: string;
  reportedAt: string;
  status: DeathTrapStatus;
  images?: string[];
  affectedRoutes: string[];
  estimatedRepairCost?: number;
  priorityScore: number;
  assignedTo?: string;
  resolvedAt?: string;
}
