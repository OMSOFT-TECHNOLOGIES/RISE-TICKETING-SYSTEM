import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Plus, MapPin, AlertTriangle, Clock, CheckCircle, Eye, Camera, Wrench, RotateCcw } from 'lucide-react';
import { mockDeathTraps, DeathTrapReport } from './constants/mockData';
import { MapLocationPicker } from './MapLocationPicker';
import { toast } from 'sonner';

export function DeathTrapReporting() {
  const [reports, setReports] = useState<DeathTrapReport[]>(mockDeathTraps);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<DeathTrapReport | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [isLocationFromMap, setIsLocationFromMap] = useState(false);

  const [formData, setFormData] = useState({
    type: 'fatal_pothole' as DeathTrapReport['type'],
    location: '',
    description: '',
    severityLevel: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    affectedRoutes: [] as string[],
    estimatedRepairCost: 0,
    coordinates: { lat: 0, lng: 0 },
    locationAddress: ''
  });

  const deathTrapTypes = [
    { value: 'faulty_vehicle', label: 'Faulty Vehicle', icon: '🚗' },
    { value: 'broken_down_vehicle', label: 'Broken Down Vehicle', icon: '🚙' },
    { value: 'fatal_pothole', label: 'Fatal Pothole', icon: '🕳️' },
    { value: 'faulty_bridge', label: 'Faulty Bridge', icon: '🌉' },
    { value: 'material_roadside', label: 'Material Along Roadside', icon: '🪨' },
    { value: 'no_caution_sign', label: 'No Caution Sign', icon: '⚠️' },
    { value: 'zebra_crossing_faded', label: 'Zebra Crossing Faded', icon: '🦓' },
    { value: 'faulty_streetlight', label: 'Faulty Streetlight', icon: '💡' }
  ];

  const severityLevels = [
    { value: 'low', label: 'Low', color: 'green', description: 'Minor hazard, low risk' },
    { value: 'medium', label: 'Medium', color: 'yellow', description: 'Moderate hazard, caution needed' },
    { value: 'high', label: 'High', color: 'orange', description: 'Significant hazard, immediate attention needed' },
    { value: 'critical', label: 'Critical', color: 'red', description: 'Extreme hazard, urgent action required' }
  ];

  const statusOptions = [
    { value: 'reported', label: 'Reported', color: 'blue' },
    { value: 'acknowledged', label: 'Acknowledged', color: 'yellow' },
    { value: 'in_progress', label: 'In Progress', color: 'orange' },
    { value: 'resolved', label: 'Resolved', color: 'green' },
    { value: 'escalated', label: 'Escalated', color: 'red' }
  ];

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.affectedRoutes.some(route => route.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = typeFilter === 'all' || report.type === typeFilter;
    const matchesSeverity = severityFilter === 'all' || report.severityLevel === severityFilter;
    
    return matchesSearch && matchesType && matchesSeverity;
  });

  const resetForm = () => {
    setFormData({
      type: 'fatal_pothole',
      location: '',
      description: '',
      severityLevel: 'medium',
      affectedRoutes: [],
      estimatedRepairCost: 0,
      coordinates: { lat: 0, lng: 0 },
      locationAddress: ''
    });
    setIsLocationFromMap(false);
  };

  const calculatePriorityScore = (severity: string, routeCount: number): number => {
    const severityScore = {
      low: 25,
      medium: 50,
      high: 75,
      critical: 100
    }[severity] || 50;

    const routeMultiplier = Math.min(routeCount * 10, 30);
    return Math.min(severityScore + routeMultiplier, 100);
  };

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
    
    setFormData({
      ...formData,
      coordinates: { lat: location.lat, lng: location.lng },
      locationAddress: location.address || '',
      location: formattedLocation // Always update the location field with selected location
    });
    
    setIsLocationFromMap(true);
    toast.success('Location selected and description updated');
  };

  const handleLocationInputChange = (value: string) => {
    setFormData({ ...formData, location: value });
    // If user manually edits the location, it's no longer purely from map
    if (isLocationFromMap && value !== formData.location) {
      setIsLocationFromMap(false);
    }
  };

  const handleResetLocation = () => {
    setFormData({
      ...formData,
      location: '',
      coordinates: { lat: 0, lng: 0 },
      locationAddress: ''
    });
    setIsLocationFromMap(false);
    toast.info('Location cleared');
  };

  const handleAdd = () => {
    if (!formData.location || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.coordinates.lat === 0 && formData.coordinates.lng === 0) {
      toast.error('Please select a location on the map');
      return;
    }

    const priorityScore = calculatePriorityScore(formData.severityLevel, formData.affectedRoutes.length);

    const newReport: DeathTrapReport = {
      id: `DT${String(reports.length + 1).padStart(3, '0')}`,
      type: formData.type,
      location: formData.location,
      description: formData.description,
      severityLevel: formData.severityLevel,
      affectedRoutes: formData.affectedRoutes,
      estimatedRepairCost: formData.estimatedRepairCost,
      coordinates: formData.coordinates,
      reportedBy: 'current_user',
      reportedAt: new Date().toISOString(),
      status: 'reported',
      priorityScore
    };

    setReports([...reports, newReport]);
    toast.success('Death trap report submitted successfully');
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleStatusUpdate = (reportId: string, newStatus: DeathTrapReport['status']) => {
    const updatedReports = reports.map(report => {
      if (report.id === reportId) {
        const updates: Partial<DeathTrapReport> = { status: newStatus };
        
        if (newStatus === 'resolved') {
          updates.resolvedAt = new Date().toISOString();
        }
        
        return { ...report, ...updates };
      }
      return report;
    });

    setReports(updatedReports);
    toast.success(`Report status updated to ${newStatus}`);
  };

  const getSeverityColor = (severity: string) => {
    const level = severityLevels.find(s => s.value === severity);
    return level?.color || 'gray';
  };

  const getStatusColor = (status: string) => {
    const statusObj = statusOptions.find(s => s.value === status);
    return statusObj?.color || 'gray';
  };

  const getTypeLabel = (type: string) => {
    const typeObj = deathTrapTypes.find(t => t.value === type);
    return typeObj?.label || type;
  };

  const totalReports = reports.length;
  const criticalReports = reports.filter(r => r.severityLevel === 'critical').length;
  const pendingReports = reports.filter(r => ['reported', 'acknowledged'].includes(r.status)).length;
  const resolvedReports = reports.filter(r => r.status === 'resolved').length;

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
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Report Hazard
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Report Death Trap / Road Hazard</DialogTitle>
              <DialogDescription>
                Submit a new death trap or road hazard report. Fill in all required information and select the exact location on the map where the hazard is located.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Form Fields */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Form Fields */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Hazard Type *</Label>
                      <Select value={formData.type} onValueChange={(value: DeathTrapReport['type']) => setFormData({ ...formData, type: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {deathTrapTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              <span className="flex items-center">
                                <span className="mr-2">{type.icon}</span>
                                {type.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="severity">Severity Level *</Label>
                      <Select value={formData.severityLevel} onValueChange={(value: 'low' | 'medium' | 'high' | 'critical') => setFormData({ ...formData, severityLevel: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {severityLevels.map(level => (
                            <SelectItem key={level.value} value={level.value}>
                              <div className="flex flex-col">
                                <span className="font-medium" style={{ color: level.color }}>
                                  {level.label}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {level.description}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="location">Location Description *</Label>
                      {formData.location && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleResetLocation}
                          className="h-6 px-2 text-xs"
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Clear
                        </Button>
                      )}
                    </div>
                    <div className="relative">
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => handleLocationInputChange(e.target.value)}
                        placeholder="Select a location on the map or enter manually"
                        className={isLocationFromMap ? 'bg-green-50 border-green-200' : ''}
                      />
                      {isLocationFromMap && (
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                          <MapPin className="h-4 w-4 text-green-600" />
                        </div>
                      )}
                    </div>
                    {isLocationFromMap && (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Auto-filled from map selection
                      </p>
                    )}
                    {formData.locationAddress && formData.locationAddress !== formData.location && (
                      <p className="text-sm text-muted-foreground">
                        📍 Detected address: {formData.locationAddress}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Detailed description of the hazard, its impact, and any immediate dangers..."
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="affectedRoutes">Affected Routes</Label>
                    <Input
                      id="affectedRoutes"
                      value={formData.affectedRoutes.join(', ')}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        affectedRoutes: e.target.value.split(',').map(route => route.trim()).filter(Boolean)
                      })}
                      placeholder="Enter routes separated by commas (e.g., Accra-Kumasi, Tema-Kumasi)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estimatedCost">Estimated Repair Cost (GH₵)</Label>
                    <Input
                      id="estimatedCost"
                      type="number"
                      value={formData.estimatedRepairCost}
                      onChange={(e) => setFormData({ ...formData, estimatedRepairCost: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>

                  <div className="bg-muted p-4 rounded space-y-2">
                    <h4 className="font-medium">Priority Score Preview:</h4>
                    <div className="text-2xl font-bold">
                      {calculatePriorityScore(formData.severityLevel, formData.affectedRoutes.length)}/100
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Based on severity level and number of affected routes
                    </p>
                  </div>
                </div>

                {/* Right Column - Map */}
                <div className="space-y-4">
                  <MapLocationPicker
                    onLocationSelect={handleLocationSelect}
                    initialLocation={{ lat: 5.5600, lng: -0.2057 }}
                  />
                  
                  {/* Coordinates Display */}
                  {(formData.coordinates.lat !== 0 || formData.coordinates.lng !== 0) && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium">Location Selected</span>
                      </div>
                      <div className="mt-1 text-sm text-green-600">
                        Coordinates: {formData.coordinates.lat.toFixed(6)}, {formData.coordinates.lng.toFixed(6)}
                      </div>
                      {isLocationFromMap && (
                        <div className="mt-1 text-xs text-green-600">
                          Location description has been automatically updated
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Location Help */}
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-800 text-sm">Location Selection Tips:</h4>
                    <ul className="mt-1 text-xs text-blue-700 space-y-1">
                      <li>• Click anywhere on the map to select the exact location</li>
                      <li>• The location description will be automatically filled</li>
                      <li>• You can edit the description after selection if needed</li>
                      <li>• Use quick location buttons for major cities</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdd}>
                Submit Report
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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
            {deathTrapTypes.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.icon} {type.label}
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
            {severityLevels.map(level => (
              <SelectItem key={level.value} value={level.value}>
                <span style={{ color: level.color }}>{level.label}</span>
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
              {filteredReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span className="mr-2">
                        {deathTrapTypes.find(t => t.value === report.type)?.icon}
                      </span>
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
                  <div className="mt-2 flex items-center">
                    <span className="mr-2">
                      {deathTrapTypes.find(t => t.value === selectedReport.type)?.icon}
                    </span>
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
                    <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-blue-100"></div>
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