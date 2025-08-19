import React, { useState } from 'react';
import { AuthProvider, useAuth } from './components/AuthContext';
import { NotificationProvider, SystemAlerts } from './components/NotificationSystem';
import { LoginPage } from './components/LoginPage';
import { Navigation } from './components/Navigation';
import { Header } from './components/Header';
import { SidebarProvider, SidebarInset, useSidebar } from './components/ui/sidebar';
import { Toaster } from './components/ui/sonner';
import { ThemeProvider } from './components/ThemeProvider';
import { Shield, AlertTriangle } from 'lucide-react';
import { renderPage } from './components/utils/pageRouter';
import { getAccessLevelInfo } from './components/utils/accessControl';

function AppContent() {
  const { isAuthenticated, user, hasPermission, isSuperAdmin, isAdmin } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showSettings, setShowSettings] = useState(false);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
    setShowSettings(false);
  };

  const handleSettingsOpen = () => {
    setShowSettings(true);
    setCurrentPage('settings');
  };

  const handleMobileMenuToggle = () => {
    // This function will be handled by the SidebarTrigger and mobile Sidebar
    // We keep it for compatibility but it's not needed anymore
  };

  const accessInfo = getAccessLevelInfo(isSuperAdmin, isAdmin, user?.role);

  return (
    <div className="min-h-screen bg-background">
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen w-full">
          {/* Sidebar - Handles both desktop and mobile */}
          <Navigation 
            currentPage={showSettings ? 'settings' : currentPage} 
            onPageChange={handlePageChange} 
          />

          {/* Main Content Area */}
          <SidebarInset className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <Header 
              onMenuToggle={handleMobileMenuToggle}
              onSettingsOpen={handleSettingsOpen}
            />

            {/* System Alerts */}
            <SystemAlerts />

            {/* Access Level Indicator */}
            {user && (
              <div className="bg-muted/50 border-b px-6 py-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Access Level:</span>
                    <span className={`font-medium ${accessInfo.color}`}>
                      {accessInfo.label}
                    </span>
                  </div>
                  {/* Only show limited access warning for non-admin roles */}
                  {!isSuperAdmin() && !isAdmin() && (
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <AlertTriangle className="h-3 w-3" />
                      <span className="text-xs">Limited Access</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Page Content */}
            <main className="flex-1 overflow-auto">
              <div className="flex flex-1 flex-col h-full">
                {renderPage({
                  currentPage,
                  showSettings,
                  hasPermission,
                  isSuperAdmin
                })}
              </div>
            </main>
          </SidebarInset>
        </div>

        {/* Toast Notifications */}
        <Toaster 
          position="bottom-right"
          expand={true}
          richColors={true}
          closeButton={true}
        />
      </SidebarProvider>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="rise-ui-theme">
      <AuthProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}