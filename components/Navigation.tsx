import React from 'react';
import { MapPin, Route, UserPlus } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from './ui/sidebar';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { useAuth } from './AuthContext';
import { NAV_SECTIONS, type NavItem } from './config/navigation';
import { isStationOperationsRole } from './constants/userRoles';
import { canViewNavItem, isNavItemRestricted } from './utils/navAccess';
import { usePageAction } from './context/PageActionContext';
import { useNavBadges } from './shared/hooks/useNavBadges';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  isMobile?: boolean;
}

export function Navigation({ currentPage, onPageChange, isMobile = false }: NavigationProps) {
  const { user, hasPermission, isSuperAdmin } = useAuth();
  const { navigateWithAction } = usePageAction();
  const { state } = useSidebar();
  const navBadges = useNavBadges();

  const isCollapsed = state === 'collapsed' && !isMobile;

  const renderMenuItem = (item: NavItem) => {
    if (!isSuperAdmin() && !canViewNavItem(item, hasPermission, user?.role)) {
      return null;
    }

    const isRestricted =
      !isSuperAdmin() && isNavItemRestricted(item, hasPermission, user?.role);
    const badge = navBadges[item.id] ?? item.badge;

    return (
      <SidebarMenuItem key={item.id}>
        <SidebarMenuButton
          onClick={() => onPageChange(item.id)}
          isActive={currentPage === item.id}
          className={`w-full justify-start text-sm font-normal ${isRestricted ? 'opacity-75' : ''}`}
          tooltip={isCollapsed ? item.title : undefined}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {!isCollapsed && (
            <>
              <span className="flex-1 text-sm font-normal">{item.title}</span>
              <div className="ml-auto flex items-center space-x-1">
                {badge && (
                  <Badge variant="secondary" className="text-xs font-medium">
                    {badge}
                  </Badge>
                )}
                {isRestricted && (
                  <Badge
                    variant="outline"
                    className="text-xs font-medium bg-orange-50 text-orange-600 border-orange-200"
                  >
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

  const renderMenuSection = (title: string, items: NavItem[]) => {
    const visibleItems = isSuperAdmin()
      ? items
      : items.filter((item) => canViewNavItem(item, hasPermission, user?.role));

    if (visibleItems.length === 0) {
      return null;
    }

    return (
      <div key={title}>
        {!isCollapsed && (
          <div className="px-3 py-2">
            <h2
              className="mb-2 px-4 font-medium tracking-wide text-muted-foreground uppercase"
              style={{ fontSize: '10px' }}
            >
              {title}
            </h2>
          </div>
        )}
        <div className="px-3">
          <SidebarMenu>{visibleItems.map(renderMenuItem)}</SidebarMenu>
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
        {NAV_SECTIONS.map(({ title, items }) => renderMenuSection(title, items))}

        {isStationOperationsRole(user?.role) && (
          <div>
            {!isCollapsed && (
              <div className="px-3 py-2">
                <h2
                  className="mb-2 px-4 font-medium tracking-wide text-muted-foreground uppercase"
                  style={{ fontSize: '10px' }}
                >
                  Quick Actions
                </h2>
              </div>
            )}
            <div className="px-3">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => navigateWithAction('trips', 'new-trip')}
                    className="w-full justify-start text-sm font-normal text-[#193cb8]"
                    tooltip={isCollapsed ? 'Schedule New Trip' : undefined}
                  >
                    <Route className="h-4 w-4 shrink-0" />
                    {!isCollapsed && <span className="text-sm font-normal">Schedule New Trip</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => navigateWithAction('passengers', 'new-passenger')}
                    className="w-full justify-start text-sm font-normal text-emerald-600"
                    tooltip={isCollapsed ? 'Book Passenger' : undefined}
                  >
                    <UserPlus className="h-4 w-4 shrink-0" />
                    {!isCollapsed && <span className="text-sm font-normal">Book Passenger</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>
            {!isCollapsed && <Separator className="my-2" />}
          </div>
        )}

        {!isCollapsed && user && (
          <div className="px-3 py-2 mt-4">
            <div className="px-4 py-3 bg-muted rounded-lg">
              <div
                className="font-medium tracking-wide text-muted-foreground uppercase mb-2"
                style={{ fontSize: '10px' }}
              >
                Access Level
              </div>
              <div className="text-xs space-y-1">
                {user?.role === 'super_admin' && (
                  <div className="text-red-600">🔓 Full System Access</div>
                )}
                {user?.role === 'admin' && (
                  <div className="text-orange-600">🔐 Administrative Access</div>
                )}
                {user?.role === 'regional_manager' && (
                  <div className="text-[#193cb8]">🏛️ Regional Management</div>
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
                {user?.role === 'station_manager' && (
                  <div className="text-teal-700">🏢 Station Management</div>
                )}
                {user?.role === 'station_worker' && (
                  <div className="text-gray-600">🚌 Station Operations</div>
                )}

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
