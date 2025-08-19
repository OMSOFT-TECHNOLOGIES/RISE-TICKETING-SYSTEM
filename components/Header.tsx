import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeProvider';
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
  HelpCircle
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
import { toast } from 'sonner';

interface HeaderProps {
  onMenuToggle: () => void;
  onSettingsOpen: () => void;
}

export function Header({ onMenuToggle, onSettingsOpen }: HeaderProps) {
  const { user, logout } = useAuth();
  const { theme, setTheme, actualTheme } = useTheme();
  const { isMobile, setOpenMobile } = useSidebar();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog states
  const [showQuickAction, setShowQuickAction] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Mock notifications data
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'New trip booking',
      message: 'Passenger John Doe booked Accra to Kumasi trip',
      time: '2 minutes ago',
      read: false,
      type: 'booking'
    },
    {
      id: 2,
      title: 'Vehicle maintenance due',
      message: 'Vehicle GV-123-20 needs scheduled maintenance',
      time: '1 hour ago',
      read: false,
      type: 'maintenance'
    },
    {
      id: 3,
      title: 'New complaint received',
      message: 'Customer complaint about trip delay',
      time: '3 hours ago',
      read: false,
      type: 'complaint'
    },
    {
      id: 4,
      title: 'Payment received',
      message: 'Revenue updated: +₵450 from recent bookings',
      time: '5 hours ago',
      read: true,
      type: 'payment'
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const toggleTheme = () => {
    // Cycle through light -> dark -> system
    const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(nextTheme);
    
    const messages = {
      light: 'Light mode enabled',
      dark: 'Dark mode enabled', 
      system: 'System theme enabled'
    };
    
    toast.success(messages[nextTheme]);
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

  const markNotificationAsRead = (id: number) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  };

  const getNotificationIcon = (type: string) => {
    const colors = {
      booking: 'bg-blue-500',
      maintenance: 'bg-orange-500',
      complaint: 'bg-red-500',
      payment: 'bg-green-500'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500';
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto">
          <div className="flex h-14 items-center justify-between px-4">
            {/* Left Section - Navigation Controls */}
            <div className="flex items-center gap-2">
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden h-8 w-8 p-0"
                onClick={handleMobileMenuToggle}
              >
                <Menu className="h-4 w-4" />
                <span className="sr-only">Toggle mobile menu</span>
              </Button>
              
              {/* Desktop Sidebar Trigger */}
              <div className="hidden md:block">
                <SidebarTrigger className="h-8 w-8 p-0" />
              </div>
            </div>

            {/* Center Section - Search */}
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

            {/* Right Section - Action Buttons */}
            <div className="flex items-center gap-1">
              {/* Quick Action Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleQuickAction}
                className="h-8 w-8 p-0 hidden sm:flex"
                title={user?.role === 'admin' ? 'Quick admin actions' : 'Quick actions'}
              >
                <Plus className="h-4 w-4" />
                <span className="sr-only">Quick action</span>
              </Button>

              {/* Theme Toggle */}
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

              {/* Notifications */}
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
                          onClick={markAllAsRead}
                          className="h-5 px-2 text-xs"
                        >
                          Mark all read
                        </Button>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-80 overflow-y-auto">
                    <div className="space-y-1 p-1">
                      {notifications.slice(0, 4).map((notification) => (
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
                              <p className={`font-medium ${!notification.read ? '' : 'text-muted-foreground'}`}>
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
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-center text-sm cursor-pointer">
                    View all notifications
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="h-8 w-8 p-0 rounded-full"
                    title={`${user?.name} - ${user?.role}`}
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                        {user?.name ? getUserInitials(user.name) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="sr-only">User menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name}</p>
                      <p className="text-xs text-muted-foreground leading-none">{user?.email}</p>
                      <Badge variant="outline" className="w-fit text-xs mt-1">
                        {user?.role === 'admin' ? 'Administrator' : 'Station Worker'}
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

      {/* Dialogs */}
      <QuickActionDialog
        open={showQuickAction}
        onOpenChange={setShowQuickAction}
      />
      
      <SearchDialog
        open={showSearch}
        onOpenChange={setShowSearch}
        initialQuery={searchQuery}
      />
      
      <UserProfileDialog
        open={showProfile}
        onOpenChange={setShowProfile}
      />
      
      <HelpSupportDialog
        open={showHelp}
        onOpenChange={setShowHelp}
      />
    </>
  );
}