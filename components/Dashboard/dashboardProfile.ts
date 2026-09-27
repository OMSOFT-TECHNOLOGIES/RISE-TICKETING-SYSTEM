import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  Bus,
  Calendar,
  ClipboardList,
  DollarSign,
  FileText,
  Heart,
  MapPin,
  Route,
  Shield,
  Users,
  Zap,
} from 'lucide-react';
import type { UserRole } from '../AuthContext';
import {
  isDistrictIncidentReporterRole,
  isHospitalIncidentClaimerRole,
  isIncidentInvestigatorRole,
  isStationOperationsRole,
} from '../constants/userRoles';

export type DashboardStatsSource = 'admin' | 'station' | 'overview';
export type DashboardLayout = 'executive' | 'station' | 'safety' | 'claims' | 'general';

export type Period = 'daily' | 'monthly' | 'yearly';

export type StatDefinition = {
  key: string;
  title: string;
  icon: LucideIcon;
  accent: 'blue' | 'emerald' | 'violet' | 'amber';
  format?: 'currency' | 'number';
};

export type QuickActionDefinition = {
  title: string;
  description: string;
  icon: LucideIcon;
  tone: 'primary' | 'emerald' | 'amber';
  page?: string;
  action?: string;
};

export function resolveDashboardStatsSource(
  role: UserRole | undefined,
  hasPermission: (permission: string) => boolean
): DashboardStatsSource {
  if (role === 'super_admin' || role === 'admin') return 'admin';
  if (isStationOperationsRole(role) && hasPermission('view_station_reports')) return 'station';
  if (
    role === 'regional_manager' ||
    role === 'district_manager' ||
    role === 'admin_operation' ||
    role === 'admin_hrm'
  ) {
    return 'admin';
  }
  return 'overview';
}

export function resolveDashboardLayout(role?: UserRole): DashboardLayout {
  if (isHospitalIncidentClaimerRole(role)) return 'claims';
  if (isIncidentInvestigatorRole(role) || isDistrictIncidentReporterRole(role)) return 'safety';
  if (isStationOperationsRole(role)) return 'station';
  if (
    role === 'super_admin' ||
    role === 'admin' ||
    role === 'regional_manager' ||
    role === 'district_manager'
  ) {
    return 'executive';
  }
  return 'general';
}

export function dashboardEyebrow(layout: DashboardLayout): string {
  switch (layout) {
    case 'executive':
      return 'National operations';
    case 'station':
      return 'Station command';
    case 'safety':
      return 'Safety & incidents';
    case 'claims':
      return 'Hospital claims';
    default:
      return 'RISE workspace';
  }
}

export function dashboardSubtitle(
  layout: DashboardLayout,
  ctx: { stationName?: string; region?: string; district?: string }
): string {
  switch (layout) {
    case 'executive':
      return 'Network-wide snapshot — fleet, revenue, and open safety cases.';
    case 'station':
      return `Today's departures, fleet, and revenue for ${ctx.stationName ?? 'your station'}.`;
    case 'safety':
      return 'Track reported incidents, investigations, and claims awaiting action.';
    case 'claims':
      return 'Submit and track injury compensation after investigator approval.';
    case 'general':
      return 'Your assigned tools and live operational indicators.';
    default:
      return 'Welcome back to RISE.';
  }
}

export function statDefinitions(
  source: DashboardStatsSource,
  layout: DashboardLayout,
  period: Period = 'daily'
): StatDefinition[] {
  const revenueTitle =
    period === 'daily'
      ? 'Revenue today'
      : period === 'yearly'
        ? 'Revenue (YTD)'
        : 'Revenue this month';
  const stationRevenueTitle =
    period === 'daily'
      ? 'Station revenue today'
      : period === 'yearly'
        ? 'Station revenue (YTD)'
        : 'Station revenue this month';
  if (source === 'admin') {
    return [
      { key: 'totalUsers', title: 'System users', icon: Users, accent: 'blue' },
      { key: 'totalStations', title: 'Active stations', icon: MapPin, accent: 'violet' },
      { key: 'totalVehicles', title: 'Fleet vehicles', icon: Bus, accent: 'emerald' },
      {
        key: 'monthlyRevenue',
        title: revenueTitle,
        icon: DollarSign,
        accent: 'amber',
        format: 'currency',
      },
    ];
  }

  if (source === 'station') {
    return [
      { key: 'stationVehicles', title: 'Station fleet', icon: Bus, accent: 'blue' },
      { key: 'todayTrips', title: "Today's trips", icon: Route, accent: 'emerald' },
      { key: 'activeDrivers', title: 'Active drivers', icon: Users, accent: 'violet' },
      {
        key: 'stationRevenue',
        title: stationRevenueTitle,
        icon: DollarSign,
        accent: 'amber',
        format: 'currency',
      },
    ];
  }

  if (layout === 'claims') {
    return [
      { key: 'awaitingInvestigatorClaims', title: 'Awaiting investigator', icon: Shield, accent: 'amber' },
      { key: 'pendingClaims', title: 'Pending review', icon: ClipboardList, accent: 'blue' },
      { key: 'openIncidents', title: 'Open incidents', icon: AlertTriangle, accent: 'violet' },
      { key: 'scheduledTrips', title: 'Scheduled trips', icon: Route, accent: 'emerald' },
    ];
  }

  return [
    { key: 'openIncidents', title: 'Open incidents', icon: AlertTriangle, accent: 'violet' },
    { key: 'criticalIncidents', title: 'Critical severity', icon: Zap, accent: 'amber' },
    { key: 'pendingClaims', title: 'Claims in queue', icon: Heart, accent: 'blue' },
    { key: 'tripsOnRoad', title: 'Trips on road', icon: Route, accent: 'emerald' },
  ];
}

export function quickActionsForLayout(layout: DashboardLayout): QuickActionDefinition[] {
  switch (layout) {
    case 'executive':
      return [
        {
          title: 'Station registry',
          description: 'Manage terminals nationwide',
          icon: MapPin,
          tone: 'primary',
          page: 'stations',
        },
        {
          title: 'User accounts',
          description: 'Roles and access control',
          icon: Users,
          tone: 'emerald',
          page: 'users',
        },
        {
          title: 'Reports hub',
          description: 'Analytics and exports',
          icon: Calendar,
          tone: 'amber',
          page: 'reports',
        },
      ];
    case 'station':
      return [
        {
          title: 'Schedule trip',
          description: 'Create a new departure',
          icon: Route,
          tone: 'primary',
          page: 'trips',
          action: 'new-trip',
        },
        {
          title: 'Book passenger',
          description: 'Add to manifest & e-ticket',
          icon: Users,
          tone: 'emerald',
          page: 'passengers',
          action: 'new-passenger',
        },
        {
          title: 'Fleet & vehicles',
          description: 'Registration and status',
          icon: Bus,
          tone: 'amber',
          page: 'vehicles',
        },
      ];
    case 'safety':
      return [
        {
          title: 'Incident board',
          description: 'Review and assign cases',
          icon: AlertTriangle,
          tone: 'primary',
          page: 'incidents',
        },
        {
          title: 'Claims queue',
          description: 'Investigator approvals',
          icon: Heart,
          tone: 'emerald',
          page: 'incident-claims',
        },
        {
          title: 'Accident analysis',
          description: 'Trends and hotspots',
          icon: FileText,
          tone: 'amber',
          page: 'accident-analysis',
        },
      ];
    case 'claims':
      return [
        {
          title: 'New hospital claim',
          description: 'Start compensation filing',
          icon: Heart,
          tone: 'primary',
          page: 'incident-claims',
        },
        {
          title: 'Open incidents',
          description: 'Verify approval status',
          icon: AlertTriangle,
          tone: 'emerald',
          page: 'incidents',
        },
        {
          title: 'Claims list',
          description: 'Track submitted cases',
          icon: ClipboardList,
          tone: 'amber',
          page: 'incident-claims',
        },
      ];
    default:
      return [
        {
          title: 'Trips',
          description: 'Schedules and manifests',
          icon: Route,
          tone: 'primary',
          page: 'trips',
        },
        {
          title: 'Reports',
          description: 'Operational insights',
          icon: FileText,
          tone: 'emerald',
          page: 'reports',
        },
        {
          title: 'Incidents',
          description: 'Safety coordination',
          icon: AlertTriangle,
          tone: 'amber',
          page: 'incidents',
        },
      ];
  }
}

export function showExecutiveCharts(source: DashboardStatsSource): boolean {
  return source === 'admin';
}

export function showSystemStatusPanel(source: DashboardStatsSource, layout: DashboardLayout): boolean {
  return source === 'admin' || layout === 'safety' || layout === 'executive';
}
