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
import { DEFAULT_PAGE, resolvePageId, type PageId } from '../config/pages';
import { checkPageAccess, getRestrictionMessage } from './accessControl';

interface PageRouterProps {
  currentPage: string;
  showSettings: boolean;
  hasPermission: (permission: string) => boolean;
  isSuperAdmin: () => boolean;
  userRole?: string;
}

const PAGE_COMPONENTS: Record<PageId, React.ComponentType> = {
  dashboard: Dashboard,
  stations: StationManagement,
  unions: UnionManagement,
  vehicles: VehicleManagement,
  drivers: DriverManagement,
  trips: TripBooking,
  passengers: PassengerManagement,
  reports: Reports,
  users: UserManagement,
  revenue: Revenue,
  accounts: AccountManagement,
  tickets: PassengerTickets,
  'ratings-complaints': RatingsComplaints,
  'accident-analysis': AccidentAnalysis,
  incidents: IncidentManagement,
  'incident-claims': IncidentClaims,
  'death-traps': DeathTrapReporting,
  'new-trip': TripBooking,
  'new-passenger': PassengerManagement,
  settings: Settings,
};

function renderPageComponent(page: string): React.ReactElement {
  const pageId = resolvePageId(page);
  const Component = PAGE_COMPONENTS[pageId] ?? PAGE_COMPONENTS[DEFAULT_PAGE];
  return <Component />;
}

export function renderPage({
  currentPage,
  showSettings,
  hasPermission,
  isSuperAdmin,
  userRole,
}: PageRouterProps): React.ReactElement {
  if (showSettings) {
    return <Settings />;
  }

  if (isSuperAdmin()) {
    return renderPageComponent(currentPage);
  }

  if (!checkPageAccess(currentPage, hasPermission, isSuperAdmin, userRole)) {
    const restrictionInfo = getRestrictionMessage(currentPage);
    return <AccessRestricted {...restrictionInfo} />;
  }

  return renderPageComponent(currentPage);
}
