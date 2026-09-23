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

interface HeaderProps {
  onMenuToggle: () => void;
  onSettingsOpen: () => void;
}

export function Header({ onMenuToggle, onSettingsOpen }: HeaderProps) {
  const { user, logout } = useAuth();
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

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

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
    if (searchQuery.trim()) {
      setShowSearch(true);
    }
  };

  const handleSearchInputClick = () => {
    setShowSearch(true);
  };

  const handleQuickAction = () => {
    setShowQuickAction(true);
  };

  const handleMobileMenuToggle = () => {
    if (isMobile) {
      setOpenMobile(true);
    }
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
      notify.error('Logout failed', {
        description: 'Please try again.',
      });
    }
  };

  const displayName = user?.fullName ?? user?.username ?? 'User';
  const roleLabel = user?.role?.replace(/_/g, ' ') ?? 'User';

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto">
          <div className="flex h-14 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden h-8 w-8 p-0"
                onClick={handleMobileMenuToggle}
              >
                <Menu className="h-4 w-4" />
                <span className="sr-only">Toggle mobile menu</span>
              </Button>

              <div className="hidden md:block">
                <SidebarTrigger className="h-8 w-8 p-0" />
              </div>
            </div>

            <div className="flex-1 max-w-md mx-4">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search trips, passengers, vehicles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={handleSearchInputClick}
                  className="h-8 w-full pl-8 pr-4 text-sm bg-muted/50 border-0 focus:bg-background transition-colors cursor-pointer"
                  readOnly
                />
              </form>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleQuickAction}
                className="h-8 w-8 p-0 hidden sm:flex"
                title={
                  isStationOperationsRole(user?.role)
                    ? 'Station quick actions'
                    : user?.role === 'admin' || user?.role === 'super_admin'
                      ? 'Quick admin actions'
                      : 'Quick actions'
                }
              >
                <Plus className="h-4 w-4" />
                <span className="sr-only">Quick action</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="h-8 w-8 p-0 hidden sm:flex"
                title={`Current: ${theme} (${actualTheme}). Click to cycle through themes`}
              >
                {actualTheme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 relative"
                    title="Notifications"
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-xs flex items-center justify-center border-2 border-background"
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Badge>
                    )}
                    <span className="sr-only">{unreadCount} notifications</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <Badge variant="secondary" className="h-5 px-2 text-xs">
                          {unreadCount} new
                        </Badge>
                      )}
                      {unreadCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleMarkAllAsRead}
                          className="h-5 px-2 text-xs"
                        >
                          Mark all read
                        </Button>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No notifications yet
                      </div>
                    ) : (
                      <div className="space-y-1 p-1">
                        {notifications.slice(0, 6).map((notification) => (
                          <button
                            key={notification.id}
                            onClick={() => markNotificationAsRead(notification.id)}
                            className={`w-full text-left p-3 rounded-md hover:bg-accent/50 transition-colors ${
                              !notification.read ? 'bg-accent/20' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3 text-sm">
                              <div
                                className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${getNotificationIcon(notification.type)}`}
                              />
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`font-medium ${!notification.read ? '' : 'text-muted-foreground'}`}
                                >
                                  {notification.title}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {notification.time}
                                </p>
                              </div>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-center text-sm cursor-pointer">
                    View all notifications
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-8 w-8 p-0 rounded-full"
                    title={`${displayName} - ${roleLabel}`}
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                        {getUserInitials(displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="sr-only">User menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{displayName}</p>
                      <p className="text-xs text-muted-foreground leading-none">{user?.email}</p>
                      <Badge variant="outline" className="w-fit text-xs mt-1 capitalize">
                        {roleLabel}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowProfile(true)}
                    className="cursor-pointer"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onSettingsOpen} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowHelp(true)}
                    className="cursor-pointer"
                  >
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Help & Support
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <QuickActionDialog open={showQuickAction} onOpenChange={setShowQuickAction} />

      <SearchDialog open={showSearch} onOpenChange={setShowSearch} initialQuery={searchQuery} />

      <UserProfileDialog open={showProfile} onOpenChange={setShowProfile} />

      <HelpSupportDialog open={showHelp} onOpenChange={setShowHelp} />
    </>
  );
}
