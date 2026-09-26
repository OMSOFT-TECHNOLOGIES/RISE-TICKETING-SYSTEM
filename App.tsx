import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './components/AuthContext';
import { NotificationProvider, SystemAlerts } from './components/NotificationSystem';
import { LoginPage } from './components/LoginPage';
import { ResetPassword } from './components/ResetPassword';
import { ETicketPage } from './components/ETicketPage';
import { DriverReportPage } from './components/DriverReportPage';
import { Navigation } from './components/Navigation';
import { Header } from './components/Header';
import { SidebarProvider, SidebarInset } from './components/ui/sidebar';
import { ThemeProvider } from './components/ThemeProvider';
import { Toaster } from './components/ui/sonner';
import ErrorBoundary from './components/ErrorBoundary';
import { Shield, AlertTriangle, Loader2 } from 'lucide-react';
import { DEFAULT_PAGE, isSafetyIncidentPage, isStationWorkerPage } from './components/config/pages';
import { renderPage } from './components/utils/pageRouter';
import { checkPageAccess, getAccessLevelInfo } from './components/utils/accessControl';
import {
  PageActionProvider,
  type PageActionId,
} from './components/context/PageActionContext';

function resolveSavedPage(saved: string): { page: string; action: PageActionId | null } {
  if (saved === 'new-trip') return { page: 'trips', action: 'new-trip' };
  if (saved === 'new-passenger') return { page: 'passengers', action: 'new-passenger' };
  return { page: saved, action: null };
}

function AppContent() {
  const { isAuthenticated, authReady, user, hasPermission, isSuperAdmin, isAdmin } = useAuth();
  const [initialPageState] = useState(() => {
    const saved = localStorage.getItem('rise-current-page') || DEFAULT_PAGE;
    return resolveSavedPage(saved);
  });
  const [currentPage, setCurrentPage] = useState(initialPageState.page);
  const [showSettings, setShowSettings] = useState(false);
  
  // Check for reset password token in URL
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [eTicketToken, setETicketToken] = useState<string | null>(null);
  const [driverReportToken, setDriverReportToken] = useState<string | null>(null);

  useEffect(() => {
    // Check if we're on the reset password route
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (window.location.pathname === '/reset-password' && token) {
      setResetToken(token);
      return;
    }

    const eTicketMatch = window.location.pathname.match(/^\/e-ticket\/([^/]+)$/);
    if (eTicketMatch) {
      setETicketToken(eTicketMatch[1]);
      return;
    }
    const reportMatch = window.location.pathname.match(/^\/report-driver\/([^/]+)$/);
    if (reportMatch) {
      setDriverReportToken(reportMatch[1]);
    }
  }, []);

  // Save current page to localStorage whenever it changes
  useEffect(() => {
    if (currentPage) {
      localStorage.setItem('rise-current-page', currentPage);
    }
  }, [currentPage]);

  // Redirect to dashboard if the saved page is not allowed for this user
  useEffect(() => {
    if (!user) return;
    if (
      !checkPageAccess(currentPage, hasPermission, isSuperAdmin, user.role) &&
      currentPage !== 'settings'
    ) {
      setCurrentPage(DEFAULT_PAGE);
    }
  }, [user?.id, user?.role]);

  // Handle returning to login from reset password page
  const handleResetSuccess = () => {
    setResetToken(null);
    window.history.pushState({}, '', '/');
  };

  // Show reset password page if token exists
  if (resetToken) {
    return <ResetPassword token={resetToken} onSuccess={handleResetSuccess} />;
  }

  // Public e-ticket page (no login required)
  if (eTicketToken) {
    return <ETicketPage token={eTicketToken} />;
  }

  if (driverReportToken) {
    return <DriverReportPage token={driverReportToken} />;
  }

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#193cb8]" />
          <p className="text-sm text-muted-foreground">Checking your session…</p>
        </div>
      </div>
    );
  }

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
    <PageActionProvider
      onPageChange={handlePageChange}
      initialPendingAction={initialPageState.action}
    >
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
                  {/* Only show limited access warning for non-admin roles, but not for incident reporters on safety pages */}
                  {!isSuperAdmin() && !isAdmin() &&
                    !(user?.role === 'district_incident_reporter' && isSafetyIncidentPage(currentPage)) &&
                    !(user?.role === 'station_worker' && isStationWorkerPage(currentPage)) && (
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
                  isSuperAdmin,
                  userRole: user?.role
                })}
              </div>
            </main>
          </SidebarInset>
        </div>

      </SidebarProvider>
    </div>
    </PageActionProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="rise-ui-theme">
      <ErrorBoundary>
        <AuthProvider>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
          <Toaster />
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}