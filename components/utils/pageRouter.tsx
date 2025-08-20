import React from 'react';
import { Dashboard } from '../Dashboard';
import { StationManagement } from '../StationManagement';
import { UnionManagement } from '../UnionManagement';
import { VehicleManagement } from '../VehicleManagement';
import { DriverManagement } from '../DriverManagement';
import { TripBooking } from '../TripBooking';
import { PassengerTickets } from '../PassengerTickets';
import { PassengerManagement } from '../PassengerManagement';
import { UserManagement } from '../UserManagement';
import { Revenue } from '../Revenue';
import { AccountManagement } from '../AccountManagement';
import { Reports } from '../Reports';
import { RatingsComplaints } from '../RatingsComplaints';
import { AccidentAnalysis } from '../AccidentAnalysis';
import { IncidentManagement } from '../IncidentManagement';
import { IncidentClaims } from '../IncidentClaims';
import { DeathTrapReporting } from '../DeathTrapReporting';
import { Settings } from '../Settings';
import { AccessRestricted } from '../AccessRestricted';
import { checkPageAccess, getRestrictionMessage } from './accessControl';

interface PageRouterProps {
  currentPage: string;
  showSettings: boolean;
  hasPermission: (permission: string) => boolean;
  isSuperAdmin: () => boolean;
  userRole?: string;
}

export function renderPage({ 
  currentPage, 
  showSettings, 
  hasPermission, 
  isSuperAdmin,
  userRole
}: PageRouterProps): React.ReactElement {
  
  // Settings page takes precedence
  if (showSettings) {
    return <Settings />;
  }

  // Super Admin has unrestricted access to everything
  if (isSuperAdmin()) {
    return renderPageComponent(currentPage);
  }

  // Check access for non-super admin users
  if (!checkPageAccess(currentPage, hasPermission, isSuperAdmin, userRole)) {
    const restrictionInfo = getRestrictionMessage(currentPage);
    return <AccessRestricted {...restrictionInfo} />;
  }

  // Render the page component
  return renderPageComponent(currentPage);
}

// Main page component rendering logic
function renderPageComponent(page: string): React.ReactElement {
  switch (page) {
    case 'dashboard':
      return <Dashboard />;
    case 'stations':
      return <StationManagement />;
    case 'unions':
      return <UnionManagement />;
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
      return <UserManagement />;
    case 'revenue':
      return <Revenue />;
    case 'accounts':
      return <AccountManagement />;
    case 'tickets':
      return <PassengerTickets />;
    case 'ratings-complaints':
      return <RatingsComplaints />;
    case 'accident-analysis':
      return <AccidentAnalysis />;
    case 'incidents':
      return <IncidentManagement />;
    case 'incident-claims':
      return <IncidentClaims />;
    case 'death-traps':
      return <DeathTrapReporting />;
    case 'new-trip':
      return <TripBooking />;
    case 'new-passenger':
      return <PassengerManagement />;
    default:
      return <Dashboard />;
  }
}