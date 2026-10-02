import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BarChart3, FileText, LayoutGrid, List } from 'lucide-react';
import { useAuth } from './AuthContext';
import { isRoadSafetyManagerRole } from './constants/userRoles';
import { AccessRestricted } from './AccessRestricted';
import { checkPageAccess, getRestrictionMessage } from './utils/accessControl';
import { notify } from './utils/notify';
import { accidentApi, vehicleApi, parseListResponse } from './utils/api';
import { listParamsForUser } from './utils/stationScope';
import { useEntityList } from './shared/hooks/useEntityList';
import { useClientPagination } from './shared/hooks/useClientPagination';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { RisePreloader, RiseStatusAlert } from './shared/feedback';
import { Button } from './ui/button';
import { ACCIDENT_TAB_TRIGGER_CLASS, DEFAULT_NEW_ACCIDENT } from './AccidentAnalysis/constants';
import type {
  Accident,
  AccidentFilters,
  NewAccidentForm,
} from './AccidentAnalysis/types';
import {
  buildAccidentTrends,
  buildCauseAnalysis,
  buildSeverityDistribution,
  calculateStats,
  filterAccidents,
  validateNewAccident,
} from './AccidentAnalysis/utils';
import { AccidentCommandHeader } from './AccidentAnalysis/components/AccidentCommandHeader';
import { AccidentKpiDashboard } from './AccidentAnalysis/components/AccidentKpiDashboard';
import { AccidentOverviewTab } from './AccidentAnalysis/components/AccidentOverviewTab';
import { AccidentRegistryTab } from './AccidentAnalysis/components/AccidentRegistryTab';
import { AccidentAnalyticsTab } from './AccidentAnalysis/components/AccidentAnalyticsTab';
import { AccidentReportsTab } from './AccidentAnalysis/components/AccidentReportsTab';
import { AccidentDetailSheet } from './AccidentAnalysis/components/AccidentDetailSheet';
import {
  ReportAccidentDialog,
  type ResolvedLatestTrip,
  type VehicleOption,
} from './AccidentAnalysis/components/ReportAccidentDialog';

export function AccidentAnalysis() {
  const { user, hasPermission, isSuperAdmin } = useAuth();
  const isRoadSafetyManager = isRoadSafetyManagerRole(user?.role);
  const allowManualReport = !isRoadSafetyManager;

  const fetchAccidents = useCallback(() => accidentApi.getAll(), []);
  const {
    items: accidents,
    loading,
    error,
    refresh,
    isSubmitting,
    setIsSubmitting,
  } = useEntityList<Accident>({
    fetchFn: fetchAccidents,
    entityKey: 'accidents',
    errorMessage: 'Failed to load accidents',
  });

  const [filters, setFilters] = useState<AccidentFilters>({
    search: '',
    severity: 'all',
    status: 'all',
  });
  const [selectedAccident, setSelectedAccident] = useState<Accident | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [newAccidentReport, setNewAccidentReport] = useState<NewAccidentForm>(DEFAULT_NEW_ACCIDENT);
  const [reportVehicles, setReportVehicles] = useState<VehicleOption[]>([]);
  const [reportVehiclesLoading, setReportVehiclesLoading] = useState(false);
  const [latestTrip, setLatestTrip] = useState<ResolvedLatestTrip | null>(null);
  const [latestTripLoading, setLatestTripLoading] = useState(false);
  const [latestTripError, setLatestTripError] = useState<string | null>(null);
  const latestTripLookupSeq = useRef(0);

  const filteredAccidents = useMemo(
    () => filterAccidents(accidents, filters),
    [accidents, filters]
  );

  const accidentResetKey = `${filters.search}|${filters.severity}|${filters.status}`;
  const {
    paginatedItems: pagedAccidents,
    page: accidentPage,
    setPage: setAccidentPage,
    pagination: accidentPagination,
    pageSize: accidentPageSize,
    setPageSize: setAccidentPageSize,
  } = useClientPagination(filteredAccidents, undefined, accidentResetKey);

  const stats = useMemo(() => calculateStats(accidents), [accidents]);
  const criticalCount = useMemo(
    () => accidents.filter((a) => a.severity === 'critical').length,
    [accidents]
  );
  const severityDistribution = useMemo(
    () => buildSeverityDistribution(accidents),
    [accidents]
  );
  const accidentTrendsData = useMemo(() => buildAccidentTrends(accidents), [accidents]);
  const causeAnalysis = useMemo(() => buildCauseAnalysis(accidents), [accidents]);

  const handleViewAccident = (accident: Accident) => {
    setSelectedAccident(accident);
    setShowDetail(true);
  };

  const resetReportForm = () => {
    setNewAccidentReport(DEFAULT_NEW_ACCIDENT);
    setLatestTrip(null);
    setLatestTripError(null);
    setLatestTripLoading(false);
  };

  useEffect(() => {
    if (!showReportDialog) return;

    let cancelled = false;
    setReportVehiclesLoading(true);

    (async () => {
      const response = await vehicleApi.getAll(listParamsForUser(user, { limit: 500 }));
      if (cancelled) return;
      setReportVehiclesLoading(false);
      if (!response.success || response.data === undefined) {
        setReportVehicles([]);
        return;
      }
      const list = parseListResponse<{ id: string | number; registrationNumber: string }>(
        response.data,
        'vehicles'
      );
      setReportVehicles(
        list.map((v) => ({
          id: String(v.id),
          registrationNumber: String(v.registrationNumber ?? ''),
        }))
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [showReportDialog, user?.stationId]);

  useEffect(() => {
    if (!showReportDialog) return;

    const registration = newAccidentReport.vehicleRegistrationNumber.trim();
    if (registration.length < 2) {
      setLatestTrip(null);
      setLatestTripError(null);
      setLatestTripLoading(false);
      return;
    }

    const seq = ++latestTripLookupSeq.current;
    setLatestTripLoading(true);
    setLatestTripError(null);

    const timer = window.setTimeout(async () => {
      try {
        const response = await vehicleApi.getLatestTripByRegistration(registration);
        if (seq !== latestTripLookupSeq.current) return;

        if (response.success && response.data && typeof response.data === 'object') {
          const data = response.data as Record<string, unknown>;
          setLatestTrip({
            tripId: String(data.tripId ?? ''),
            route: data.route ? String(data.route) : undefined,
            driverName: data.driverName ? String(data.driverName) : undefined,
          });
          setLatestTripError(null);
        } else {
          setLatestTrip(null);
          setLatestTripError(response.error || 'No latest trip found for this vehicle');
        }
      } catch {
        if (seq === latestTripLookupSeq.current) {
          setLatestTrip(null);
          setLatestTripError('Failed to look up the latest trip');
        }
      } finally {
        if (seq === latestTripLookupSeq.current) {
          setLatestTripLoading(false);
        }
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [newAccidentReport.vehicleRegistrationNumber, showReportDialog]);

  const handleReportAccident = async () => {
    const validationError = validateNewAccident(newAccidentReport);
    if (validationError) {
      notify.error(validationError);
      return;
    }

    if (!latestTrip?.tripId) {
      notify.error(latestTripError || 'Could not resolve the latest trip for this vehicle');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        vehicleRegistrationNumber: newAccidentReport.vehicleRegistrationNumber.trim(),
        location: newAccidentReport.location,
        severity: newAccidentReport.severity,
        description: newAccidentReport.description || 'No description provided.',
        injuries: parseInt(newAccidentReport.injuries, 10) || 0,
        fatalities: parseInt(newAccidentReport.fatalities, 10) || 0,
        cause: newAccidentReport.cause || 'unknown',
        weatherConditions: newAccidentReport.weatherConditions || 'unknown',
        roadConditions: newAccidentReport.roadConditions || 'unknown',
        stationId: user?.stationId,
      };

      const response = await accidentApi.create(payload);

      if (response.success) {
        resetReportForm();
        setShowReportDialog(false);
        notify.success('Accident reported successfully');
        await refresh();
      } else {
        notify.error(response.error || 'Failed to report accident');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportData = () => {
    notify.success('Accident data exported successfully');
  };

  if (!checkPageAccess('accident-analysis', hasPermission, isSuperAdmin, user?.role)) {
    const restriction = getRestrictionMessage('accident-analysis');
    return (
      <AccessRestricted
        title={restriction.title}
        message={restriction.message}
        suggestion={restriction.suggestion}
      />
    );
  }

  if (loading && accidents.length === 0 && !error) {
    return (
      <div className="p-6 min-h-[420px] rise-dashboard-page">
        <RisePreloader variant="page" label="Loading accident records…" />
      </div>
    );
  }

  return (
    <div className="min-h-full rise-dashboard-page">
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <AccidentCommandHeader
          stats={stats}
          criticalCount={criticalCount}
          onReportClick={() => setShowReportDialog(true)}
          onExportClick={exportData}
          onRefresh={() => void refresh({ toastOnError: true })}
          loading={loading}
          allowManualReport={allowManualReport}
          isRoadSafetyManager={isRoadSafetyManager}
        />

        {error ? (
          <RiseStatusAlert type="error" title="Could not load accidents">
            {error}
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => void refresh({ toastOnError: true })}
            >
              Try again
            </Button>
          </RiseStatusAlert>
        ) : null}

        <AccidentKpiDashboard stats={stats} />

        <Card className="rounded-2xl shadow-sm ring-1 ring-border/50 overflow-hidden border-0">
          <Tabs defaultValue="overview" className="w-full">
            <CardHeader className="border-b border-border/60 bg-muted/20 pb-4 space-y-4">
              <div>
                <CardTitle className="text-lg font-semibold">Accident workspace</CardTitle>
                <CardDescription className="mt-1">
                  Overview, registry, analytics, and export templates in one place.
                </CardDescription>
              </div>
              <div className="rise-segment-tabs w-full max-w-2xl">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview" className={ACCIDENT_TAB_TRIGGER_CLASS}>
                    <LayoutGrid className="h-4 w-4 shrink-0 opacity-80" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="accidents" className={ACCIDENT_TAB_TRIGGER_CLASS}>
                    <List className="h-4 w-4 shrink-0 opacity-80" />
                    Registry
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className={ACCIDENT_TAB_TRIGGER_CLASS}>
                    <BarChart3 className="h-4 w-4 shrink-0 opacity-80" />
                    Analytics
                  </TabsTrigger>
                  <TabsTrigger value="reports" className={ACCIDENT_TAB_TRIGGER_CLASS}>
                    <FileText className="h-4 w-4 shrink-0 opacity-80" />
                    Reports
                  </TabsTrigger>
                </TabsList>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-4 sm:p-6">
                <TabsContent value="overview" className="mt-0">
                  <AccidentOverviewTab
                    accidents={accidents}
                    severityDistribution={severityDistribution}
                    onViewAccident={handleViewAccident}
                  />
                </TabsContent>

                <TabsContent value="accidents" className="mt-0">
                  <div className={loading ? 'opacity-60 pointer-events-none transition-opacity' : ''}>
                    <AccidentRegistryTab
                      accidents={pagedAccidents}
                      totalMatching={filteredAccidents.length}
                      filters={filters}
                      onFiltersChange={(updates) => setFilters((prev) => ({ ...prev, ...updates }))}
                      onViewAccident={handleViewAccident}
                      page={accidentPage}
                      pagination={accidentPagination}
                      onPageChange={setAccidentPage}
                      pageSize={accidentPageSize}
                      onPageSizeChange={setAccidentPageSize}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="analytics" className="mt-0">
                  <AccidentAnalyticsTab
                    accidentTrendsData={accidentTrendsData}
                    causeAnalysis={causeAnalysis}
                  />
                </TabsContent>

                <TabsContent value="reports" className="mt-0">
                  <AccidentReportsTab />
                </TabsContent>
              </div>
            </CardContent>
          </Tabs>
        </Card>
      </div>

      <ReportAccidentDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        form={newAccidentReport}
        onFormChange={(updates) => setNewAccidentReport((prev) => ({ ...prev, ...updates }))}
        onSubmit={() => void handleReportAccident()}
        onCancel={() => {
          setShowReportDialog(false);
          resetReportForm();
        }}
        vehicles={reportVehicles}
        vehiclesLoading={reportVehiclesLoading}
        latestTrip={latestTrip}
        latestTripLoading={latestTripLoading}
        latestTripError={latestTripError}
        isSubmitting={isSubmitting}
      />

      <AccidentDetailSheet
        accident={selectedAccident}
        open={showDetail}
        onOpenChange={setShowDetail}
      />
    </div>
  );
}
