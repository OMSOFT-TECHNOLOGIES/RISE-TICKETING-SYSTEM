import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './components/AuthContext';
import { NotificationProvider, SystemAlerts } from './components/NotificationSystem';
import { LoginPage } from './components/LoginPage';
import { ResetPassword } from './components/ResetPassword';
import { ETicketPage } from './components/ETicketPage';
import { DriverReportPage } from './components/DriverReportPage';
import { PoliceCheckPage } from './components/PoliceCheckPage';
import { PublicDeathTrapReportPage } from './components/PublicDeathTrapReportPage';
import { Navigation } from './components/Navigation';
import { Header } from './components/Header';
import { SidebarProvider, SidebarInset } from './components/ui/sidebar';
import { ThemeProvider } from './components/ThemeProvider';
import { Toaster } from './components/ui/sonner';
import ErrorBoundary from './components/ErrorBoundary';
import { RisePreloader } from './components/shared/feedback';
import { DEFAULT_PAGE } from './components/config/pages';
import { renderPage } from './components/utils/pageRouter';
import { checkPageAccess } from './components/utils/accessControl';
import {
  PageActionProvider,
  type PageActionId,
} from './components/context/PageActionContext';

function resolveSavedPage(saved: string): { page: string; action: PageActionId | null } {
  if (saved === 'new-trip') return { page: 'trips', action: 'new-trip' };
  if (saved === 'new-passenger') return { page: 'passengers', action: 'new-passenger' };
  return { page: saved, action: null };
}

function readPageFromUrl(): string | null {
  const fromQuery = new URLSearchParams(window.location.search).get('page');
  if (fromQuery?.trim()) return fromQuery.trim();
  return null;
}

function writePageToUrl(page: string, replace = false) {
  const url = new URL(window.location.href);
  if (page === 'dashboard') {
    url.searchParams.delete('page');
  } else {
    url.searchParams.set('page', page);
  }
  const next = `${url.pathname}${url.search}${url.hash}`;
  if (replace) {
    window.history.replaceState({ page }, '', next);
  } else {
    window.history.pushState({ page }, '', next);
  }
}

function AppContent() {
  const { isAuthenticated, authReady, user, hasPermission, isSuperAdmin } = useAuth();
  const [initialPageState] = useState(() => {
    const fromUrl = readPageFromUrl();
    const saved = fromUrl || localStorage.getItem('rise-current-page') || DEFAULT_PAGE;
    return resolveSavedPage(saved);
  });
  const [currentPage, setCurrentPage] = useState(initialPageState.page);
  const [showSettings, setShowSettings] = useState(false);
  
  // Check for reset password token in URL
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [eTicketToken, setETicketToken] = useState<string | null>(null);
  const [driverReportToken, setDriverReportToken] = useState<string | null>(null);
  const [policeCheckToken, setPoliceCheckToken] = useState<string | null>(null);
  const [policeCheckPassengerId, setPoliceCheckPassengerId] = useState<string | undefined>();
  const [publicHazardReport, setPublicHazardReport] = useState(false);

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
      return;
    }
    const policeMatch = window.location.pathname.match(/^\/police-check\/([^/]+)$/);
    if (policeMatch) {
      setPoliceCheckToken(policeMatch[1]);
      setPoliceCheckPassengerId(urlParams.get('p') ?? undefined);
      return;
    }
    if (window.location.pathname === '/report-hazard') {
      setPublicHazardReport(true);
    }
  }, []);

  useEffect(() => {
    writePageToUrl(currentPage, true);
  }, []);

  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      const page =
        (event.state && typeof event.state.page === 'string' && event.state.page) ||
        readPageFromUrl() ||
        DEFAULT_PAGE;
      setCurrentPage(page);
      setShowSettings(false);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

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
      writePageToUrl(DEFAULT_PAGE, true);
    }
  }, [user?.id, user?.role]);

  // Handle returning to login from reset password page
  const handleResetSuccess = () => {
    setResetToken(null);
    window.history.pushState({}, '', '/');
  };

  let content: React.ReactNode;

  if (resetToken) {
    content = <ResetPassword token={resetToken} onSuccess={handleResetSuccess} />;
  } else if (eTicketToken) {
    content = <ETicketPage token={eTicketToken} />;
  } else if (driverReportToken) {
    content = <DriverReportPage token={driverReportToken} />;
  } else if (policeCheckToken) {
    content = (
      <PoliceCheckPage
        token={policeCheckToken}
        highlightPassengerId={policeCheckPassengerId}
      />
    );
  } else if (publicHazardReport) {
    content = <PublicDeathTrapReportPage />;
  } else if (!authReady) {
    content = <RisePreloader variant="fullscreen" label="Checking your session…" />;
  } else if (!isAuthenticated) {
    content = <LoginPage />;
  } else {
    content = null;
  }

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
    setShowSettings(false);
    writePageToUrl(page);
  };

  const handleSettingsOpen = () => {
    setShowSettings(true);
    setCurrentPage('settings');
    writePageToUrl('settings');
  };

  const handleMobileMenuToggle = () => {
    // This function will be handled by the SidebarTrigger and mobile Sidebar
    // We keep it for compatibility but it's not needed anymore
  };

  if (content !== null) {
    return (
      <>
        {content}
        <Toaster />
      </>
    );
  }

  return (
    <>
    <PageActionProvider
      onPageChange={handlePageChange}
      initialPendingAction={initialPageState.action}
    >
    <div className="min-h-screen bg-[var(--rise-surface)] dark:bg-background">
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
              currentPage={currentPage}
              showSettings={showSettings}
            />

            <SystemAlerts />

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
    <Toaster />
    </>
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
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}