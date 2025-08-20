import React from 'react';
import { 
  Building2, 
  Car, 
  Users, 
  MapPin, 
  BarChart3, 
  Settings, 
  UserCheck, 
  Ticket, 
  MessageSquare, 
  AlertTriangle,
  DollarSign,
  Route,
  Plus,
  FileText,
  Shield,
  Zap,
  Heart,
  Wallet
} from 'lucide-react';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  useSidebar 
} from './ui/sidebar';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { useAuth } from './AuthContext';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  isMobile?: boolean;
}

export function Navigation({ currentPage, onPageChange, isMobile = false }: NavigationProps) {
  const { user, hasPermission, isSuperAdmin } = useAuth();
  const { state } = useSidebar();
  
  // Check if sidebar is collapsed (for desktop)
  const isCollapsed = state === 'collapsed' && !isMobile;

  const menuItems = [
    {
      title: 'Dashboard',
      icon: BarChart3,
      href: 'dashboard',
      permission: 'view_dashboard',
      badge: null
    },
    {
      title: 'Station Management',
      icon: Building2,
      href: 'stations',
      permission: 'manage_stations',
      badge: null
    },
    {
      title: 'Union Management',
      icon: Shield,
      href: 'unions',
      permission: 'manage_unions',
      badge: null,
      restrictedAccess: true // Marked as restricted for regular admins
    },
    {
      title: 'Vehicle Management',
      icon: Car,
      href: 'vehicles',
      permission: 'manage_vehicles',
      badge: null
    },
    {
      title: 'Driver Management',
      icon: UserCheck,
      href: 'drivers',
      permission: 'manage_drivers',
      badge: null
    },
    {
      title: 'Trip Management',
      icon: Route,
      href: 'trips',
      permission: 'manage_trips',
      badge: null
    },
    {
      title: 'Passenger Management',
      icon: Users,
      href: 'passengers',
      permission: 'manage_passengers',
      badge: null
    }
  ];

  const incidentMenuItems = [
    {
      title: 'Incident Management',
      icon: AlertTriangle,
      href: 'incidents',
      permission: 'manage_incidents',
      badge: null
    },
    {
      title: 'Incident Claims',
      icon: Heart,
      href: 'incident-claims',
      permission: 'manage_claims',
      badge: '2',
      restrictedAccess: true
    },
    {
      title: 'Death Trap Reports',
      icon: Zap,
      href: 'death-traps',
      permission: 'view_death_traps',
      badge: '3',
      restrictedAccess: true
    },
    {
      title: 'Accident Analysis',
      icon: FileText,
      href: 'accident-analysis',
      permission: 'view_reports',
      badge: null
    }
  ];

  const reportMenuItems = [
    {
      title: 'Reports',
      icon: BarChart3,
      href: 'reports',
      permission: 'view_reports',
      badge: null
    },
    {
      title: 'Revenue Analytics',
      icon: DollarSign,
      href: 'revenue',
      permission: 'view_revenue',
      badge: null
    },
    {
      title: 'Account Management',
      icon: Wallet,
      href: 'accounts',
      permission: 'view_revenue',
      badge: null,
      restrictedAccess: true
    },
    {
      title: 'Passenger Tickets',
      icon: Ticket,
      href: 'tickets',
      permission: 'view_tickets',
      badge: null
    },
    {
      title: 'Ratings & Complaints',
      icon: MessageSquare,
      href: 'ratings-complaints',
      permission: 'view_reports',
      badge: null
    }
  ];

  const adminMenuItems = [
    {
      title: 'User Management',
      icon: Users,
      href: 'users',
      permission: 'manage_users', // Super admin will bypass this check
      badge: null,
      restrictedAccess: true
    }
  ];

  const renderMenuItem = (item: any) => {
    // Super Admin gets access to EVERYTHING - no permission checks needed
    if (isSuperAdmin()) {
      return (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton 
            onClick={() => onPageChange(item.href)}
            isActive={currentPage === item.href}
            className="w-full justify-start text-sm font-normal"
            tooltip={isCollapsed ? item.title : undefined}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!isCollapsed && (
              <>
                <span className="flex-1 text-sm font-normal">{item.title}</span>
                <div className="ml-auto flex items-center space-x-1">
                  {item.badge && (
                    <Badge variant="secondary" className="text-xs font-medium">
                      {item.badge}
                    </Badge>
                  )}
                </div>
              </>
            )}
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    }

    // For non-super admin users, check permissions
    // Special handling for district_incident_reporter to access all safety & incidents pages
    const isIncidentReporter = user?.role === 'district_incident_reporter';
    const safetyIncidentPages = ['incidents', 'incident-claims', 'death-traps', 'accident-analysis'];
    
    const hasBasicPermission = hasPermission(item.permission) || 
      (item.href === 'users' && hasPermission('manage_basic_users')) ||
      (item.href === 'unions' && hasPermission('manage_unions')) ||
      (item.href === 'incident-claims' && hasPermission('manage_claims')) ||
      (item.href === 'death-traps' && (hasPermission('view_death_traps') || hasPermission('create_death_trap_reports'))) ||
      (item.href === 'stations' && hasPermission('manage_stations')) ||
      (item.href === 'incidents' && hasPermission('manage_incidents')) ||
      (item.href === 'accident-analysis' && (hasPermission('view_reports') || hasPermission('manage_incidents'))) ||
      (item.href === 'tickets' && hasPermission('view_tickets')) ||
      (item.href === 'accounts' && hasPermission('view_revenue')) ||
      (item.href === 'ratings-complaints' && (hasPermission('view_reports') || hasPermission('view_ratings_complaints'))) ||
      // Grant full access to all safety & incidents pages for incident reporters
      (isIncidentReporter && safetyIncidentPages.includes(item.href));

    if (!hasBasicPermission) {
      return null;
    }

    // Check if this is a restricted item for the current user
    const isRestricted = item.restrictedAccess && 
      ((item.href === 'users' && !hasPermission('manage_users')) ||
       (item.href === 'unions' && !hasPermission('manage_unions')) ||
       (item.href === 'incident-claims' && !hasPermission('manage_claims') && !isIncidentReporter) ||
       (item.href === 'accounts' && !hasPermission('view_revenue')) ||
       (item.href === 'death-traps' && !hasPermission('view_death_traps') && !hasPermission('create_death_trap_reports') && !isIncidentReporter)) &&
       // Never show restrictions for incident reporters on safety pages
       !(isIncidentReporter && safetyIncidentPages.includes(item.href));

    return (
      <SidebarMenuItem key={item.href}>
        <SidebarMenuButton 
          onClick={() => onPageChange(item.href)}
          isActive={currentPage === item.href}
          className={`w-full justify-start text-sm font-normal ${isRestricted ? 'opacity-75' : ''}`}
          tooltip={isCollapsed ? item.title : undefined}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {!isCollapsed && (
            <>
              <span className="flex-1 text-sm font-normal">{item.title}</span>
              <div className="ml-auto flex items-center space-x-1">
                {item.badge && (
                  <Badge variant="secondary" className="text-xs font-medium">
                    {item.badge}
                  </Badge>
                )}
                {isRestricted && (
                  <Badge variant="outline" className="text-xs font-medium bg-orange-50 text-orange-600 border-orange-200">
                    Limited
                  </Badge>
                )}
              </div>
            </>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  const renderMenuSection = (title: string, items: any[]) => {
    // Super Admin sees all items regardless of permissions
    const visibleItems = isSuperAdmin() ? 
      items : 
      items.filter(item => {
        // Special handling for district_incident_reporter to access all safety & incidents pages
        const isIncidentReporter = user?.role === 'district_incident_reporter';
        const safetyIncidentPages = ['incidents', 'incident-claims', 'death-traps', 'accident-analysis'];
        
        return hasPermission(item.permission) || 
          (item.href === 'users' && hasPermission('manage_basic_users')) ||
          (item.href === 'unions' && hasPermission('manage_unions')) ||
          (item.href === 'incident-claims' && hasPermission('manage_claims')) ||
          (item.href === 'death-traps' && (hasPermission('view_death_traps') || hasPermission('create_death_trap_reports'))) ||
          (item.href === 'stations' && hasPermission('manage_stations')) ||
          (item.href === 'incidents' && hasPermission('manage_incidents')) ||
          (item.href === 'accident-analysis' && (hasPermission('view_reports') || hasPermission('manage_incidents'))) ||
          (item.href === 'tickets' && hasPermission('view_tickets')) ||
          (item.href === 'accounts' && hasPermission('view_revenue')) ||
          (item.href === 'ratings-complaints' && (hasPermission('view_reports') || hasPermission('view_ratings_complaints'))) ||
          // Grant full access to all safety & incidents pages for incident reporters
          (isIncidentReporter && safetyIncidentPages.includes(item.href));
      });
    
    if (visibleItems.length === 0) {
      return null;
    }

    return (
      <div key={title}>
        {!isCollapsed && (
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 font-medium tracking-wide text-muted-foreground uppercase" style={{ fontSize: '10px' }}>
              {title}
            </h2>
          </div>
        )}
        <div className="px-3">
          <SidebarMenu>
            {visibleItems.map(renderMenuItem)}
          </SidebarMenu>
        </div>
        {!isCollapsed && <Separator className="my-2" />}
      </div>
    );
  };

  return (
    <Sidebar className="border-r" collapsible="icon">
      <SidebarHeader className={`border-b ${isCollapsed ? 'px-2 py-4' : 'px-6 py-4'}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2'}`}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
            <MapPin className="h-4 w-4" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-base font-semibold">RISE</span>
              <span className="text-xs text-muted-foreground font-normal">
                Transport Management
              </span>
            </div>
          )}
        </div>
        
        {/* User Info - Only show when not collapsed */}
        {!isCollapsed && user && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <div className="text-sm font-medium">{user?.fullName}</div>
            <div className="text-xs text-muted-foreground font-normal capitalize">
              {user?.role?.replace('_', ' ')}
            </div>
            {user?.stationName && (
              <div className="text-xs text-muted-foreground font-normal">
                📍 {user.stationName}
              </div>
            )}
            {user?.region && (
              <div className="text-xs text-muted-foreground font-normal">
                🏛️ {user.region} {user.district && `- ${user.district}`}
              </div>
            )}
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-0 py-4">
        {/* Core Operations */}
        {renderMenuSection('Core Operations', menuItems)}

        {/* Incident & Safety Management */}
        {renderMenuSection('Safety & Incidents', incidentMenuItems)}

        {/* Reports & Analytics */}
        {renderMenuSection('Reports & Analytics', reportMenuItems)}

        {/* Administration */}
        {renderMenuSection('Administration', adminMenuItems)}

        {/* Quick Actions for Station Workers */}
        {user?.role === 'station_worker' && (
          <div>
            {!isCollapsed && (
              <div className="px-3 py-2">
                <h2 className="mb-2 px-4 font-medium tracking-wide text-muted-foreground uppercase" style={{ fontSize: '10px' }}>
                  Quick Actions
                </h2>
              </div>
            )}
            <div className="px-3">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => onPageChange('new-trip')}
                    className="w-full justify-start text-sm font-normal text-green-600"
                    tooltip={isCollapsed ? "New Trip" : undefined}
                  >
                    <Plus className="h-4 w-4 shrink-0" />
                    {!isCollapsed && <span className="text-sm font-normal">New Trip</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => onPageChange('new-passenger')}
                    className="w-full justify-start text-sm font-normal text-blue-600"
                    tooltip={isCollapsed ? "Add Passenger" : undefined}
                  >
                    <Plus className="h-4 w-4 shrink-0" />
                    {!isCollapsed && <span className="text-sm font-normal">Add Passenger</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>
            {!isCollapsed && <Separator className="my-2" />}
          </div>
        )}

        {/* Role-based Information - Only show when not collapsed */}
        {!isCollapsed && user && (
          <div className="px-3 py-2 mt-4">
            <div className="px-4 py-3 bg-muted rounded-lg">
              <div className="font-medium tracking-wide text-muted-foreground uppercase mb-2" style={{ fontSize: '10px' }}>Access Level</div>
              <div className="text-xs space-y-1">
                {user?.role === 'super_admin' && (
                  <div className="text-red-600">🔓 Full System Access</div>
                )}
                {user?.role === 'admin' && (
                  <div className="text-orange-600">🔐 Administrative Access</div>
                )}
                {user?.role === 'regional_manager' && (
                  <div className="text-blue-600">🏛️ Regional Management</div>
                )}
                {user?.role === 'district_manager' && (
                  <div className="text-green-600">🏢 District Management</div>
                )}
                {user?.role === 'admin_operation' && (
                  <div className="text-purple-600">⚙️ Operations Management</div>
                )}
                {user?.role === 'admin_hrm' && (
                  <div className="text-pink-600">👥 HR Management</div>
                )}
                {user?.role === 'district_incident_reporter' && (
                  <div className="text-yellow-600">⚠️ Incident Reporting</div>
                )}
                {user?.role === 'station_worker' && (
                  <div className="text-gray-600">🚌 Station Operations</div>
                )}
                
                {/* Restriction notices - Only for regular admins, not super admins */}
                {user?.role === 'admin' && !isSuperAdmin() && (
                  <div className="text-xs text-orange-500 bg-orange-50 p-2 rounded mt-2">
                    <div className="font-medium text-xs">Restrictions:</div>
                    <ul className="text-xs font-normal mt-1 space-y-1">
                      <li>• Limited user management</li>
                      <li>• No union management</li>
                      <li>• No claims processing</li>
                      <li>• No safety reporting</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}