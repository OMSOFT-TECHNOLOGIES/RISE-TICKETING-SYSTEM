import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from './AuthContext';
import { AccessRestricted } from './AccessRestricted';
import { notify } from './utils/notify';
import { accidentApi, vehicleApi, parseListResponse } from './utils/api';
import { listParamsForUser } from './utils/stationScope';
import { useEntityList } from './shared/hooks/useEntityList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent } from './ui/card';
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
  const { user } = useAuth();

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

  if (user?.role !== 'admin' && user?.role !== 'super_admin') {
    return (
      <AccessRestricted message="Only administrators can access accident analysis." />
    );
  }

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
      <AccidentCommandHeader
        stats={stats}
        criticalCount={criticalCount}
        onReportClick={() => setShowReportDialog(true)}
        onExportClick={exportData}
      />

      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        <AccidentKpiDashboard stats={stats} />

        <Card className="border shadow-none">
          <CardContent className="p-0">
            <Tabs defaultValue="overview" className="w-full">
              <div className="px-5 pt-5 pb-0 border-b">
                <TabsList className="grid w-full grid-cols-4 h-auto gap-1 bg-muted/50 p-1.5 rounded-lg border shadow-none">
                  <TabsTrigger value="overview" className={ACCIDENT_TAB_TRIGGER_CLASS}>
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="accidents" className={ACCIDENT_TAB_TRIGGER_CLASS}>
                    Accidents
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className={ACCIDENT_TAB_TRIGGER_CLASS}>
                    Analytics
                  </TabsTrigger>
                  <TabsTrigger value="reports" className={ACCIDENT_TAB_TRIGGER_CLASS}>
                    Reports
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-5">
                <TabsContent value="overview" className="mt-0">
                  <AccidentOverviewTab
                    accidents={accidents}
                    severityDistribution={severityDistribution}
                    onViewAccident={handleViewAccident}
                  />
                </TabsContent>

                <TabsContent value="accidents" className="mt-0">
                  <AccidentRegistryTab
                    accidents={filteredAccidents}
                    filters={filters}
                    onFiltersChange={(updates) => setFilters((prev) => ({ ...prev, ...updates }))}
                    onViewAccident={handleViewAccident}
                    onReportClick={() => setShowReportDialog(true)}
                    onExportClick={exportData}
                  />
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
            </Tabs>
          </CardContent>
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
