import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { useAuth } from './AuthContext';
import { isStationOperationsRole } from './constants/userRoles';
import { useTheme } from './ThemeProvider';
import { useNotifications } from './NotificationSystem';
import { notify } from './utils/notify';
import { QuickActionDialog } from './QuickActionDialog';
import { SearchDialog } from './SearchDialog';
import { UserProfileDialog } from './UserProfileDialog';
import { HelpSupportDialog } from './HelpSupportDialog';
import { getPageConfig } from './config/pages';
import { getAccessLevelInfo } from './utils/accessControl';
import {
  Search,
  Bell,
  Settings,
  Menu,
  Plus,
  Sun,
  Moon,
  LogOut,
  User,
  HelpCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback } from './ui/avatar';
import { SidebarTrigger, useSidebar } from './ui/sidebar';
import { cn } from './ui/utils';

interface HeaderProps {
  onMenuToggle: () => void;
  onSettingsOpen: () => void;
  currentPage: string;
  showSettings?: boolean;
}

export function Header({
  onSettingsOpen,
  currentPage,
  showSettings = false,
}: HeaderProps) {
  const { user, logout, isSuperAdmin, isAdmin } = useAuth();
  const { theme, setTheme, actualTheme } = useTheme();
  const { isMobile, setOpenMobile } = useSidebar();
  const {
    notifications,
    unreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');

  const [showQuickAction, setShowQuickAction] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const pageTitle = showSettings
    ? 'Settings'
    : currentPage === 'dashboard'
      ? 'Home'
      : getPageConfig(currentPage)?.title ?? 'Dashboard';

  const accessInfo = getAccessLevelInfo(isSuperAdmin, isAdmin, user?.role);

  const getUserInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(nextTheme);
    const messages = {
      light: 'Light mode enabled',
      dark: 'Dark mode enabled',
      system: 'System theme enabled',
    };
    notify.success(messages[nextTheme]);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) setShowSearch(true);
  };

  const handleMobileMenuToggle = () => {
    if (isMobile) setOpenMobile(true);
  };

  const handleMarkAllAsRead = () => {
    markAllNotificationsAsRead();
    notify.success('All notifications marked as read');
  };

  const getNotificationIcon = (type: string) => {
    const colors = {
      booking: 'bg-blue-500',
      maintenance: 'bg-orange-500',
      complaint: 'bg-red-500',
      payment: 'bg-green-500',
      system: 'bg-purple-500',
      info: 'bg-gray-500',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500';
  };

  const handleLogout = async () => {
    try {
      await logout();
      notify.success('Logged out successfully');
    } catch {
      notify.error('Logout failed', { description: 'Please try again.' });
    }
  };

  const displayName = user?.fullName ?? user?.username ?? 'User';
  const roleLabel = user?.role?.replace(/_/g, ' ') ?? 'User';

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
        <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
          <div className="flex items-center gap-2 min-w-0 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9"
              onClick={handleMobileMenuToggle}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
            <div className="hidden md:flex">
              <SidebarTrigger className="h-9 w-9" />
            </div>
            <div className="hidden sm:block h-6 w-px bg-border mx-1" />
            <div className="min-w-0 hidden sm:block">
              <h1 className="text-base font-semibold tracking-tight truncate leading-tight">
                {pageTitle}
              </h1>
              <p className="text-xs text-muted-foreground truncate flex items-center gap-2">
                <span className={cn('font-medium', accessInfo.color)}>{accessInfo.label}</span>
                {user?.stationName && (
                  <>
                    <span aria-hidden>·</span>
                    <span>{user.stationName}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex-1 flex justify-center max-w-xl mx-auto">
            <form onSubmit={handleSearch} className="relative w-full hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search trips, passengers, vehicles…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={() => setShowSearch(true)}
                className="h-10 w-full pl-9 rounded-full bg-muted/60 border-transparent focus-visible:bg-background focus-visible:border-border cursor-pointer shadow-sm"
                readOnly
              />
            </form>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 md:hidden"
              onClick={() => setShowSearch(true)}
            >
              <Search className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 hidden sm:inline-flex rounded-full border-dashed"
              onClick={() => setShowQuickAction(true)}
              title={
                isStationOperationsRole(user?.role)
                  ? 'Station quick actions'
                  : 'Quick actions'
              }
            >
              <Plus className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 hidden sm:inline-flex rounded-full"
              onClick={toggleTheme}
              title={`Theme: ${theme}`}
            >
              {actualTheme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 relative rounded-full">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 rounded-xl">
                <DropdownMenuLabel className="flex items-center justify-between py-3">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMarkAllAsRead}
                      className="h-7 text-xs"
                    >
                      Mark all read
                    </Button>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-6 text-center text-sm text-muted-foreground">
                      No notifications yet
                    </p>
                  ) : (
                    <div className="p-1 space-y-0.5">
                      {notifications.slice(0, 6).map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => markNotificationAsRead(notification.id)}
                          className={cn(
                            'w-full text-left p-3 rounded-lg hover:bg-muted/80 transition-colors',
                            !notification.read && 'bg-primary/5'
                          )}
                        >
                          <div className="flex gap-3 text-sm">
                            <div
                              className={cn(
                                'w-2 h-2 rounded-full mt-2 shrink-0',
                                getNotificationIcon(notification.type)
                              )}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">{notification.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-[11px] text-muted-foreground mt-1">
                                {notification.time}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 gap-2 pl-1.5 pr-2 rounded-full ml-1">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {getUserInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden lg:inline text-sm font-medium max-w-[120px] truncate">
                    {displayName.split(' ')[0]}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl">
                <DropdownMenuLabel>
                  <p className="text-sm font-medium">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  <Badge variant="secondary" className="mt-2 capitalize text-xs font-normal">
                    {roleLabel}
                  </Badge>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowProfile(true)}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onSettingsOpen}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowHelp(true)}>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Help & Support
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => void handleLogout()}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="sm:hidden px-4 pb-3 -mt-1">
          <h1 className="text-lg font-semibold">{pageTitle}</h1>
        </div>
      </header>

      <QuickActionDialog open={showQuickAction} onOpenChange={setShowQuickAction} />
      <SearchDialog open={showSearch} onOpenChange={setShowSearch} initialQuery={searchQuery} />
      <UserProfileDialog open={showProfile} onOpenChange={setShowProfile} />
      <HelpSupportDialog open={showHelp} onOpenChange={setShowHelp} />
    </>
  );
}
