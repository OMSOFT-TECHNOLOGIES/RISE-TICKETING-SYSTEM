import React, { useCallback, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import {
  Plus,
  MapPin,
  Clock,
  CheckCircle,
  Eye,
  Wrench,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Zap,
} from 'lucide-react';
import { cn } from './ui/utils';
import type { DeathTrapReport } from './DeathTrapReporting/types';
import { deathTrapApi } from './utils/api';
import { usePaginatedEntityList } from './shared/hooks/usePaginatedEntityList';
import { TablePagination } from './shared/TablePagination';
import { notify } from './utils/notify';
import {
  calculatePriorityScore,
  DEFAULT_HAZARD_FORM,
  HAZARD_TYPE_OPTIONS,
  SEVERITY_OPTIONS,
} from './DeathTrapReporting/constants';
import { ReportHazardDialog, type HazardReportForm } from './DeathTrapReporting/ReportHazardDialog';
import { DeathTrapKpiSection } from './DeathTrapReporting/DeathTrapKpiSection';
import { HazardStatusBadge } from './DeathTrapReporting/HazardStatusBadge';
import { HazardSeverityBadge } from './DeathTrapReporting/HazardSeverityBadge';
import { PageHeader } from './shared/PageHeader';
import { RisePreloader, RiseStatusAlert } from './shared/feedback';
import { ScrollableTable } from './shared/ScrollableTable';

export function DeathTrapReporting() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const fetchReports = useCallback(
    (page: number, limit: number) =>
      deathTrapApi.getAll({
        page,
        limit,
        search: searchTerm.trim() || undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        severity: severityFilter !== 'all' ? severityFilter : undefined,
      }),
    [searchTerm, typeFilter, severityFilter]
  );
  const {
    items: reports,
    loading,
    error,
    refresh,
    isSubmitting,
    setIsSubmitting,
    page,
    setPage,
    pagination,
    pageSize,
    setPageSize,
  } = usePaginatedEntityList<DeathTrapReport>({
    fetchFn: fetchReports,
    entityKey: 'deathTraps',
    errorMessage: 'Failed to load hazard reports',
    resetPageDeps: [searchTerm, typeFilter, severityFilter],
  });

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<DeathTrapReport | null>(null);
  const [isLocationFromMap, setIsLocationFromMap] = useState(false);

  const [formData, setFormData] = useState<HazardReportForm>(DEFAULT_HAZARD_FORM);

  const resetForm = () => {
    setFormData(DEFAULT_HAZARD_FORM);
    setIsLocationFromMap(false);
  };

  const priorityScore = useMemo(
    () => calculatePriorityScore(formData.severityLevel, formData.affectedRoutes.length),
    [formData.severityLevel, formData.affectedRoutes.length]
  );

  const formatLocationFromMap = (location: { lat: number; lng: number; address?: string }): string => {
    if (location.address) {
      return location.address;
    }
    
    // Create a more descriptive coordinate-based location
    const lat = location.lat.toFixed(4);
    const lng = location.lng.toFixed(4);
    return `Location at coordinates ${lat}, ${lng}`;
  };

  const handleLocationSelect = (location: { lat: number; lng: number; address?: string }) => {
    const formattedLocation = formatLocationFromMap(location);

    setFormData((prev) => ({
      ...prev,
      coordinates: { lat: location.lat, lng: location.lng },
      locationAddress: location.address || '',
      location: formattedLocation,
    }));

    setIsLocationFromMap(true);
  };

  const handleFormChange = (updates: Partial<HazardReportForm>) => {
    setFormData((prev) => {
      const next = { ...prev, ...updates };
      if (updates.location !== undefined && isLocationFromMap && updates.location !== prev.location) {
        setIsLocationFromMap(false);
      }
      return next;
    });
  };

  const handleResetLocation = () => {
    setFormData((prev) => ({
      ...prev,
      location: '',
      coordinates: { lat: 0, lng: 0 },
      locationAddress: '',
    }));
    setIsLocationFromMap(false);
  };

  const handleAdd = async (media: { photos: File[]; videos: File[] }) => {
    if (!formData.location || !formData.description) {
      notify.error('Please fill in all required fields');
      return;
    }

    if (formData.coordinates.lat === 0 && formData.coordinates.lng === 0) {
      notify.error('Please select a location on the map or use current location');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        type: formData.type,
        location: formData.location,
        description: formData.description,
        severityLevel: formData.severityLevel,
        affectedRoutes: formData.affectedRoutes,
        affectedNotes: formData.affectedNotes.trim() || undefined,
        coordinates: formData.coordinates,
      };

      const response = await deathTrapApi.create(payload);

      if (response.success) {
        const created = response.data as { id?: string } | undefined;
        const hazardId = created?.id;
        if (hazardId && (media.photos.length > 0 || media.videos.length > 0)) {
          const uploadRes = await deathTrapApi.uploadMedia(hazardId, media.photos, media.videos);
          if (!uploadRes.success) {
            notify.warning(uploadRes.error || 'Report saved but media upload failed');
          }
        }
        notify.success('Death trap report submitted successfully');
        setIsAddDialogOpen(false);
        resetForm();
        await refresh();
      } else {
        notify.error(response.error || 'Failed to submit hazard report');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (reportId: string, newStatus: DeathTrapReport['status']) => {
    const response = await deathTrapApi.updateStatus(reportId, { status: newStatus });

    if (response.success) {
      notify.success(`Report status updated to ${newStatus}`);
      await refresh();
    } else {
      notify.error(response.error || 'Failed to update report status');
    }
  };

  const getTypeLabel = (type: string) => {
    const typeObj = HAZARD_TYPE_OPTIONS.find((t) => t.value === type);
    return typeObj?.label || type;
  };

  const totalReports = reports.length;
  const totalListed = pagination?.totalItems;
  const criticalReports = reports.filter((r) => r.severityLevel === 'critical').length;
  const pendingReports = reports.filter((r) =>
    ['reported', 'acknowledged'].includes(r.status)
  ).length;
  const resolvedReports = reports.filter((r) => r.status === 'resolved').length;

  const hasActiveFilters =
    typeFilter !== 'all' || severityFilter !== 'all' || Boolean(searchTerm.trim());

  if (loading && reports.length === 0 && !error) {
    return (
      <div className="p-6 min-h-[420px] rise-dashboard-page">
        <RisePreloader variant="page" label="Loading hazard reports…" />
      </div>
    );
  }

  return (
    <div className="min-h-full rise-dashboard-page">
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <PageHeader
          title="Death trap reporting"
          description="Report and manage road hazards and safety threats for triage, repair coordination, and public safety."
          actions={
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void refresh({ toastOnError: true })}
                disabled={loading}
              >
                <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
                Refresh
              </Button>
              <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Report hazard
              </Button>
            </div>
          }
        />

        {error ? (
          <RiseStatusAlert type="error" title="Could not load hazard reports">
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

        <DeathTrapKpiSection
          totalOnPage={totalReports}
          totalListed={totalListed}
          critical={criticalReports}
          pendingAction={pendingReports}
          resolved={resolvedReports}
        />

      <ReportHazardDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        form={formData}
        isLocationFromMap={isLocationFromMap}
        priorityScore={priorityScore}
        onFormChange={handleFormChange}
        onLocationSelect={handleLocationSelect}
        onResetLocation={handleResetLocation}
        onSubmit={(media) => void handleAdd(media)}
        isSubmitting={isSubmitting}
        onCancel={() => {
          setIsAddDialogOpen(false);
          resetForm();
        }}
      />

        <Card className="rounded-2xl shadow-sm ring-1 ring-border/50 overflow-hidden border-0">
          <CardHeader className="space-y-4 border-b border-border/60 bg-muted/20 pb-4">
            <div>
              <CardTitle className="text-lg font-semibold">Hazard registry</CardTitle>
              <CardDescription className="mt-1">
                {totalListed != null
                  ? `${reports.length} of ${totalListed} report${totalListed === 1 ? '' : 's'}`
                  : `${reports.length} report${reports.length === 1 ? '' : 's'}`}{' '}
                · search and filter
              </CardDescription>
            </div>
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Report ID, location, description…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10 bg-background/80"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[180px] h-10 bg-background/80">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {HAZARD_TYPE_OPTIONS.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-full sm:w-[160px] h-10 bg-background/80">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All severity</SelectItem>
                  {SEVERITY_OPTIONS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasActiveFilters ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 text-muted-foreground"
                  onClick={() => {
                    setSearchTerm('');
                    setTypeFilter('all');
                    setSeverityFilter('all');
                  }}
                >
                  Clear
                </Button>
              ) : null}
            </div>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
              Advance status with the row actions — acknowledge, start work, then resolve.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div className={loading ? 'opacity-60 pointer-events-none transition-opacity' : ''}>
              {reports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                  <Zap className="h-10 w-10 text-muted-foreground/50 mb-3" />
                  <p className="font-medium">No hazard reports match your criteria</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    Adjust filters or report a new road hazard.
                  </p>
                </div>
              ) : (
                <ScrollableTable
                  className="border-0 shadow-none ring-0"
                  maxHeightClass="max-h-[min(70vh,560px)]"
                  minWidthClass="min-w-[1100px]"
                >
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Report ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reported</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.map((report) => (
                        <TableRow key={report.id} className="group">
                          <TableCell className="font-medium font-mono text-xs">{report.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const TypeIcon = HAZARD_TYPE_OPTIONS.find((t) => t.value === report.type)?.icon;
                        return TypeIcon ? <TypeIcon className="h-4 w-4 text-muted-foreground shrink-0" /> : null;
                      })()}
                      {getTypeLabel(report.type)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span className="truncate max-w-xs">{report.location}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <HazardSeverityBadge severity={report.severityLevel} />
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-border/80 bg-muted/50 px-2 text-xs font-semibold tabular-nums">
                      {report.priorityScore}
                    </span>
                  </TableCell>
                  <TableCell>
                    <HazardStatusBadge status={report.status} />
                  </TableCell>
                  <TableCell>
                    {new Date(report.reportedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedReport(report);
                          setIsViewDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {report.status !== 'resolved' && (
                        <>
                          {report.status === 'reported' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusUpdate(report.id, 'acknowledged')}
                              className="text-primary"
                              title="Acknowledge"
                            >
                              <Clock className="h-4 w-4" />
                            </Button>
                          )}
                          {report.status === 'acknowledged' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusUpdate(report.id, 'in_progress')}
                              className="text-primary"
                              title="Start work"
                            >
                              <Wrench className="h-4 w-4" />
                            </Button>
                          )}
                          {report.status === 'in_progress' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusUpdate(report.id, 'resolved')}
                              className="text-emerald-700 dark:text-emerald-400"
                              title="Mark resolved"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollableTable>
              )}
              <TablePagination
                page={page}
                pagination={pagination}
                onPageChange={setPage}
                loading={loading}
                itemLabel="reports"
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
                alwaysShow
                className="px-4 sm:px-6 pb-4 pt-2 border-t border-border/60"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden rounded-2xl max-h-[min(90dvh,calc(100%-2rem))] flex flex-col">
          <DialogHeader className="border-b border-border/80 bg-gradient-to-br from-muted/50 to-background px-6 py-5 shrink-0">
            <DialogTitle className="text-xl font-semibold tracking-tight">Hazard report</DialogTitle>
            <DialogDescription className="text-sm">
              {selectedReport ? (
                <span className="font-mono text-xs">{selectedReport.id}</span>
              ) : (
                'Report details'
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedReport ? (
            <DialogBody className="px-6 py-5 space-y-4 max-h-[min(62vh,560px)]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Hazard Type</Label>
                  <div className="mt-2 flex items-center gap-2">
                    {(() => {
                      const TypeIcon = HAZARD_TYPE_OPTIONS.find((t) => t.value === selectedReport.type)?.icon;
                      return TypeIcon ? <TypeIcon className="h-4 w-4 text-muted-foreground" /> : null;
                    })()}
                    {getTypeLabel(selectedReport.type)}
                  </div>
                </div>
                <div>
                  <Label>Severity Level</Label>
                  <div className="mt-2">
                    <HazardSeverityBadge severity={selectedReport.severityLevel} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <Label>Location</Label>
                  <div className="mt-2 flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    {selectedReport.location}
                  </div>
                  {selectedReport.coordinates && (
                    <div className="mt-1 text-sm text-muted-foreground">
                      Coordinates: {selectedReport.coordinates.lat.toFixed(6)}, {selectedReport.coordinates.lng.toFixed(6)}
                    </div>
                  )}
                </div>
                
                {/* Mini Map Display */}
                <div>
                  <Label>Location on Map</Label>
                  <div className="mt-2 h-32 bg-muted rounded border relative overflow-hidden">
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom right, #10b98110, #193cb810)' }}></div>
                    {selectedReport.coordinates && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <MapPin className="h-6 w-6 text-red-600" />
                      </div>
                    )}
                    <div className="absolute bottom-1 right-1 text-xs text-muted-foreground bg-background/80 px-1 rounded">
                      Map View
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <Label>Description</Label>
                <p className="mt-2 text-sm bg-muted p-3 rounded">
                  {selectedReport.description}
                </p>
              </div>

              {selectedReport.affectedNotes ? (
                <div>
                  <Label>Affected areas / notes</Label>
                  <p className="mt-2 text-sm bg-muted p-3 rounded whitespace-pre-wrap">
                    {selectedReport.affectedNotes}
                  </p>
                </div>
              ) : null}

              {selectedReport.affectedRoutes.length > 0 && (
                <div>
                  <Label>Affected Routes</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedReport.affectedRoutes.map((route, index) => (
                      <Badge key={index} variant="secondary">
                        {route}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {(selectedReport.images?.length ?? 0) > 0 || (selectedReport.videos?.length ?? 0) > 0 ? (
                <div>
                  <Label>Attachments</Label>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {selectedReport.images?.length ?? 0} photo(s),{' '}
                    {selectedReport.videos?.length ?? 0} video(s) on file
                  </p>
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Priority Score</Label>
                  <div className="mt-2 text-2xl font-bold">
                    {selectedReport.priorityScore}/100
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-2">
                    <HazardStatusBadge status={selectedReport.status} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Reported By</Label>
                  <p className="mt-2 text-sm">{selectedReport.reportedBy}</p>
                </div>
                <div>
                  <Label>Reported At</Label>
                  <p className="mt-2 text-sm">{new Date(selectedReport.reportedAt).toLocaleString()}</p>
                </div>
              </div>

              {selectedReport.estimatedRepairCost && selectedReport.estimatedRepairCost > 0 && (
                <div>
                  <Label>Estimated Repair Cost</Label>
                  <p className="mt-2 text-sm">GH₵{selectedReport.estimatedRepairCost.toLocaleString()}</p>
                </div>
              )}

              {selectedReport.resolvedAt && (
                <div>
                  <Label>Resolved At</Label>
                  <p className="mt-2 text-sm">{new Date(selectedReport.resolvedAt).toLocaleString()}</p>
                </div>
              )}
            </DialogBody>
          ) : null}
          <DialogFooter className="bg-muted/20 shrink-0">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}