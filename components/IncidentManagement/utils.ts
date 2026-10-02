import type {
  Incident,
  IncidentFilters,
  IncidentStats,
  NewIncidentForm,
  IncidentCoordinates,
  IncidentSeverity,
  IncidentType,
  TimeOfDay,
} from './types';
import { GHANA_BOUNDS, STATUS_OPTIONS } from './constants';

export function calculateStats(incidents: Incident[]): IncidentStats {
  return {
    total: incidents.length,
    reported: incidents.filter((i) => i.status === 'reported').length,
    investigating: incidents.filter((i) => i.status === 'investigating').length,
    resolved: incidents.filter((i) => i.status === 'resolved').length,
    critical: incidents.filter((i) => i.severity === 'critical').length,
    high: incidents.filter((i) => i.severity === 'high').length,
  };
}

export function filterIncidents(incidents: Incident[], filters: IncidentFilters): Incident[] {
  const term = filters.search.toLowerCase();

  return incidents.filter((incident) => {
    const matchesSearch =
      !term ||
      incident.title.toLowerCase().includes(term) ||
      incident.id.toLowerCase().includes(term) ||
      incident.location.toLowerCase().includes(term) ||
      incident.reportedBy.toLowerCase().includes(term);

    const matchesType = filters.type === 'all' || incident.type === filters.type;
    const matchesStatus = filters.status === 'all' || incident.status === filters.status;
    const matchesSeverity = filters.severity === 'all' || incident.severity === filters.severity;

    return matchesSearch && matchesType && matchesStatus && matchesSeverity;
  });
}

export function formatIncidentDate(dateString: string): string {
  return new Date(dateString).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function getStatusLabel(status: string): string {
  const match = STATUS_OPTIONS.find((s) => s.value === status);
  if (match) return match.label;
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getStatusStyles(status: string): { dot: string; text: string; bg: string } {
  switch (status) {
    case 'reported':
      return { dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50 border-amber-200/60' };
    case 'confirmed':
      return { dot: 'bg-sky-500', text: 'text-sky-800', bg: 'bg-sky-50 border-sky-200/60' };
    case 'investigating':
      return { dot: 'bg-[#193cb8]', text: 'text-[#193cb8]', bg: 'bg-[#193cb8]/5 border-[#193cb8]/20' };
    case 'resolved':
      return { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200/60' };
    case 'closed':
      return { dot: 'bg-slate-400', text: 'text-slate-600', bg: 'bg-slate-50 border-slate-200/60' };
    case 'couldnt_fix':
      return { dot: 'bg-orange-500', text: 'text-orange-800', bg: 'bg-orange-50 border-orange-200/60' };
    default:
      return { dot: 'bg-slate-400', text: 'text-slate-600', bg: 'bg-slate-50 border-slate-200/60' };
  }
}

export function getSeverityStyles(severity: string): { dot: string; text: string; ring: string } {
  switch (severity) {
    case 'critical':
      return { dot: 'bg-red-500', text: 'text-red-700', ring: 'ring-red-500/20' };
    case 'high':
      return { dot: 'bg-orange-500', text: 'text-orange-700', ring: 'ring-orange-500/20' };
    case 'medium':
      return { dot: 'bg-amber-500', text: 'text-amber-700', ring: 'ring-amber-500/20' };
    case 'low':
      return { dot: 'bg-emerald-500', text: 'text-emerald-700', ring: 'ring-emerald-500/20' };
    default:
      return { dot: 'bg-slate-400', text: 'text-slate-600', ring: 'ring-slate-500/20' };
  }
}

export function getSeverityDotClass(severity: string): string {
  return getSeverityStyles(severity).dot;
}

export function getMapPosition(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng - GHANA_BOUNDS.west) / (GHANA_BOUNDS.east - GHANA_BOUNDS.west)) * 100;
  const y = ((GHANA_BOUNDS.north - lat) / (GHANA_BOUNDS.north - GHANA_BOUNDS.south)) * 100;
  return { x, y };
}

export function generateIncidentId(count: number): string {
  return `INC-2024-${String(count + 1).padStart(3, '0')}`;
}

export function validateNewIncident(
  form: NewIncidentForm,
  location: IncidentCoordinates | null
): string | null {
  if (!form.title || !form.description || !form.type || !form.severity || !form.region) {
    return 'Please fill in all required fields (including region)';
  }
  const reporterPhone = form.contactNumber.replace(/\D/g, '');
  if (!form.contactNumber.trim() || reporterPhone.length < 9) {
    return 'Please enter a valid reporter telephone number';
  }
  if (form.vehicleMode === 'public' && !form.registeredVehicleId) {
    return 'Select a registered public vehicle or switch to Other vehicle';
  }
  if (form.vehicleMode === 'other' && !form.vehicleRegNumber.trim()) {
    return 'Enter the other vehicle registration number';
  }
  if (!location) {
    return 'Please select a location on the map';
  }
  return null;
}

export function buildIncidentFromForm(
  form: NewIncidentForm,
  location: IncidentCoordinates,
  user: { fullName?: string; role?: string; region?: string; district?: string } | null,
  id: string
): Incident {
  return {
    id,
    title: form.title,
    description: form.description,
    type: form.type as IncidentType,
    severity: form.severity as IncidentSeverity,
    status: 'reported',
    reportedAt: new Date().toISOString(),
    reportedBy: `${user?.fullName ?? 'Unknown'} - ${user?.role ?? 'reporter'}`,
    location: form.location,
    coordinates: location,
    vehicleRegNumber: form.vehicleRegNumber || undefined,
    driverName: form.driverName || undefined,
    passengersInvolved: form.passengersInvolved ? parseInt(form.passengersInvolved, 10) : undefined,
    injuriesReported: form.injuriesReported ? parseInt(form.injuriesReported, 10) : 0,
    fatalitiesReported: form.fatalitiesReported ? parseInt(form.fatalitiesReported, 10) : 0,
    priority: form.severity === 'critical' ? 'urgent' : (form.severity as Incident['priority']),
    region: user?.region || 'Unknown',
    district: user?.district || 'Unknown',
    contactNumber: form.contactNumber || undefined,
    contactEmail: form.contactEmail || undefined,
    weatherConditions: form.weatherConditions || undefined,
    roadConditions: form.roadConditions || undefined,
    timeOfDay: (form.timeOfDay as TimeOfDay) || undefined,
    emergencyServices: form.emergencyServices,
    updatedAt: new Date().toISOString(),
  };
}

export function formatTypeLabel(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function incidentFormFromIncident(incident: Incident): NewIncidentForm {
  const hasFleetVehicle = Boolean(incident.registeredVehicleId);
  const vehicleMode: NewIncidentForm['vehicleMode'] =
    incident.vehicleMode === 'other'
      ? 'other'
      : incident.vehicleMode === 'public' || hasFleetVehicle
        ? 'public'
        : incident.vehicleRegNumber
          ? 'other'
          : 'public';

  return {
    title: incident.title ?? '',
    description: incident.description ?? '',
    type: incident.type ?? '',
    severity: incident.severity ?? '',
    region: incident.region ?? '',
    location: incident.location ?? '',
    vehicleMode,
    registeredVehicleId: incident.registeredVehicleId ?? '',
    vehicleRegNumber: incident.vehicleRegNumber ?? '',
    driverName: incident.driverName ?? '',
    passengersInvolved:
      incident.passengersInvolved != null ? String(incident.passengersInvolved) : '',
    injuriesReported:
      incident.injuriesReported != null ? String(incident.injuriesReported) : '',
    fatalitiesReported:
      incident.fatalitiesReported != null ? String(incident.fatalitiesReported) : '',
    contactNumber: incident.contactNumber ?? '',
    contactEmail: incident.contactEmail ?? '',
    weatherConditions: incident.weatherConditions ?? '',
    roadConditions: incident.roadConditions ?? '',
    timeOfDay: incident.timeOfDay ?? '',
    emergencyServices: incident.emergencyServices ?? [],
    reportSource: incident.reportSource ?? 'internal',
  };
}

export function buildIncidentUpdatePayload(
  form: NewIncidentForm,
  location: IncidentCoordinates | null,
  district?: string
): Record<string, unknown> {
  return {
    title: form.title,
    description: form.description,
    type: form.type,
    severity: form.severity,
    region: form.region,
    district,
    location: form.location,
    coordinates: location,
    vehicleMode: form.vehicleMode,
    registeredVehicleId:
      form.vehicleMode === 'public' ? form.registeredVehicleId || null : null,
    vehicleRegNumber: form.vehicleRegNumber || null,
    driverName: form.driverName || null,
    passengersInvolved: form.passengersInvolved
      ? parseInt(form.passengersInvolved, 10)
      : null,
    injuriesReported: form.injuriesReported ? parseInt(form.injuriesReported, 10) : 0,
    fatalitiesReported: form.fatalitiesReported
      ? parseInt(form.fatalitiesReported, 10)
      : 0,
    contactNumber: form.contactNumber || null,
    contactEmail: form.contactEmail || null,
    weatherConditions: form.weatherConditions || null,
    roadConditions: form.roadConditions || null,
    timeOfDay: form.timeOfDay || null,
  };
}

/** @deprecated use getStatusStyles */
export function getStatusBadgeClass(status: string): string {
  return getStatusStyles(status).bg;
}

/** @deprecated use getSeverityStyles */
export function getSeverityBadgeClass(severity: string): string {
  const s = getSeverityStyles(severity);
  return `${s.text} bg-transparent border-current/20`;
}
