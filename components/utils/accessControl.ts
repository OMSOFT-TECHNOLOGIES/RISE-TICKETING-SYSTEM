// Access control utilities for the RISE application

export interface RestrictionMessage {
  title: string;
  message: string;
  suggestion: string;
}

// Page access permission mappings
export const pagePermissions: Record<string, string> = {
  dashboard: 'view_dashboard',
  stations: 'manage_stations',
  unions: 'manage_unions',
  vehicles: 'manage_vehicles',
  drivers: 'manage_drivers',
  trips: 'manage_trips',
  passengers: 'manage_passengers',
  reports: 'view_reports',
  users: 'manage_basic_users',
  revenue: 'view_revenue',
  tickets: 'view_tickets',
  'ratings-complaints': 'view_reports',
  'accident-analysis': 'view_reports',
  incidents: 'manage_incidents',
  'incident-claims': 'manage_claims',
  'death-traps': 'view_death_traps',
  'new-trip': 'manage_trips',
  'new-passenger': 'manage_passengers'
};

// Custom access checks for complex permission logic
export const customAccessChecks = {
  'ratings-complaints': (hasPermission: (perm: string) => boolean) => 
    hasPermission('view_reports') || hasPermission('view_ratings_complaints'),
  
  'accident-analysis': (hasPermission: (perm: string) => boolean) => 
    hasPermission('view_reports') || hasPermission('manage_incidents'),
  
  'death-traps': (hasPermission: (perm: string) => boolean) => 
    hasPermission('view_death_traps') || hasPermission('create_death_trap_reports')
};

// Check if user has access to a specific page
export function checkPageAccess(
  page: string, 
  hasPermission: (permission: string) => boolean,
  isSuperAdmin: () => boolean
): boolean {
  // Super Admin has access to everything
  if (isSuperAdmin()) {
    return true;
  }

  // Check for custom access logic first
  if (customAccessChecks[page as keyof typeof customAccessChecks]) {
    return customAccessChecks[page as keyof typeof customAccessChecks](hasPermission);
  }

  // Check standard permission mapping
  const permission = pagePermissions[page];
  return permission ? hasPermission(permission) : false;
}

// Get restriction message for a specific page
export function getRestrictionMessage(page: string): RestrictionMessage {
  const messages: Record<string, RestrictionMessage> = {
    users: {
      title: "User Management Restricted",
      message: "You need administrative privileges to manage users.",
      suggestion: "Contact your system administrator for user management access."
    },
    unions: {
      title: "Union Management Restricted", 
      message: "Union management requires regional or administrative privileges.",
      suggestion: "This feature is restricted to strategic-level operations."
    },
    'incident-claims': {
      title: "Claims Management Restricted",
      message: "Incident claims management requires specialized permissions.",
      suggestion: "Contact an administrator or incident reporter for claims processing."
    },
    'death-traps': {
      title: "Safety Reporting Restricted",
      message: "Death trap reporting requires specialized safety management permissions.",
      suggestion: "Contact your regional manager or incident reporter for safety concerns."
    }
  };

  return messages[page] || {
    title: "Access Restricted",
    message: "You don't have permission to access this feature.",
    suggestion: "Contact your system administrator if you need access."
  };
}

// Get access level information for display
export function getAccessLevelInfo(isSuperAdmin: () => boolean, isAdmin: () => boolean, userRole?: string) {
  if (isSuperAdmin()) {
    return {
      label: 'Super Administrator',
      color: 'text-red-600',
      description: 'Full System Access'
    };
  } else if (isAdmin()) {
    return {
      label: 'Administrator',
      color: 'text-orange-600',
      description: 'Administrative Access'
    };
  } else {
    const roleLabel = userRole?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'User';
    return {
      label: roleLabel,
      color: 'text-blue-600',
      description: 'Limited Access'
    };
  }
}