import {
  AlertTriangle,
  Car,
  CircleDot,
  Footprints,
  Landmark,
  Lightbulb,
  Package,
  type LucideIcon,
} from 'lucide-react';
import type { DeathTrapReport } from './types';

export interface HazardTypeOption {
  value: DeathTrapReport['type'];
  label: string;
  description: string;
  icon: LucideIcon;
}

export interface SeverityOption {
  value: DeathTrapReport['severityLevel'];
  label: string;
  description: string;
  dot: string;
  ring: string;
  bg: string;
  text: string;
}

export const HAZARD_TYPE_OPTIONS: HazardTypeOption[] = [
  { value: 'fatal_pothole', label: 'Fatal Pothole', description: 'Deep or dangerous road surface damage', icon: CircleDot },
  { value: 'faulty_bridge', label: 'Faulty Bridge', description: 'Structural or safety issues on a bridge', icon: Landmark },
  { value: 'broken_down_vehicle', label: 'Broken Down Vehicle', description: 'Abandoned or stalled vehicle on roadway', icon: Car },
  { value: 'faulty_vehicle', label: 'Faulty Vehicle', description: 'Vehicle posing hazard to other road users', icon: Car },
  { value: 'material_roadside', label: 'Roadside Material', description: 'Debris or materials along the roadside', icon: Package },
  { value: 'no_caution_sign', label: 'Missing Caution Sign', description: 'Required warning signage absent', icon: AlertTriangle },
  { value: 'zebra_crossing_faded', label: 'Faded Crossing', description: 'Pedestrian crossing markings worn away', icon: Footprints },
  { value: 'faulty_streetlight', label: 'Faulty Streetlight', description: 'Non-functional or damaged lighting', icon: Lightbulb },
];

export const SEVERITY_OPTIONS: SeverityOption[] = [
  {
    value: 'low',
    label: 'Low',
    description: 'Minor hazard, low risk',
    dot: 'bg-emerald-500',
    ring: 'border-emerald-500',
    bg: 'bg-emerald-50 border-emerald-200/60',
    text: 'text-emerald-700',
  },
  {
    value: 'medium',
    label: 'Medium',
    description: 'Moderate hazard, caution needed',
    dot: 'bg-amber-500',
    ring: 'border-amber-500',
    bg: 'bg-amber-50 border-amber-200/60',
    text: 'text-amber-700',
  },
  {
    value: 'high',
    label: 'High',
    description: 'Significant hazard, urgent attention',
    dot: 'bg-orange-500',
    ring: 'border-orange-500',
    bg: 'bg-orange-50 border-orange-200/60',
    text: 'text-orange-700',
  },
  {
    value: 'critical',
    label: 'Critical',
    description: 'Extreme hazard, immediate action',
    dot: 'bg-red-500',
    ring: 'border-red-500',
    bg: 'bg-red-50 border-red-200/60',
    text: 'text-red-700',
  },
];

export const DEFAULT_MAP_CENTER = { lat: 5.56, lng: -0.2057 };

export const DEFAULT_HAZARD_FORM = {
  type: 'fatal_pothole' as DeathTrapReport['type'],
  location: '',
  description: '',
  severityLevel: 'medium' as DeathTrapReport['severityLevel'],
  affectedRoutes: [] as string[],
  estimatedRepairCost: 0,
  coordinates: { lat: 0, lng: 0 },
  locationAddress: '',
};

export function calculatePriorityScore(severity: string, routeCount: number): number {
  const severityScore =
    {
      low: 25,
      medium: 50,
      high: 75,
      critical: 100,
    }[severity] ?? 50;

  const routeMultiplier = Math.min(routeCount * 10, 30);
  return Math.min(severityScore + routeMultiplier, 100);
}
