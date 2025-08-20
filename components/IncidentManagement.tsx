import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  MapPin, 
  Clock, 
  User, 
  Calendar,
  FileText,
  Phone,
  Mail,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Car,
  Shield,
  Navigation,
  RotateCcw,
  Globe,
  Activity,
  TrendingUp,
  Users,
  AlertOctagon
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { MapLocationPicker } from './MapLocationPicker';

interface Incident {
  id: string;
  title: string;
  description: string;
  type: 'accident' | 'breakdown' | 'theft' | 'violence' | 'medical' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'reported' | 'investigating' | 'resolved' | 'closed';
  reportedAt: string;
  reportedBy: string;
  location: string;
  coordinates?: { lat: number; lng: number; address?: string };
  vehicleRegNumber?: string;
  driverName?: string;
  passengersInvolved?: number;
  injuriesReported?: number;
  fatalitiesReported?: number;
  policeReportNumber?: string;
  assignedTo?: string;
  updatedAt: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  region: string;
  district: string;
  contactNumber?: string;
  contactEmail?: string;
  evidenceFiles?: string[];
  estimatedDamage?: number;
  insuranceClaimNumber?: string;
  weatherConditions?: string;
  roadConditions?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  witnesses?: string[];
  emergencyServices?: string[];
}

// Mock incident data with enhanced location information
const mockIncidents: Incident[] = [
  {
    id: 'INC-2024-001',
    title: 'Vehicle Collision on Tema-Accra Highway',
    description: 'Two vehicles collided during heavy rain. Minor injuries reported to 3 passengers.',
    type: 'accident',
    severity: 'medium',
    status: 'investigating',
    reportedAt: '2024-08-19T08:30:00Z',
    reportedBy: 'Driver - Kwame Asante',
    location: 'Tema-Accra Highway, KM 15',
    coordinates: { lat: 5.6200, lng: -0.1807, address: 'Tema-Accra Highway, KM 15, Near Ashaiman Junction' },
    vehicleRegNumber: 'GT-1234-24',
    driverName: 'Kwame Asante',
    passengersInvolved: 15,
    injuriesReported: 3,
    fatalitiesReported: 0,
    policeReportNumber: 'POL-2024-0819-001',
    assignedTo: 'Inspector Ama Owusu',
    updatedAt: '2024-08-19T10:15:00Z',
    priority: 'high',
    region: 'Greater Accra',
    district: 'Tema',
    contactNumber: '+233244123456',
    contactEmail: 'kwame.asante@station.com',
    estimatedDamage: 8500,
    weatherConditions: 'Heavy Rain',
    roadConditions: 'Wet and slippery',
    timeOfDay: 'morning',
    emergencyServices: ['Police', 'Ambulance']
  },
  {
    id: 'INC-2024-002',
    title: 'Passenger Medical Emergency',
    description: 'Elderly passenger collapsed during journey. Emergency services called.',
    type: 'medical',
    severity: 'high',
    status: 'resolved',
    reportedAt: '2024-08-18T14:20:00Z',
    reportedBy: 'Conductor - Yaw Boateng',
    location: 'Kejetia Station, Kumasi',
    coordinates: { lat: 6.6885, lng: -1.6244, address: 'Kejetia Transport Terminal, Central Kumasi' },
    vehicleRegNumber: 'AS-5678-24',
    driverName: 'Kofi Mensah',
    passengersInvolved: 1,
    injuriesReported: 0,
    fatalitiesReported: 0,
    assignedTo: 'Medic Team - Dr. Adjei',
    updatedAt: '2024-08-18T16:45:00Z',
    priority: 'urgent',
    region: 'Ashanti',
    district: 'Kumasi',
    contactNumber: '+233244654321',
    weatherConditions: 'Clear',
    timeOfDay: 'afternoon',
    emergencyServices: ['Ambulance', 'Medical Response Team']
  },
  {
    id: 'INC-2024-003',
    title: 'Vehicle Breakdown - Engine Failure',
    description: 'Bus broke down with engine failure. Passengers transferred safely.',
    type: 'breakdown',
    severity: 'low',
    status: 'resolved',
    reportedAt: '2024-08-17T11:00:00Z',
    reportedBy: 'Driver - Akosua Mensah',
    location: 'Cape Coast-Takoradi Road',
    coordinates: { lat: 5.0500, lng: -1.3000, address: 'Cape Coast-Takoradi Highway, Near Elmina Junction' },
    vehicleRegNumber: 'CR-9012-24',
    driverName: 'Akosua Mensah',
    passengersInvolved: 22,
    injuriesReported: 0,
    fatalitiesReported: 0,
    assignedTo: 'Mechanic - Ernest Adjei',
    updatedAt: '2024-08-17T15:30:00Z',
    priority: 'medium',
    region: 'Central',
    district: 'Cape Coast',
    contactNumber: '+233244789012',
    estimatedDamage: 2500,
    weatherConditions: 'Partly Cloudy',
    roadConditions: 'Good',
    timeOfDay: 'morning',
    emergencyServices: ['Towing Service']
  },
  {
    id: 'INC-2024-004',
    title: 'Theft Report - Passenger Belongings',
    description: 'Multiple passengers reported stolen phones and bags during journey.',
    type: 'theft',
    severity: 'medium',
    status: 'investigating',
    reportedAt: '2024-08-16T19:30:00Z',
    reportedBy: 'Station Manager - John Doe',
    location: 'Accra-Kumasi Highway, Ejisu',
    coordinates: { lat: 6.7500, lng: -1.3500, address: 'Accra-Kumasi Highway, Ejisu Junction' },
    vehicleRegNumber: 'GT-3456-24',
    driverName: 'Emmanuel Osei',
    passengersInvolved: 8,
    injuriesReported: 0,
    fatalitiesReported: 0,
    policeReportNumber: 'POL-2024-0816-003',
    assignedTo: 'Detective Sergeant Mensah',
    updatedAt: '2024-08-16T21:00:00Z',
    priority: 'medium',
    region: 'Ashanti',
    district: 'Ejisu',
    contactNumber: '+233244567890',
    weatherConditions: 'Clear',
    roadConditions: 'Good',
    timeOfDay: 'evening',
    emergencyServices: ['Police'],
    witnesses: ['Passenger - Mary Agyei', 'Conductor - Peter Antwi']
  },
  {
    id: 'INC-2024-005',
    title: 'Road Traffic Accident - Pedestrian',
    description: 'Pedestrian struck while crossing highway near bus stop. Critical condition.',
    type: 'accident',
    severity: 'critical',
    status: 'reported',
    reportedAt: '2024-08-19T15:45:00Z',
    reportedBy: 'Witness - Samuel Osei',
    location: 'Takoradi-Agona Road',
    coordinates: { lat: 4.9000, lng: -1.7500, address: 'Takoradi-Agona Road, Near Market Circle' },
    priority: 'urgent',
    region: 'Western',
    district: 'Takoradi',
    contactNumber: '+233244987654',
    injuriesReported: 1,
    fatalitiesReported: 0,
    weatherConditions: 'Light Rain',
    roadConditions: 'Poor visibility',
    timeOfDay: 'afternoon',
    emergencyServices: ['Police', 'Ambulance', 'Fire Service'],
    updatedAt: '2024-08-19T15:45:00Z'
  }
];

export function IncidentManagement() {
  const { user, hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showNewIncidentDialog, setShowNewIncidentDialog] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table');
  
  // New incident form state
  const [newIncident, setNewIncident] = useState({
    title: '',
    description: '',
    type: '',
    severity: '',
    location: '',
    vehicleRegNumber: '',
    driverName: '',
    passengersInvolved: '',
    injuriesReported: '',
    fatalitiesReported: '',
    contactNumber: '',
    contactEmail: '',
    weatherConditions: '',
    roadConditions: '',
    timeOfDay: '',
    emergencyServices: [] as string[]
  });

  // Filter incidents based on search and filters
  const filteredIncidents = mockIncidents.filter(incident => {
    const matchesSearch = incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.reportedBy.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || incident.type === filterType;
    const matchesStatus = filterStatus === 'all' || incident.status === filterStatus;
    const matchesSeverity = filterSeverity === 'all' || incident.severity === filterSeverity;
    
    return matchesSearch && matchesType && matchesStatus && matchesSeverity;
  });

  // Handle location selection for new incident
  const handleLocationSelect = (location: { lat: number; lng: number; address?: string }) => {
    setSelectedLocation(location);
    setNewIncident(prev => ({
      ...prev,
      location: location.address || `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
    }));
  };

  // Handle form submission
  const handleSubmitIncident = () => {
    if (!newIncident.title || !newIncident.description || !newIncident.type || !newIncident.severity) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!selectedLocation) {
      toast.error('Please select a location on the map');
      return;
    }

    // Generate new incident ID
    const newId = `INC-2024-${String(mockIncidents.length + 1).padStart(3, '0')}`;
    
    // Create new incident
    const incident: Incident = {
      id: newId,
      title: newIncident.title,
      description: newIncident.description,
      type: newIncident.type as any,
      severity: newIncident.severity as any,
      status: 'reported',
      reportedAt: new Date().toISOString(),
      reportedBy: `${user?.fullName} - ${user?.role}`,
      location: newIncident.location,
      coordinates: selectedLocation,
      vehicleRegNumber: newIncident.vehicleRegNumber || undefined,
      driverName: newIncident.driverName || undefined,
      passengersInvolved: newIncident.passengersInvolved ? parseInt(newIncident.passengersInvolved) : undefined,
      injuriesReported: newIncident.injuriesReported ? parseInt(newIncident.injuriesReported) : 0,
      fatalitiesReported: newIncident.fatalitiesReported ? parseInt(newIncident.fatalitiesReported) : 0,
      priority: newIncident.severity === 'critical' ? 'urgent' : newIncident.severity as any,
      region: user?.region || 'Unknown',
      district: user?.district || 'Unknown',
      contactNumber: newIncident.contactNumber || undefined,
      contactEmail: newIncident.contactEmail || undefined,
      weatherConditions: newIncident.weatherConditions || undefined,
      roadConditions: newIncident.roadConditions || undefined,
      timeOfDay: newIncident.timeOfDay as any || undefined,
      emergencyServices: newIncident.emergencyServices,
      updatedAt: new Date().toISOString()
    };

    // Add to mockIncidents (in real app, this would be an API call)
    mockIncidents.unshift(incident);
    
    // Reset form
    setNewIncident({
      title: '',
      description: '',
      type: '',
      severity: '',
      location: '',
      vehicleRegNumber: '',
      driverName: '',
      passengersInvolved: '',
      injuriesReported: '',
      fatalitiesReported: '',
      contactNumber: '',
      contactEmail: '',
      weatherConditions: '',
      roadConditions: '',
      timeOfDay: '',
      emergencyServices: []
    });
    setSelectedLocation(null);
    setShowNewIncidentDialog(false);
    
    toast.success(`Incident ${newId} reported successfully`);
  };

  // Get statistics
  const stats = {
    total: mockIncidents.length,
    reported: mockIncidents.filter(i => i.status === 'reported').length,
    investigating: mockIncidents.filter(i => i.status === 'investigating').length,
    resolved: mockIncidents.filter(i => i.status === 'resolved').length,
    critical: mockIncidents.filter(i => i.severity === 'critical').length,
    high: mockIncidents.filter(i => i.severity === 'high').length
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reported': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'investigating': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'accident': return <Car className="h-4 w-4" />;
      case 'breakdown': return <AlertTriangle className="h-4 w-4" />;
      case 'theft': return <Shield className="h-4 w-4" />;
      case 'violence': return <AlertCircle className="h-4 w-4" />;
      case 'medical': return <Plus className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 border-b">
        <div className="p-6 max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold">Incident Management System</h1>
                  <p className="text-muted-foreground">
                    Professional incident tracking and emergency response coordination
                  </p>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="flex items-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">{stats.total} Total Incidents</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertOctagon className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">{stats.critical} Critical</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">{stats.resolved} Resolved</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-white rounded-lg p-1 border">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Table
                </Button>
                <Button
                  variant={viewMode === 'map' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('map')}
                >
                  <Globe className="h-4 w-4 mr-1" />
                  Map
                </Button>
              </div>

              {hasPermission('manage_incidents') && (
                <Dialog open={showNewIncidentDialog} onOpenChange={setShowNewIncidentDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-red-600 hover:bg-red-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Report New Incident
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        Report New Incident
                      </DialogTitle>
                      <DialogDescription>
                        Submit a comprehensive incident report with precise location mapping for emergency response coordination
                      </DialogDescription>
                    </DialogHeader>
                    
                    <Tabs defaultValue="basic" className="space-y-4">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="basic">Basic Information</TabsTrigger>
                        <TabsTrigger value="location">Location & Map</TabsTrigger>
                        <TabsTrigger value="details">Additional Details</TabsTrigger>
                      </TabsList>

                      <TabsContent value="basic" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="incident-title">Incident Title *</Label>
                            <Input 
                              id="incident-title" 
                              placeholder="Brief description of incident"
                              value={newIncident.title}
                              onChange={(e) => setNewIncident(prev => ({ ...prev, title: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="incident-type">Incident Type *</Label>
                            <Select value={newIncident.type} onValueChange={(value) => setNewIncident(prev => ({ ...prev, type: value }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="accident">🚗 Traffic Accident</SelectItem>
                                <SelectItem value="breakdown">⚠️ Vehicle Breakdown</SelectItem>
                                <SelectItem value="theft">🔒 Theft/Robbery</SelectItem>
                                <SelectItem value="violence">⚡ Violence/Assault</SelectItem>
                                <SelectItem value="medical">🏥 Medical Emergency</SelectItem>
                                <SelectItem value="other">📋 Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="incident-description">Detailed Description *</Label>
                          <Textarea 
                            id="incident-description" 
                            placeholder="Provide detailed description of what happened, circumstances, and immediate actions taken..."
                            rows={4}
                            value={newIncident.description}
                            onChange={(e) => setNewIncident(prev => ({ ...prev, description: e.target.value }))}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="severity">Severity Level *</Label>
                            <Select value={newIncident.severity} onValueChange={(value) => setNewIncident(prev => ({ ...prev, severity: value }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select severity" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">🟢 Low - Minor issue</SelectItem>
                                <SelectItem value="medium">🟡 Medium - Moderate concern</SelectItem>
                                <SelectItem value="high">🟠 High - Serious situation</SelectItem>
                                <SelectItem value="critical">🔴 Critical - Life threatening</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="time-of-day">Time of Day</Label>
                            <Select value={newIncident.timeOfDay} onValueChange={(value) => setNewIncident(prev => ({ ...prev, timeOfDay: value }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select time period" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="morning">🌅 Morning (6AM - 12PM)</SelectItem>
                                <SelectItem value="afternoon">☀️ Afternoon (12PM - 6PM)</SelectItem>
                                <SelectItem value="evening">🌆 Evening (6PM - 9PM)</SelectItem>
                                <SelectItem value="night">🌙 Night (9PM - 6AM)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="location" className="space-y-4">
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="incident-location">Location Description</Label>
                            <Input 
                              id="incident-location" 
                              placeholder="e.g., Tema-Accra Highway, KM 15, Near Ashaiman Junction"
                              value={newIncident.location}
                              onChange={(e) => setNewIncident(prev => ({ ...prev, location: e.target.value }))}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              This will be auto-filled when you select a location on the map below
                            </p>
                          </div>
                          
                          <MapLocationPicker
                            onLocationSelect={handleLocationSelect}
                            initialLocation={selectedLocation || { lat: 5.5600, lng: -0.2057 }}
                          />
                          
                          {selectedLocation && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center gap-2 text-green-800">
                                <CheckCircle className="h-4 w-4" />
                                <span className="font-medium">Location Selected</span>
                              </div>
                              <p className="text-sm text-green-700 mt-1">
                                Coordinates: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                              </p>
                              {selectedLocation.address && (
                                <p className="text-sm text-green-700">
                                  Address: {selectedLocation.address}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="details" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="vehicle-reg">Vehicle Registration</Label>
                            <Input 
                              id="vehicle-reg" 
                              placeholder="GT-1234-24"
                              value={newIncident.vehicleRegNumber}
                              onChange={(e) => setNewIncident(prev => ({ ...prev, vehicleRegNumber: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="driver-name">Driver Name</Label>
                            <Input 
                              id="driver-name" 
                              placeholder="Driver's full name"
                              value={newIncident.driverName}
                              onChange={(e) => setNewIncident(prev => ({ ...prev, driverName: e.target.value }))}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="passengers-involved">Passengers Involved</Label>
                            <Input 
                              id="passengers-involved" 
                              type="number" 
                              placeholder="0"
                              value={newIncident.passengersInvolved}
                              onChange={(e) => setNewIncident(prev => ({ ...prev, passengersInvolved: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="injuries">Injuries Reported</Label>
                            <Input 
                              id="injuries" 
                              type="number" 
                              placeholder="0"
                              value={newIncident.injuriesReported}
                              onChange={(e) => setNewIncident(prev => ({ ...prev, injuriesReported: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="fatalities">Fatalities</Label>
                            <Input 
                              id="fatalities" 
                              type="number" 
                              placeholder="0"
                              value={newIncident.fatalitiesReported}
                              onChange={(e) => setNewIncident(prev => ({ ...prev, fatalitiesReported: e.target.value }))}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="contact-number">Contact Number</Label>
                            <Input 
                              id="contact-number" 
                              placeholder="+233 24 412 3456"
                              value={newIncident.contactNumber}
                              onChange={(e) => setNewIncident(prev => ({ ...prev, contactNumber: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="contact-email">Contact Email</Label>
                            <Input 
                              id="contact-email" 
                              type="email" 
                              placeholder="reporter@example.com"
                              value={newIncident.contactEmail}
                              onChange={(e) => setNewIncident(prev => ({ ...prev, contactEmail: e.target.value }))}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="weather-conditions">Weather Conditions</Label>
                            <Select value={newIncident.weatherConditions} onValueChange={(value) => setNewIncident(prev => ({ ...prev, weatherConditions: value }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select weather" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="clear">☀️ Clear/Sunny</SelectItem>
                                <SelectItem value="cloudy">☁️ Cloudy/Overcast</SelectItem>
                                <SelectItem value="light-rain">🌦️ Light Rain</SelectItem>
                                <SelectItem value="heavy-rain">🌧️ Heavy Rain</SelectItem>
                                <SelectItem value="fog">🌫️ Fog/Mist</SelectItem>
                                <SelectItem value="windy">💨 Windy</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="road-conditions">Road Conditions</Label>
                            <Select value={newIncident.roadConditions} onValueChange={(value) => setNewIncident(prev => ({ ...prev, roadConditions: value }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select road condition" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="good">✅ Good</SelectItem>
                                <SelectItem value="fair">⚠️ Fair</SelectItem>
                                <SelectItem value="poor">❌ Poor</SelectItem>
                                <SelectItem value="wet">💧 Wet/Slippery</SelectItem>
                                <SelectItem value="construction">🚧 Under Construction</SelectItem>
                                <SelectItem value="blocked">🚫 Blocked/Obstructed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>

                    <Separator />

                    <div className="flex justify-between items-center pt-4">
                      <div className="text-sm text-muted-foreground">
                        * Required fields must be completed before submission
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setShowNewIncidentDialog(false);
                            setSelectedLocation(null);
                            setNewIncident({
                              title: '',
                              description: '',
                              type: '',
                              severity: '',
                              location: '',
                              vehicleRegNumber: '',
                              driverName: '',
                              passengersInvolved: '',
                              injuriesReported: '',
                              fatalitiesReported: '',
                              contactNumber: '',
                              contactEmail: '',
                              weatherConditions: '',
                              roadConditions: '',
                              timeOfDay: '',
                              emergencyServices: []
                            });
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleSubmitIncident}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Submit Incident Report
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Statistics Dashboard */}
      <div className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total Incidents</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="text-2xl font-bold text-yellow-600">{stats.reported}</div>
                <div className="text-sm text-muted-foreground">Reported</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Search className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-blue-600">{stats.investigating}</div>
                <div className="text-sm text-muted-foreground">Investigating</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
                <div className="text-sm text-muted-foreground">Resolved</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <AlertOctagon className="h-5 w-5 text-red-600" />
                </div>
                <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
                <div className="text-sm text-muted-foreground">Critical</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <div className="text-2xl font-bold text-orange-600">{stats.high}</div>
                <div className="text-sm text-muted-foreground">High Priority</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Search and Filters */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search incidents by ID, title, location, or reporter..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="accident">🚗 Accident</SelectItem>
                    <SelectItem value="breakdown">⚠️ Breakdown</SelectItem>
                    <SelectItem value="theft">🔒 Theft</SelectItem>
                    <SelectItem value="violence">⚡ Violence</SelectItem>
                    <SelectItem value="medical">🏥 Medical</SelectItem>
                    <SelectItem value="other">📋 Other</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="reported">🟡 Reported</SelectItem>
                    <SelectItem value="investigating">🔵 Investigating</SelectItem>
                    <SelectItem value="resolved">🟢 Resolved</SelectItem>
                    <SelectItem value="closed">⚫ Closed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severity</SelectItem>
                    <SelectItem value="low">🟢 Low</SelectItem>
                    <SelectItem value="medium">🟡 Medium</SelectItem>
                    <SelectItem value="high">🟠 High</SelectItem>
                    <SelectItem value="critical">🔴 Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content - Table or Map View */}
        {viewMode === 'table' ? (
          <Card className="shadow-sm mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Incident Reports
                  </CardTitle>
                  <CardDescription>
                    Showing {filteredIncidents.length} of {mockIncidents.length} incidents
                  </CardDescription>
                </div>
                <Badge variant="outline" className="px-3 py-1">
                  {filteredIncidents.length} Results
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Incident ID</TableHead>
                      <TableHead>Title & Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Reported</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIncidents.map((incident) => (
                      <TableRow key={incident.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono text-sm font-medium">
                          <Badge variant="outline" className="font-mono">
                            {incident.id}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-sm">
                            <div className="font-medium text-sm mb-1">{incident.title}</div>
                            <div className="text-xs text-muted-foreground line-clamp-2">
                              {incident.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getTypeIcon(incident.type)}
                            <span className="capitalize text-sm">{incident.type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getSeverityColor(incident.severity)}>
                            {incident.severity.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(incident.status)}>
                            {incident.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-start space-x-1 max-w-xs">
                            <MapPin className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                              <div className="line-clamp-1">{incident.location}</div>
                              {incident.coordinates && (
                                <div className="text-xs text-muted-foreground">
                                  {incident.coordinates.lat.toFixed(4)}, {incident.coordinates.lng.toFixed(4)}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{formatDate(incident.reportedAt)}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-32">
                              {incident.reportedBy}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setSelectedIncident(incident)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                    Incident Details - {incident.id}
                                  </DialogTitle>
                                </DialogHeader>
                                {selectedIncident && (
                                  <Tabs defaultValue="overview" className="space-y-4">
                                    <TabsList className="grid w-full grid-cols-4">
                                      <TabsTrigger value="overview">Overview</TabsTrigger>
                                      <TabsTrigger value="location">Location & Map</TabsTrigger>
                                      <TabsTrigger value="details">Details</TabsTrigger>
                                      <TabsTrigger value="response">Response</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="overview" className="space-y-6">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                          <div>
                                            <Label className="text-sm font-medium">Title</Label>
                                            <p className="mt-1 font-medium">{selectedIncident.title}</p>
                                          </div>
                                          <div>
                                            <Label className="text-sm font-medium">Description</Label>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                              {selectedIncident.description}
                                            </p>
                                          </div>
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <Label className="text-sm font-medium">Type</Label>
                                              <div className="flex items-center gap-2 mt-1">
                                                {getTypeIcon(selectedIncident.type)}
                                                <span className="capitalize">{selectedIncident.type}</span>
                                              </div>
                                            </div>
                                            <div>
                                              <Label className="text-sm font-medium">Severity</Label>
                                              <div className="mt-1">
                                                <Badge variant="outline" className={getSeverityColor(selectedIncident.severity)}>
                                                  {selectedIncident.severity.toUpperCase()}
                                                </Badge>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        <div className="space-y-4">
                                          <div>
                                            <Label className="text-sm font-medium">Location</Label>
                                            <p className="mt-1">{selectedIncident.location}</p>
                                          </div>
                                          <div>
                                            <Label className="text-sm font-medium">Region & District</Label>
                                            <p className="mt-1">{selectedIncident.region} - {selectedIncident.district}</p>
                                          </div>
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <Label className="text-sm font-medium">Reported</Label>
                                              <p className="mt-1 text-sm">{formatDate(selectedIncident.reportedAt)}</p>
                                            </div>
                                            <div>
                                              <Label className="text-sm font-medium">Status</Label>
                                              <div className="mt-1">
                                                <Badge variant="outline" className={getStatusColor(selectedIncident.status)}>
                                                  {selectedIncident.status.replace('_', ' ').toUpperCase()}
                                                </Badge>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {selectedIncident.vehicleRegNumber && (
                                        <div className="border-t pt-4">
                                          <h4 className="font-medium mb-3 flex items-center gap-2">
                                            <Car className="h-4 w-4" />
                                            Vehicle Information
                                          </h4>
                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                              <Label className="text-sm font-medium">Registration</Label>
                                              <p className="mt-1 font-mono bg-muted px-2 py-1 rounded">
                                                {selectedIncident.vehicleRegNumber}
                                              </p>
                                            </div>
                                            <div>
                                              <Label className="text-sm font-medium">Driver</Label>
                                              <p className="mt-1">{selectedIncident.driverName}</p>
                                            </div>
                                            <div>
                                              <Label className="text-sm font-medium">Passengers</Label>
                                              <p className="mt-1">{selectedIncident.passengersInvolved}</p>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                      
                                      <div className="border-t pt-4">
                                        <h4 className="font-medium mb-3 flex items-center gap-2">
                                          <Users className="h-4 w-4" />
                                          Impact Assessment
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                          <div>
                                            <Label className="text-sm font-medium">Injuries</Label>
                                            <p className="mt-1 text-lg font-bold text-orange-600">
                                              {selectedIncident.injuriesReported || 0}
                                            </p>
                                          </div>
                                          <div>
                                            <Label className="text-sm font-medium">Fatalities</Label>
                                            <p className="mt-1 text-lg font-bold text-red-600">
                                              {selectedIncident.fatalitiesReported || 0}
                                            </p>
                                          </div>
                                          <div>
                                            <Label className="text-sm font-medium">Est. Damage</Label>
                                            <p className="mt-1 text-lg font-bold text-blue-600">
                                              {selectedIncident.estimatedDamage 
                                                ? `GHS ${selectedIncident.estimatedDamage.toLocaleString()}`
                                                : 'N/A'
                                              }
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </TabsContent>

                                    <TabsContent value="location" className="space-y-4">
                                      <div className="space-y-4">
                                        <div>
                                          <Label className="text-sm font-medium">Incident Location</Label>
                                          <p className="mt-1 text-lg">{selectedIncident.location}</p>
                                          {selectedIncident.coordinates && (
                                            <p className="text-sm text-muted-foreground">
                                              Coordinates: {selectedIncident.coordinates.lat.toFixed(6)}, {selectedIncident.coordinates.lng.toFixed(6)}
                                            </p>
                                          )}
                                        </div>
                                        
                                        {selectedIncident.coordinates && (
                                          <div className="relative w-full h-96 bg-muted rounded-lg border overflow-hidden">
                                            {/* Map visualization */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-blue-100">
                                              {/* Ghana map background */}
                                              <div 
                                                className="absolute inset-0"
                                                style={{
                                                  backgroundImage: `
                                                    radial-gradient(circle at 20% 80%, rgba(34, 197, 94, 0.2) 0%, transparent 50%),
                                                    radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.2) 0%, transparent 50%)
                                                  `
                                                }}
                                              />
                                              
                                              {/* Grid */}
                                              <div className="absolute inset-0 opacity-10">
                                                {[...Array(8)].map((_, i) => (
                                                  <div
                                                    key={`h-${i}`}
                                                    className="absolute w-full h-px bg-gray-400"
                                                    style={{ top: `${(i + 1) * 12.5}%` }}
                                                  />
                                                ))}
                                                {[...Array(10)].map((_, i) => (
                                                  <div
                                                    key={`v-${i}`}
                                                    className="absolute h-full w-px bg-gray-400"
                                                    style={{ left: `${(i + 1) * 10}%` }}
                                                  />
                                                ))}
                                              </div>
                                              
                                              {/* Incident marker */}
                                              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                                <div className="relative">
                                                  <MapPin className="h-8 w-8 text-red-600 drop-shadow-lg" />
                                                  <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-red-600 text-white text-xs px-3 py-1 rounded shadow-lg whitespace-nowrap">
                                                    Incident Location
                                                  </div>
                                                </div>
                                                
                                                {/* Severity indicator */}
                                                <div className="absolute -top-2 -right-2">
                                                  <div className={`h-4 w-4 rounded-full ${
                                                    selectedIncident.severity === 'critical' ? 'bg-red-500' :
                                                    selectedIncident.severity === 'high' ? 'bg-orange-500' :
                                                    selectedIncident.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                                  } animate-pulse`} />
                                                </div>
                                              </div>
                                              
                                              {/* Map info */}
                                              <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded text-xs">
                                                Ghana Map View
                                              </div>
                                              <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-xs">
                                                {selectedIncident.severity.toUpperCase()} Severity
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                        
                                        {selectedIncident.coordinates?.address && (
                                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                            <Label className="text-sm font-medium">Detailed Address</Label>
                                            <p className="mt-1 text-sm">{selectedIncident.coordinates.address}</p>
                                          </div>
                                        )}
                                      </div>
                                    </TabsContent>

                                    <TabsContent value="details" className="space-y-4">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                          <h4 className="font-medium">Environmental Conditions</h4>
                                          <div className="space-y-3">
                                            {selectedIncident.weatherConditions && (
                                              <div>
                                                <Label className="text-sm font-medium">Weather</Label>
                                                <p className="mt-1">{selectedIncident.weatherConditions}</p>
                                              </div>
                                            )}
                                            {selectedIncident.roadConditions && (
                                              <div>
                                                <Label className="text-sm font-medium">Road Conditions</Label>
                                                <p className="mt-1">{selectedIncident.roadConditions}</p>
                                              </div>
                                            )}
                                            {selectedIncident.timeOfDay && (
                                              <div>
                                                <Label className="text-sm font-medium">Time of Day</Label>
                                                <p className="mt-1 capitalize">{selectedIncident.timeOfDay}</p>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        
                                        <div className="space-y-4">
                                          <h4 className="font-medium">Contact Information</h4>
                                          <div className="space-y-3">
                                            <div>
                                              <Label className="text-sm font-medium">Reported By</Label>
                                              <p className="mt-1">{selectedIncident.reportedBy}</p>
                                            </div>
                                            {selectedIncident.contactNumber && (
                                              <div>
                                                <Label className="text-sm font-medium">Contact Number</Label>
                                                <p className="mt-1 font-mono">{selectedIncident.contactNumber}</p>
                                              </div>
                                            )}
                                            {selectedIncident.contactEmail && (
                                              <div>
                                                <Label className="text-sm font-medium">Contact Email</Label>
                                                <p className="mt-1">{selectedIncident.contactEmail}</p>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </TabsContent>

                                    <TabsContent value="response" className="space-y-4">
                                      <div className="space-y-6">
                                        {selectedIncident.emergencyServices && selectedIncident.emergencyServices.length > 0 && (
                                          <div>
                                            <h4 className="font-medium mb-3">Emergency Services Contacted</h4>
                                            <div className="flex flex-wrap gap-2">
                                              {selectedIncident.emergencyServices.map((service, index) => (
                                                <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                  {service}
                                                </Badge>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        
                                        {selectedIncident.assignedTo && (
                                          <div>
                                            <Label className="text-sm font-medium">Assigned To</Label>
                                            <p className="mt-1">{selectedIncident.assignedTo}</p>
                                          </div>
                                        )}
                                        
                                        {selectedIncident.policeReportNumber && (
                                          <div>
                                            <Label className="text-sm font-medium">Police Report Number</Label>
                                            <p className="mt-1 font-mono bg-muted px-2 py-1 rounded">
                                              {selectedIncident.policeReportNumber}
                                            </p>
                                          </div>
                                        )}
                                        
                                        <div>
                                          <Label className="text-sm font-medium">Last Updated</Label>
                                          <p className="mt-1 text-sm">{formatDate(selectedIncident.updatedAt)}</p>
                                        </div>
                                      </div>
                                    </TabsContent>
                                  </Tabs>
                                )}
                              </DialogContent>
                            </Dialog>
                            {hasPermission('manage_incidents') && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Map View */
          <Card className="shadow-sm mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-600" />
                    Incident Map View
                  </CardTitle>
                  <CardDescription>
                    Interactive map showing {filteredIncidents.filter(i => i.coordinates).length} incidents with location data
                  </CardDescription>
                </div>
                <Badge variant="outline" className="px-3 py-1">
                  {filteredIncidents.filter(i => i.coordinates).length} Mapped
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative w-full h-[600px] bg-muted rounded-lg border overflow-hidden">
                {/* Ghana map background */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-blue-100">
                  <div 
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `
                        radial-gradient(circle at 20% 80%, rgba(34, 197, 94, 0.2) 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.2) 0%, transparent 50%),
                        linear-gradient(45deg, rgba(34, 197, 94, 0.05) 25%, transparent 25%),
                        linear-gradient(-45deg, rgba(59, 130, 246, 0.05) 25%, transparent 25%)
                      `,
                      backgroundSize: '40px 40px, 40px 40px, 20px 20px, 20px 20px'
                    }}
                  />
                </div>

                {/* Grid lines */}
                <div className="absolute inset-0 opacity-10">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={`h-${i}`}
                      className="absolute w-full h-px bg-gray-400"
                      style={{ top: `${(i + 1) * 8.33}%` }}
                    />
                  ))}
                  {[...Array(15)].map((_, i) => (
                    <div
                      key={`v-${i}`}
                      className="absolute h-full w-px bg-gray-400"
                      style={{ left: `${(i + 1) * 6.67}%` }}
                    />
                  ))}
                </div>

                {/* Map info */}
                <div className="absolute top-4 left-4 bg-white/90 px-3 py-2 rounded shadow">
                  <h3 className="font-medium text-sm">Ghana Incident Map</h3>
                  <p className="text-xs text-muted-foreground">
                    Real-time incident locations and severity levels
                  </p>
                </div>

                {/* Legend */}
                <div className="absolute top-4 right-4 bg-white/90 px-3 py-2 rounded shadow">
                  <h4 className="font-medium text-sm mb-2">Severity Levels</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Low</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span>Medium</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span>High</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <span>Critical</span>
                    </div>
                  </div>
                </div>

                {/* Ghana bounds for positioning */}
                {(() => {
                  const ghanaBounds = {
                    north: 11.2,
                    south: 4.5,
                    east: 1.3,
                    west: -3.5
                  };

                  return filteredIncidents
                    .filter(incident => incident.coordinates)
                    .map((incident) => {
                      const coords = incident.coordinates!;
                      const x = ((coords.lng - ghanaBounds.west) / (ghanaBounds.east - ghanaBounds.west)) * 100;
                      const y = ((ghanaBounds.north - coords.lat) / (ghanaBounds.north - ghanaBounds.south)) * 100;
                      
                      const severityColor = 
                        incident.severity === 'critical' ? 'bg-red-500' :
                        incident.severity === 'high' ? 'bg-orange-500' :
                        incident.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500';
                      
                      return (
                        <div
                          key={incident.id}
                          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer group"
                          style={{ left: `${x}%`, top: `${y}%` }}
                          onClick={() => setSelectedIncident(incident)}
                        >
                          <div className={`w-4 h-4 ${severityColor} rounded-full ${incident.severity === 'critical' ? 'animate-pulse' : ''} border-2 border-white shadow-lg`} />
                          
                          {/* Tooltip */}
                          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                            <div className="font-medium">{incident.id}</div>
                            <div className="max-w-32 truncate">{incident.title}</div>
                            <div>{incident.severity.toUpperCase()}</div>
                          </div>
                        </div>
                      );
                    });
                })()}

                {/* No incidents overlay */}
                {filteredIncidents.filter(i => i.coordinates).length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/90 p-6 rounded-lg border text-center">
                      <MapPin className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                      <h3 className="font-medium mb-1">No Mapped Incidents</h3>
                      <p className="text-sm text-muted-foreground">
                        No incidents with location data match your current filters
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}