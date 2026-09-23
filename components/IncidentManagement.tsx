import React, { useCallback, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from './AuthContext';
import { notify } from './utils/notify';
import { incidentApi } from './utils/api';
import { useEntityList } from './shared/hooks/useEntityList';
import { DEFAULT_NEW_INCIDENT } from './IncidentManagement/constants';
import type {
  Incident,
  IncidentCoordinates,
  IncidentFilters,
  NewIncidentForm,
  ViewMode,
} from './IncidentManagement/types';
import {
  calculateStats,
  filterIncidents,
  validateNewIncident,
} from './IncidentManagement/utils';
import { IncidentCommandHeader } from './IncidentManagement/components/IncidentCommandHeader';
import { IncidentKpiDashboard } from './IncidentManagement/components/IncidentKpiDashboard';
import { IncidentWorkspace } from './IncidentManagement/components/IncidentWorkspace';
import { IncidentTable } from './IncidentManagement/components/IncidentTable';
import { IncidentMapView } from './IncidentManagement/components/IncidentMapView';
import { NewIncidentDialog } from './IncidentManagement/components/NewIncidentDialog';
import { IncidentDetailSheet } from './IncidentManagement/components/IncidentDetailSheet';

export function IncidentManagement() {
  const { user, hasPermission } = useAuth();
  const canManage = hasPermission('manage_incidents');

  const fetchIncidents = useCallback(() => incidentApi.getAll(), []);
  const {
    items: incidents,
    loading,
    error,
    refresh,
    isSubmitting,
    setIsSubmitting,
  } = useEntityList<Incident>({
    fetchFn: fetchIncidents,
    entityKey: 'incidents',
    errorMessage: 'Failed to load incidents',
  });

  const [filters, setFilters] = useState<IncidentFilters>({
    search: '',
    type: 'all',
    status: 'all',
    severity: 'all',
  });
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newIncident, setNewIncident] = useState<NewIncidentForm>(DEFAULT_NEW_INCIDENT);
  const [selectedLocation, setSelectedLocation] = useState<IncidentCoordinates | null>(null);

  const filteredIncidents = useMemo(
    () => filterIncidents(incidents, filters),
    [incidents, filters]
  );

  const stats = useMemo(() => calculateStats(incidents), [incidents]);

  const handleViewIncident = (incident: Incident) => {
    setSelectedIncident(incident);
    setShowDetail(true);
  };

  const handleLocationSelect = (location: IncidentCoordinates) => {
    setSelectedLocation(location);
    setNewIncident((prev) => ({
      ...prev,
      location: location.address || `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`,
    }));
  };

  const resetNewIncidentForm = () => {
    setNewIncident(DEFAULT_NEW_INCIDENT);
    setSelectedLocation(null);
  };

  const handleSubmitIncident = async () => {
    const validationError = validateNewIncident(newIncident, selectedLocation);
    if (validationError) {
      notify.error(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
      title: newIncident.title,
      description: newIncident.description,
        type: newIncident.type,
        severity: newIncident.severity,
      location: newIncident.location,
      coordinates: selectedLocation,
      vehicleRegNumber: newIncident.vehicleRegNumber || undefined,
      driverName: newIncident.driverName || undefined,
        passengersInvolved: newIncident.passengersInvolved
          ? parseInt(newIncident.passengersInvolved, 10)
          : undefined,
        injuriesReported: newIncident.injuriesReported
          ? parseInt(newIncident.injuriesReported, 10)
          : 0,
        fatalitiesReported: newIncident.fatalitiesReported
          ? parseInt(newIncident.fatalitiesReported, 10)
          : 0,
      contactNumber: newIncident.contactNumber || undefined,
      contactEmail: newIncident.contactEmail || undefined,
      weatherConditions: newIncident.weatherConditions || undefined,
      roadConditions: newIncident.roadConditions || undefined,
        timeOfDay: newIncident.timeOfDay || undefined,
      emergencyServices: newIncident.emergencyServices,
        region: user?.region,
        district: user?.district,
      };

      const response = await incidentApi.create(payload);

      if (response.success) {
        resetNewIncidentForm();
        setShowNewDialog(false);
        notify.success('Incident reported successfully');
        await refresh();
      } else {
        notify.error(response.error || 'Failed to report incident');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
  return (
      <div className="min-h-full bg-muted/30 flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#193cb8]" />
                </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-full bg-muted/30 flex flex-col items-center justify-center py-24 px-6 text-center">
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <button
          type="button"
          onClick={() => refresh({ toastOnError: true })}
          className="text-sm font-medium text-[#193cb8] hover:underline"
        >
          Try again
        </button>
              </div>
    );
  }

  return (
    <div className="min-h-full bg-muted/30">
      <IncidentCommandHeader
        stats={stats}
        canReport={canManage}
        onReportClick={() => setShowNewDialog(true)}
      />

      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        <IncidentKpiDashboard stats={stats} />

        <IncidentWorkspace
          filters={filters}
          viewMode={viewMode}
          resultCount={filteredIncidents.length}
          totalCount={incidents.length}
          onFiltersChange={(updates) => setFilters((prev) => ({ ...prev, ...updates }))}
          onViewModeChange={setViewMode}
        >
          {viewMode === 'table' ? (
            <IncidentTable
              incidents={filteredIncidents}
              canManage={canManage}
              onView={handleViewIncident}
            />
          ) : (
            <IncidentMapView
              incidents={filteredIncidents}
              selectedId={selectedIncident?.id ?? null}
              onSelectIncident={handleViewIncident}
            />
          )}
        </IncidentWorkspace>
      </div>

      <NewIncidentDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        form={newIncident}
        selectedLocation={selectedLocation}
        onFormChange={(updates) => setNewIncident((prev) => ({ ...prev, ...updates }))}
        onLocationSelect={handleLocationSelect}
        onSubmit={handleSubmitIncident}
        onCancel={() => {
          setShowNewDialog(false);
          resetNewIncidentForm();
        }}
      />

      <IncidentDetailSheet
        incident={selectedIncident}
        open={showDetail}
        onOpenChange={setShowDetail}
      />
    </div>
  );
}
