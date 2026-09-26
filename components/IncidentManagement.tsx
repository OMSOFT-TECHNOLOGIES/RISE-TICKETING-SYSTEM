import React, { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from './AuthContext';
import { notify } from './utils/notify';
import { incidentApi, parseListResponse, vehicleApi } from './utils/api';
import { usePaginatedEntityList } from './shared/hooks/usePaginatedEntityList';
import { TablePagination } from './shared/TablePagination';
import { DEFAULT_NEW_INCIDENT } from './IncidentManagement/constants';
import type {
  FleetVehicleOption,
  Incident,
  IncidentCoordinates,
  IncidentFilters,
  NewIncidentForm,
  ViewMode,
} from './IncidentManagement/types';
import {
  buildIncidentUpdatePayload,
  incidentFormFromIncident,
  validateNewIncident,
} from './IncidentManagement/utils';
import type { IncidentStats } from './IncidentManagement/types';
import { IncidentCommandHeader } from './IncidentManagement/components/IncidentCommandHeader';
import { IncidentKpiDashboard } from './IncidentManagement/components/IncidentKpiDashboard';
import { IncidentWorkspace } from './IncidentManagement/components/IncidentWorkspace';
import { IncidentTable } from './IncidentManagement/components/IncidentTable';
import { IncidentMapView } from './IncidentManagement/components/IncidentMapView';
import { NewIncidentDialog } from './IncidentManagement/components/NewIncidentDialog';
import { IncidentDetailSheet } from './IncidentManagement/components/IncidentDetailSheet';

function normalizeIncidentRecord(raw: Record<string, unknown>): Incident {
  const evidenceRaw = raw.evidenceFiles;
  const evidenceFiles = Array.isArray(evidenceRaw)
    ? evidenceRaw.map((entry) => String(entry)).filter(Boolean)
    : [];
  return { ...(raw as Incident), evidenceFiles };
}

export function IncidentManagement() {
  const { user, hasPermission } = useAuth();
  const canManage = hasPermission('manage_incidents');

  const [filters, setFilters] = useState<IncidentFilters>({
    search: '',
    type: 'all',
    status: 'all',
    severity: 'all',
  });

  const fetchIncidents = useCallback(
    (page: number, limit: number) =>
      incidentApi.getAll({
        page,
        limit,
        search: filters.search.trim() || undefined,
        type: filters.type,
        status: filters.status,
        severity: filters.severity,
      }),
    [filters.search, filters.type, filters.status, filters.severity]
  );

  const {
    items: incidents,
    loading,
    error,
    refresh,
    isSubmitting,
    setIsSubmitting,
    page,
    setPage,
    pagination,
  } = usePaginatedEntityList<Incident>({
    fetchFn: fetchIncidents,
    entityKey: 'incidents',
    errorMessage: 'Failed to load incidents',
    resetPageDeps: [filters.search, filters.type, filters.status, filters.severity],
  });

  const [stats, setStats] = useState<IncidentStats>({
    total: 0,
    reported: 0,
    investigating: 0,
    resolved: 0,
    critical: 0,
    high: 0,
  });

  const loadStatistics = useCallback(async () => {
    const response = await incidentApi.getStatistics();
    if (!response.success || !response.data) return;
    const data = response.data as Record<string, unknown>;
    setStats({
      total: Number(data.total ?? 0),
      reported: Number(data.reported ?? 0),
      investigating: Number(data.investigating ?? 0),
      resolved: Number(data.resolved ?? 0),
      critical: Number(data.critical ?? 0),
      high: Number(data.high ?? 0),
    });
  }, []);

  useEffect(() => {
    void loadStatistics();
  }, [loadStatistics]);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [incidentFormOpen, setIncidentFormOpen] = useState(false);
  const [incidentFormMode, setIncidentFormMode] = useState<'create' | 'edit'>('create');
  const [editingIncidentId, setEditingIncidentId] = useState<string | null>(null);
  const [incidentForm, setIncidentForm] = useState<NewIncidentForm>(DEFAULT_NEW_INCIDENT);
  const [selectedLocation, setSelectedLocation] = useState<IncidentCoordinates | null>(null);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [fleetVehicles, setFleetVehicles] = useState<FleetVehicleOption[]>([]);

  useEffect(() => {
    if (!incidentFormOpen) return;
    if (incidentFormMode === 'create') {
      setIncidentForm((prev) => ({
        ...prev,
        region: prev.region || user?.region || '',
      }));
    }
    let cancelled = false;
    (async () => {
      const response = await vehicleApi.getAll({ limit: 500, status: 'active' });
      if (cancelled || !response.success || response.data === undefined) return;
      const list = parseListResponse<Record<string, unknown>>(response.data, 'vehicles');
      setFleetVehicles(
        list
          .map((v) => ({
            id: String(v.id ?? ''),
            registrationNumber: String(v.registrationNumber ?? v.registration ?? ''),
            driverName: String(v.driverName ?? v.driver ?? ''),
          }))
          .filter((v) => v.id && v.registrationNumber)
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [incidentFormOpen, incidentFormMode, user?.region]);

  const resultCount = pagination?.totalItems ?? incidents.length;

  const reloadSelectedIncident = async (id: string) => {
    const response = await incidentApi.getById(id);
    if (response.success && response.data) {
      const normalized = normalizeIncidentRecord(response.data as Record<string, unknown>);
      setSelectedIncident(normalized);
      return normalized;
    }
    return null;
  };

  const handleViewIncident = (incident: Incident) => {
    setSelectedIncident(normalizeIncidentRecord(incident as unknown as Record<string, unknown>));
    setShowDetail(true);
    void reloadSelectedIncident(incident.id);
  };

  const patchSelectedIncident = (updated: Incident) => {
    setSelectedIncident(normalizeIncidentRecord(updated as unknown as Record<string, unknown>));
  };

  const handleIncidentStatusChange = async (status: string) => {
    if (!selectedIncident) return;
    const response = await incidentApi.updateStatus(selectedIncident.id, { status });
    if (!response.success) {
      notify.error(typeof response.error === 'string' ? response.error : 'Failed to update status');
      return;
    }
    patchSelectedIncident(response.data as Incident);
    notify.success('Incident status updated');
    await refresh();
    await loadStatistics();
  };

  const handleConfirmPublicReport = async (payload: {
    confirmationStatus: 'confirmed' | 'rejected';
    confirmedByAgency: string;
  }) => {
    if (!selectedIncident) return;
    const response = await incidentApi.confirmPublicReport(selectedIncident.id, payload);
    if (!response.success) {
      notify.error(typeof response.error === 'string' ? response.error : 'Verification failed');
      return;
    }
    patchSelectedIncident(response.data as Incident);
    notify.success(
      payload.confirmationStatus === 'confirmed'
        ? 'Public report confirmed — case set to investigating'
        : 'Public report rejected'
    );
    await refresh();
    await loadStatistics();
  };

  const handleLocationSelect = (location: IncidentCoordinates) => {
    setSelectedLocation(location);
    setIncidentForm((prev) => ({
      ...prev,
      location: location.address || `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`,
    }));
  };

  const resetIncidentForm = () => {
    setIncidentForm({
      ...DEFAULT_NEW_INCIDENT,
      region: user?.region ?? '',
    });
    setSelectedLocation(null);
    setEvidenceFiles([]);
    setEditingIncidentId(null);
    setIncidentFormMode('create');
  };

  const openCreateIncidentForm = () => {
    resetIncidentForm();
    setIncidentFormMode('create');
    setIncidentFormOpen(true);
  };

  const openEditIncidentForm = (incident: Incident) => {
    setEditingIncidentId(incident.id);
    setIncidentFormMode('edit');
    setIncidentForm(incidentFormFromIncident(incident));
    setSelectedLocation(incident.coordinates ?? null);
    setEvidenceFiles([]);
    setIncidentFormOpen(true);
  };

  const uploadPendingEvidence = async (incidentId: string) => {
    if (evidenceFiles.length === 0) return;
    for (const file of evidenceFiles) {
      const uploadRes = await incidentApi.uploadEvidence(incidentId, file);
      if (!uploadRes.success) {
        notify.warning(`Could not upload ${file.name}`);
      }
    }
  };

  const handleSubmitIncidentForm = async () => {
    const validationError = validateNewIncident(incidentForm, selectedLocation);
    if (validationError) {
      notify.error(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      if (incidentFormMode === 'edit' && editingIncidentId) {
        const payload = buildIncidentUpdatePayload(
          incidentForm,
          selectedLocation,
          user?.district
        );
        const response = await incidentApi.update(editingIncidentId, payload);
        if (!response.success) {
          notify.error(response.error || 'Failed to update incident');
          return;
        }
        await uploadPendingEvidence(editingIncidentId);
        setIncidentFormOpen(false);
        resetIncidentForm();
        notify.success('Incident updated');
        await refresh();
        await loadStatistics();
        if (selectedIncident?.id === editingIncidentId) {
          await reloadSelectedIncident(editingIncidentId);
        }
        return;
      }

      const payload = {
        ...buildIncidentUpdatePayload(incidentForm, selectedLocation, user?.district),
        reportSource: incidentForm.reportSource,
        emergencyServices: incidentForm.emergencyServices,
      };

      const response = await incidentApi.create(payload);

      if (response.success) {
        const created = response.data as Record<string, unknown> | undefined;
        const incidentId = created?.id != null ? String(created.id) : '';
        if (incidentId) {
          await uploadPendingEvidence(incidentId);
        }
        setIncidentFormOpen(false);
        resetIncidentForm();
        notify.success('Incident reported successfully');
        await refresh();
        await loadStatistics();
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
        onReportClick={openCreateIncidentForm}
      />

      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        <IncidentKpiDashboard stats={stats} />

        <IncidentWorkspace
          filters={filters}
          viewMode={viewMode}
          resultCount={resultCount}
          totalCount={stats.total}
          onFiltersChange={(updates) => setFilters((prev) => ({ ...prev, ...updates }))}
          onViewModeChange={setViewMode}
        >
          {viewMode === 'table' ? (
            <>
              <IncidentTable
                incidents={incidents}
                canManage={canManage}
                onView={handleViewIncident}
              />
              <TablePagination
                page={page}
                pagination={pagination}
                onPageChange={setPage}
                loading={loading}
                itemLabel="cases"
                className="px-4 pb-4 mt-0 border-t-0"
              />
            </>
          ) : (
            <IncidentMapView
              incidents={incidents}
              selectedId={selectedIncident?.id ?? null}
              onSelectIncident={handleViewIncident}
            />
          )}
        </IncidentWorkspace>
      </div>

      <NewIncidentDialog
        open={incidentFormOpen}
        onOpenChange={(open) => {
          setIncidentFormOpen(open);
          if (!open) resetIncidentForm();
        }}
        mode={incidentFormMode}
        incidentLabel={editingIncidentId ?? undefined}
        form={incidentForm}
        selectedLocation={selectedLocation}
        fleetVehicles={fleetVehicles}
        evidenceFiles={evidenceFiles}
        onEvidenceChange={setEvidenceFiles}
        onFormChange={(updates) => setIncidentForm((prev) => ({ ...prev, ...updates }))}
        onLocationSelect={handleLocationSelect}
        onSubmit={() => void handleSubmitIncidentForm()}
        onCancel={() => {
          setIncidentFormOpen(false);
          resetIncidentForm();
        }}
        isSubmitting={isSubmitting}
      />

      <IncidentDetailSheet
        incident={selectedIncident}
        open={showDetail}
        onOpenChange={setShowDetail}
        canManage={canManage}
        onStatusChange={handleIncidentStatusChange}
        onConfirmPublicReport={handleConfirmPublicReport}
        onEdit={
          selectedIncident && canManage
            ? () => openEditIncidentForm(selectedIncident)
            : undefined
        }
      />
    </div>
  );
}
