import React from 'react';
import { useAuth } from './AuthContext';
import { Button } from './ui/button';
import { 
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
  SidebarTrigger
} from './ui/sidebar';
import { 
  LayoutDashboard, 
  MapPin, 
  Bus, 
  UserCheck, 
  Route, 
  FileText, 
  Users, 
  DollarSign,
  Ticket,
  Settings,
  Crown,
  Building,
  ChevronRight,
  ChevronLeft,
  UserPlus,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  isMobile?: boolean;
}

const navigationItems = [
  {
    title: "Overview",
    items: [
      {
        key: 'dashboard',
        title: 'Dashboard',
        icon: LayoutDashboard,
        roles: ['admin', 'worker']
      }
    ]
  },
  {
    title: "Operations",
    items: [
      {
        key: 'stations',
        title: 'Stations',
        icon: MapPin,
        roles: ['admin', 'worker']
      },
      {
        key: 'vehicles',
        title: 'Vehicles',
        icon: Bus,
        roles: ['admin', 'worker']
      },
      {
        key: 'drivers',
        title: 'Drivers',
        icon: UserCheck,
        roles: ['admin', 'worker']
      },
      {
        key: 'trips',
        title: 'Trip Booking',
        icon: Route,
        roles: ['admin', 'worker']
      },
      {
        key: 'passengers',
        title: 'Passengers',
        icon: UserPlus,
        roles: ['admin', 'worker']
      }
    ]
  },
  {
    title: "Management",
    items: [
      {
        key: 'tickets',
        title: 'Passenger Tickets',
        icon: Ticket,
        roles: ['admin']
      },
      {
        key: 'users',
        title: 'User Management',
        icon: Users,
        roles: ['admin']
      },
      {
        key: 'revenue',
        title: 'Revenue',
        icon: DollarSign,
        roles: ['admin']
      },
      {
        key: 'ratings-complaints',
        title: 'Ratings & Complaints',
        icon: MessageSquare,
        roles: ['admin']
      },
      {
        key: 'accident-analysis',
        title: 'Accident Analysis',
        icon: AlertTriangle,
        roles: ['admin']
      },
      {
        key: 'reports',
        title: 'Reports',
        icon: FileText,
        roles: ['admin', 'worker']
      }
    ]
  }
];

export function Navigation({ currentPage, onPageChange, isMobile = false }: NavigationProps) {
  const { user } = useAuth();
  const { state, open, setOpen, toggleSidebar } = useSidebar();
  
  const hasAccess = (roles: string[]) => {
    return user?.role && roles.includes(user.role);
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getBadgeForItem = (key: string) => {
    switch (key) {
      case 'tickets':
        return <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-xs">12</Badge>;
      case 'trips':
        return <Badge variant="destructive" className="ml-auto h-5 px-1.5 text-xs">3</Badge>;
      case 'passengers':
        return <Badge variant="outline" className="ml-auto h-5 px-1.5 text-xs">New</Badge>;
      case 'ratings-complaints':
        return <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-xs bg-orange-100 text-orange-700">5</Badge>;
      case 'accident-analysis':
        return <Badge variant="destructive" className="ml-auto h-5 px-1.5 text-xs">3</Badge>;
      default:
        return null;
    }
  };

  // For mobile, always show expanded content
  const isExpanded = isMobile || state === "expanded";

  return (
    <Sidebar variant={isMobile ? "floating" : "inset"} collapsible={isMobile ? "none" : "icon"} className="border-r">
      <SidebarHeader className="border-b">
        <div className="flex items-center px-2 py-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-primary-foreground font-bold text-sm">R</span>
          </div>
          {isExpanded && (
            <div className="ml-2 flex-1 min-w-0">
              <h1 className="font-semibold text-lg truncate">RISE</h1>
              <p className="text-xs text-muted-foreground truncate">
                Road Incidents Support
              </p>
            </div>
          )}
          {!isMobile && (
            <div className="ml-auto">
              {state === "expanded" ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpen(false)}
                  className="h-6 w-6 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpen(true)}
                  className="h-6 w-6 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {navigationItems.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2">
              {isExpanded ? section.title : "•••"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items
                  .filter(item => hasAccess(item.roles))
                  .map((item) => (
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton
                        onClick={() => onPageChange(item.key)}
                        isActive={currentPage === item.key}
                        className="w-full justify-start px-2 py-2 h-10"
                        tooltip={!isExpanded ? item.title : undefined}
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {isExpanded && (
                          <>
                            <span className="flex-1 truncate">{item.title}</span>
                            {getBadgeForItem(item.key)}
                          </>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => onPageChange('settings')}
              isActive={currentPage === 'settings'}
              className="w-full justify-start px-2 py-2 h-12"
              tooltip={!isExpanded ? "Settings" : undefined}
            >
              <Settings className="h-4 w-4 flex-shrink-0" />
              {isExpanded && (
                <span className="flex-1 truncate">Settings</span>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <div className="px-2 py-2">
              {isExpanded ? (
                <div className="flex items-center space-x-3">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="bg-muted text-xs">
                      {user?.name ? getUserInitials(user.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{user?.name}</p>
                    <div className="flex items-center space-x-1">
                      {user?.role === 'admin' ? (
                        <Crown className="h-3 w-3 text-purple-500 flex-shrink-0" />
                      ) : (
                        <Building className="h-3 w-3 text-blue-500 flex-shrink-0" />
                      )}
                      <span className="text-xs text-muted-foreground capitalize truncate">
                        {user?.role}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-muted text-xs">
                      {user?.name ? getUserInitials(user.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}