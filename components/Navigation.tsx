import React from 'react';
import { MapPin, Route, UserPlus } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
import { getAccessLevelInfo } from './utils/accessControl';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  isMobile?: boolean;
}

export function Navigation({ currentPage, onPageChange, isMobile = false }: NavigationProps) {
  const { user, hasPermission, isSuperAdmin, isAdmin } = useAuth();
  const { navigateWithAction } = usePageAction();
  const { state } = useSidebar();
  const navBadges = useNavBadges();

  const isCollapsed = state === 'collapsed' && !isMobile;
  const accessInfo = getAccessLevelInfo(isSuperAdmin, isAdmin, user?.role);

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
                    className="text-xs font-medium bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800"
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
            <div className="flex flex-col min-w-0">
              <span className="text-base font-semibold leading-none">RISE</span>
              <span className="text-xs text-muted-foreground font-normal mt-1">
                Transport Management
              </span>
            </div>
          )}
        </div>

        {!isCollapsed && user && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <div className="text-sm font-medium truncate">{user.fullName}</div>
            <div className="text-xs text-muted-foreground font-normal capitalize">
              {user.role?.replace(/_/g, ' ')}
            </div>
            {user.stationName && (
              <div className="text-xs text-muted-foreground font-normal truncate">
                {user.stationName}
              </div>
            )}
            {user.region && (
              <div className="text-xs text-muted-foreground font-normal truncate">
                {user.region}
                {user.district ? ` - ${user.district}` : ''}
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
                    className="w-full justify-start text-sm font-normal text-[#193cb8] dark:text-blue-400"
                    tooltip={isCollapsed ? 'Schedule New Trip' : undefined}
                  >
                    <Route className="h-4 w-4 shrink-0" />
                    {!isCollapsed && <span className="text-sm font-normal">Schedule New Trip</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => navigateWithAction('passengers', 'new-passenger')}
                    className="w-full justify-start text-sm font-normal text-emerald-600 dark:text-emerald-400"
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
          <div className="px-3 py-2 mt-2">
            <div className="px-4 py-3 bg-muted rounded-lg">
              <div
                className="font-medium tracking-wide text-muted-foreground uppercase mb-2"
                style={{ fontSize: '10px' }}
              >
                Access Level
              </div>
              <div className="text-xs text-muted-foreground">{accessInfo.description}</div>
            </div>
          </div>
        )}
      </SidebarContent>

      {isCollapsed && user && (
        <SidebarFooter className="border-t p-2">
          <div
            className="mx-auto flex h-8 w-8 items-center justify-center rounded-md bg-muted text-[10px] font-semibold text-muted-foreground"
            title={user.fullName}
          >
            {user.fullName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
