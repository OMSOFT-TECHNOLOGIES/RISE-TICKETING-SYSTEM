// Central page configuration — single source of truth for routing, permissions, and access

export type PageId =
  | 'dashboard'
  | 'stations'
  | 'unions'
  | 'vehicles'
  | 'drivers'
  | 'trips'
  | 'passengers'
  | 'reports'
  | 'users'
  | 'revenue'
  | 'accounts'
  | 'tickets'
  | 'ratings-complaints'
  | 'accident-analysis'
  | 'incidents'
  | 'incident-claims'
  | 'death-traps'
  | 'new-trip'
  | 'new-passenger'
  | 'settings';

export type NavSection = 'core' | 'safety' | 'reports' | 'admin';

export interface RestrictionMessage {
  title: string;
  message: string;
  suggestion: string;
}

export interface PageConfig {
  id: PageId;
  title: string;
  /** Primary permission required for page access */
  permission: string;
  /** Optional alternate permission checked in navigation (e.g. users page) */
  navPermission?: string;
  section?: NavSection;
  badge?: string | null;
  restrictedAccess?: boolean;
  /** Pages that alias to another page component */
  aliasOf?: PageId;
  restriction?: RestrictionMessage;
}

/** Pages accessible to district incident reporters without standard permissions */
export const SAFETY_INCIDENT_PAGES: PageId[] = [
  'incidents',
  'incident-claims',
  'death-traps',
  'accident-analysis',
];

/** Pages accessible to station workers (scoped station operations) */
export const STATION_WORKER_PAGES: PageId[] = [
  'dashboard',
  'trips',
  'passengers',
  'new-trip',
  'new-passenger',
  'tickets',
];

/** Sidebar + routing allowlist for station managers (station-scoped leadership) */
export const STATION_MANAGER_PAGES: PageId[] = [
  'dashboard',
  'vehicles',
  'drivers',
  'trips',
  'passengers',
  'new-trip',
  'new-passenger',
  'tickets',
  'reports',
];

export const DEFAULT_PAGE: PageId = 'dashboard';

export const PAGES: PageConfig[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    permission: 'view_dashboard',
    section: 'core',
  },
  {
    id: 'stations',
    title: 'Station Management',
    permission: 'manage_stations',
    section: 'core',
  },
  {
    id: 'unions',
    title: 'Union Management',
    permission: 'manage_unions',
    section: 'core',
    restrictedAccess: true,
    restriction: {
      title: 'Union Management Restricted',
      message: 'Union management requires regional or administrative privileges.',
      suggestion: 'This feature is restricted to strategic-level operations.',
    },
  },
  {
    id: 'vehicles',
    title: 'Vehicle Management',
    permission: 'manage_vehicles',
    section: 'core',
  },
  {
    id: 'drivers',
    title: 'Driver Management',
    permission: 'manage_drivers',
    section: 'core',
  },
  {
    id: 'trips',
    title: 'Trip Management',
    permission: 'manage_trips',
    section: 'core',
  },
  {
    id: 'passengers',
    title: 'Passenger Management',
    permission: 'manage_passengers',
    section: 'core',
  },
  {
    id: 'incidents',
    title: 'Incident Management',
    permission: 'manage_incidents',
    section: 'safety',
    restriction: {
      title: 'Incident Management Access',
      message: 'Incident management requires specialized safety or administrative permissions.',
      suggestion: 'Contact your system administrator or incident coordinator for access.',
    },
  },
  {
    id: 'incident-claims',
    title: 'Incident Claims',
    permission: 'manage_claims',
    section: 'safety',
    restrictedAccess: true,
    restriction: {
      title: 'Claims Management Access',
      message: 'Incident claims management requires specialized permissions for injury compensation processing.',
      suggestion: 'Contact an administrator or incident reporter for claims processing.',
    },
  },
  {
    id: 'death-traps',
    title: 'Death Trap Reports',
    permission: 'view_death_traps',
    section: 'safety',
    restrictedAccess: true,
    restriction: {
      title: 'Safety Reporting Access',
      message: 'Death trap reporting requires specialized safety management permissions.',
      suggestion: 'Contact your incident coordinator or safety administrator for access.',
    },
  },
  {
    id: 'accident-analysis',
    title: 'Accident Analysis',
    permission: 'view_reports',
    section: 'safety',
    restriction: {
      title: 'Analysis Reports Access',
      message: 'Accident analysis requires reporting or incident management permissions.',
      suggestion: 'Contact your administrator or incident coordinator for analysis access.',
    },
  },
  {
    id: 'reports',
    title: 'Reports',
    permission: 'view_reports',
    section: 'reports',
  },
  {
    id: 'revenue',
    title: 'Revenue Analytics',
    permission: 'view_revenue',
    section: 'reports',
  },
  {
    id: 'accounts',
    title: 'Account Management',
    permission: 'view_revenue',
    section: 'reports',
    restrictedAccess: true,
    restriction: {
      title: 'Account Management Restricted',
      message: 'Financial account management requires administrative or financial management permissions.',
      suggestion: 'Contact your system administrator or financial manager for account access.',
    },
  },
  {
    id: 'tickets',
    title: 'Passenger Tickets',
    permission: 'view_tickets',
    section: 'reports',
  },
  {
    id: 'ratings-complaints',
    title: 'Ratings & Complaints',
    permission: 'view_reports',
    section: 'reports',
  },
  {
    id: 'users',
    title: 'User Management',
    permission: 'manage_basic_users',
    navPermission: 'manage_users',
    section: 'admin',
    restrictedAccess: true,
    restriction: {
      title: 'User Management Restricted',
      message: 'You need administrative privileges to manage users.',
      suggestion: 'Contact your system administrator for user management access.',
    },
  },
  {
    id: 'new-trip',
    title: 'New Trip',
    permission: 'manage_trips',
    aliasOf: 'trips',
  },
  {
    id: 'new-passenger',
    title: 'Add Passenger',
    permission: 'manage_passengers',
    aliasOf: 'passengers',
  },
];

export const pagePermissions: Record<string, string> = Object.fromEntries(
  PAGES.map((page) => [page.id, page.permission])
);

export const restrictionMessages: Record<string, RestrictionMessage> = Object.fromEntries(
  PAGES.filter((page) => page.restriction).map((page) => [page.id, page.restriction!])
);

export function getPageConfig(pageId: string): PageConfig | undefined {
  return PAGES.find((page) => page.id === pageId);
}

export function getPagesBySection(section: NavSection): PageConfig[] {
  return PAGES.filter((page) => page.section === section);
}

export function isSafetyIncidentPage(pageId: string): boolean {
  return SAFETY_INCIDENT_PAGES.includes(pageId as PageId);
}

export function resolvePageId(page: string): PageId {
  const config = getPageConfig(page);
  if (config?.aliasOf) {
    return config.aliasOf;
  }
  if (PAGES.some((p) => p.id === page)) {
    return page as PageId;
  }
  return DEFAULT_PAGE;
}

export function isStationWorkerPage(pageId: string): boolean {
  return STATION_WORKER_PAGES.includes(resolvePageId(pageId));
}

export function isStationManagerPage(pageId: string): boolean {
  return STATION_MANAGER_PAGES.includes(resolvePageId(pageId));
}
