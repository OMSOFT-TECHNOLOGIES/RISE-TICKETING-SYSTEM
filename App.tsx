import React, { useState } from 'react';
import { AuthProvider, useAuth } from './components/AuthContext';
import { NotificationProvider, SystemAlerts } from './components/NotificationSystem';
import { LoginPage } from './components/LoginPage';
import { Navigation } from './components/Navigation';
import { Header } from './components/Header';
import { Settings } from './components/Settings';
import { Dashboard } from './components/Dashboard';
import { StationManagement } from './components/StationManagement';
import { VehicleManagement } from './components/VehicleManagement';
import { DriverManagement } from './components/DriverManagement';
import { TripBooking } from './components/TripBooking';
import { PassengerTickets } from './components/PassengerTickets';
import { PassengerManagement } from './components/PassengerManagement';
import { UserManagement } from './components/UserManagement';
import { Revenue } from './components/Revenue';
import { Reports } from './components/Reports';
import { RatingsComplaints } from './components/RatingsComplaints';
import { AccidentAnalysis } from './components/AccidentAnalysis';
import { SidebarProvider, SidebarInset } from './components/ui/sidebar';
import { Toaster } from './components/ui/sonner';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from './components/ui/sheet';
import { VisuallyHidden } from './components/ui/visually-hidden';

function AppContent() {
  const { isAuthenticated, user } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showSettings, setShowSettings] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderPage = () => {
    if (showSettings) {
      return <Settings />;
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'stations':
        return <StationManagement />;
      case 'vehicles':
        return <VehicleManagement />;
      case 'drivers':
        return <DriverManagement />;
      case 'trips':
        return <TripBooking />;
      case 'passengers':
        return <PassengerManagement />;
      case 'reports':
        return <Reports />;
      case 'users':
        return user?.role === 'admin' ? <UserManagement /> : <Dashboard />;
      case 'revenue':
        return user?.role === 'admin' ? <Revenue /> : <Dashboard />;
      case 'tickets':
        return user?.role === 'admin' ? <PassengerTickets /> : <Dashboard />;
      case 'ratings-complaints':
        return user?.role === 'admin' ? <RatingsComplaints /> : <Dashboard />;
      case 'accident-analysis':
        return user?.role === 'admin' ? <AccidentAnalysis /> : <Dashboard />;
      default:
        return <Dashboard />;
    }
  };

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
    setShowSettings(false);
    setIsMobileMenuOpen(false);
  };

  const handleSettingsOpen = () => {
    setShowSettings(true);
    setCurrentPage('settings');
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-background">
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen w-full">
          {/* Desktop Sidebar - Collapsible */}
          <div className="hidden md:block">
            <Navigation 
              currentPage={showSettings ? 'settings' : currentPage} 
              onPageChange={handlePageChange} 
            />
          </div>

          {/* Mobile Sidebar */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetContent side="left" className="p-0 w-64 md:hidden">
              <VisuallyHidden>
                <SheetTitle>Navigation Menu</SheetTitle>
                <SheetDescription>
                  Main navigation menu for the RISE transport management system
                </SheetDescription>
              </VisuallyHidden>
              <div className="h-full flex flex-col">
                <Navigation 
                  currentPage={showSettings ? 'settings' : currentPage} 
                  onPageChange={handlePageChange}
                  isMobile={true}
                />
              </div>
            </SheetContent>
          </Sheet>

          {/* Main Content Area */}
          <SidebarInset className="flex-1 flex flex-col min-w-0 md:ml-0">
            {/* Header */}
            <Header 
              onMenuToggle={handleMobileMenuToggle}
              onSettingsOpen={handleSettingsOpen}
            />

            {/* System Alerts */}
            <SystemAlerts />

            {/* Page Content */}
            <main className="flex-1 overflow-auto">
              <div className="flex flex-1 flex-col h-full">
                {renderPage()}
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
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}