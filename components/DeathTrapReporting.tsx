import React, { useCallback, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Plus, MapPin, AlertTriangle, Clock, CheckCircle, Eye, Wrench } from 'lucide-react';
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

  const statusOptions = [
    { value: 'reported', label: 'Reported', color: '#193cb8' },
    { value: 'acknowledged', label: 'Acknowledged', color: 'yellow' },
    { value: 'in_progress', label: 'In Progress', color: 'orange' },
    { value: 'resolved', label: 'Resolved', color: 'green' },
    { value: 'escalated', label: 'Escalated', color: 'red' }
  ];

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

  const handleAdd = async () => {
    if (!formData.location || !formData.description) {
      notify.error('Please fill in all required fields');
      return;
    }

    if (formData.coordinates.lat === 0 && formData.coordinates.lng === 0) {
      notify.error('Please select a location on the map');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        type: formData.type,
        location: formData.location,
        description: formData.description,
        severityLevel: formData.severityLevel,
        affectedRoutes: formData.affectedRoutes,
        estimatedRepairCost: formData.estimatedRepairCost,
        coordinates: formData.coordinates,
      };

      const response = await deathTrapApi.create(payload);

      if (response.success) {
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

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      low: '#22c55e',
      medium: '#eab308',
      high: '#f97316',
      critical: '#ef4444',
    };
    return colors[severity] || 'gray';
  };

  const getStatusColor = (status: string) => {
    const statusObj = statusOptions.find(s => s.value === status);
    return statusObj?.color || 'gray';
  };

  const getTypeLabel = (type: string) => {
    const typeObj = HAZARD_TYPE_OPTIONS.find((t) => t.value === type);
    return typeObj?.label || type;
  };

  const totalReports = reports.length;
  const criticalReports = reports.filter(r => r.severityLevel === 'critical').length;
  const pendingReports = reports.filter(r => ['reported', 'acknowledged'].includes(r.status)).length;
  const resolvedReports = reports.filter(r => r.status === 'resolved').length;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#193cb8]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex flex-col items-center justify-center py-24 text-center">
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1>Death Trap Reporting</h1>
          <p className="text-muted-foreground">
            Report and manage road hazards and safety threats
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="bg-[#193cb8] hover:bg-[#152f94]">
          <Plus className="h-4 w-4 mr-2" />
          Report Hazard
        </Button>
      </div>

      <ReportHazardDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        form={formData}
        isLocationFromMap={isLocationFromMap}
        priorityScore={priorityScore}
        onFormChange={handleFormChange}
        onLocationSelect={handleLocationSelect}
        onResetLocation={handleResetLocation}
        onSubmit={handleAdd}
        onCancel={() => {
          setIsAddDialogOpen(false);
          resetForm();
        }}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Total Reports</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReports}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Critical Hazards</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{criticalReports}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Pending Action</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReports}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolvedReports}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <Input
          placeholder="Search reports..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {HAZARD_TYPE_OPTIONS.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            {SEVERITY_OPTIONS.map((level) => (
              <SelectItem key={level.value} value={level.value}>
                {level.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Hazard Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reported</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.id}</TableCell>
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
                    <Badge 
                      variant="outline" 
                      style={{ color: getSeverityColor(report.severityLevel) }}
                    >
                      {report.severityLevel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                        {report.priorityScore}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      style={{ color: getStatusColor(report.status) }}
                    >
                      {report.status.replace('_', ' ')}
                    </Badge>
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
                              className="text-yellow-600"
                            >
                              <Clock className="h-4 w-4" />
                            </Button>
                          )}
                          {report.status === 'acknowledged' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusUpdate(report.id, 'in_progress')}
                              className="text-orange-600"
                            >
                              <Wrench className="h-4 w-4" />
                            </Button>
                          )}
                          {report.status === 'in_progress' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusUpdate(report.id, 'resolved')}
                              className="text-green-600"
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
          <TablePagination
            page={page}
            pagination={pagination}
            onPageChange={setPage}
            loading={loading}
            itemLabel="reports"
          />
        </CardContent>
      </Card>

      {/* View Report Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Hazard Report Details - {selectedReport?.id}</DialogTitle>
            <DialogDescription>
              View detailed information about this death trap / road hazard report including location, severity, and current status.
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
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
                    <Badge 
                      variant="outline" 
                      style={{ color: getSeverityColor(selectedReport.severityLevel) }}
                    >
                      {selectedReport.severityLevel}
                    </Badge>
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
                    <Badge 
                      variant="outline" 
                      style={{ color: getStatusColor(selectedReport.status) }}
                    >
                      {selectedReport.status.replace('_', ' ')}
                    </Badge>
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
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}