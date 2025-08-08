import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { useAuth } from './AuthContext';
import { 
  AlertTriangle,
  Calendar,
  Clock,
  MapPin,
  Users,
  TrendingUp,
  TrendingDown,
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  Plus,
  BarChart3,
  PieChart,
  Activity,
  Car,
  Phone,
  AlertCircle
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts';
import { toast } from 'sonner';

// Mock accident data
const mockAccidents = [
  {
    id: 'ACC001',
    tripId: 'TRP001',
    date: '2024-01-15T14:30:00',
    location: 'Accra-Kumasi Highway, km 85',
    severity: 'minor',
    vehicleId: 'GV-123-20',
    driverId: 'DRV001',
    driverName: 'Kwame Asante',
    route: 'Accra Central → Kumasi Main',
    passengersAboard: 45,
    injuries: 2,
    fatalities: 0,
    description: 'Minor collision with private vehicle during lane change. Two passengers sustained minor injuries.',
    cause: 'driver_error',
    weatherConditions: 'clear',
    roadConditions: 'good',
    timeOfDay: 'afternoon',
    reportedBy: 'John Worker',
    stationId: 'STA001',
    status: 'investigated',
    insuranceClaim: 'approved',
    cost: 2500
  },
  {
    id: 'ACC002',
    tripId: 'TRP003',
    date: '2024-01-10T09:15:00',
    location: 'Cape Coast-Accra Road, near Kasoa',
    severity: 'major',
    vehicleId: 'GV-456-21',
    driverId: 'DRV002',
    driverName: 'Ama Osei',
    route: 'Cape Coast → Accra Central',
    passengersAboard: 32,
    injuries: 8,
    fatalities: 0,
    description: 'Bus skidded off road during heavy rainfall. Multiple passengers injured, vehicle damaged.',
    cause: 'weather',
    weatherConditions: 'heavy_rain',
    roadConditions: 'poor',
    timeOfDay: 'morning',
    reportedBy: 'Jane Admin',
    stationId: 'STA003',
    status: 'pending',
    insuranceClaim: 'processing',
    cost: 15000
  },
  {
    id: 'ACC003',
    tripId: 'TRP005',
    date: '2024-01-08T20:45:00',
    location: 'Tamale-Kumasi Highway, km 120',
    severity: 'critical',
    vehicleId: 'KU-789-19',
    driverId: 'DRV003',
    driverName: 'Kofi Mensah',
    route: 'Tamale → Kumasi Main',
    passengersAboard: 40,
    injuries: 12,
    fatalities: 1,
    description: 'Head-on collision with truck. Critical incident with one fatality and multiple serious injuries.',
    cause: 'mechanical_failure',
    weatherConditions: 'clear',
    roadConditions: 'fair',
    timeOfDay: 'night',
    reportedBy: 'Admin User',
    stationId: 'STA002',
    status: 'under_investigation',
    insuranceClaim: 'pending',
    cost: 85000
  }
];

// Analytics data
const accidentTrendsData = [
  { month: 'Jul', accidents: 3, injuries: 8, cost: 12000 },
  { month: 'Aug', accidents: 5, injuries: 15, cost: 28000 },
  { month: 'Sep', accidents: 2, injuries: 4, cost: 8500 },
  { month: 'Oct', accidents: 4, injuries: 12, cost: 22000 },
  { month: 'Nov', accidents: 1, injuries: 2, cost: 3500 },
  { month: 'Dec', accidents: 6, injuries: 18, cost: 45000 },
  { month: 'Jan', accidents: 3, injuries: 22, cost: 102500 }
];

const severityDistribution = [
  { severity: 'Minor', count: 12, percentage: 60, color: '#22c55e' },
  { severity: 'Major', count: 6, percentage: 30, color: '#f59e0b' },
  { severity: 'Critical', count: 2, percentage: 10, color: '#ef4444' }
];

const causeAnalysis = [
  { cause: 'Driver Error', count: 8, color: '#ef4444' },
  { cause: 'Weather', count: 5, color: '#3b82f6' },
  { cause: 'Mechanical', count: 4, color: '#f59e0b' },
  { cause: 'Road Conditions', count: 2, color: '#8b5cf6' },
  { cause: 'Other Vehicle', count: 1, color: '#06b6d4' }
];

export function AccidentAnalysis() {
  const { user } = useAuth();
  const [accidents] = useState(mockAccidents);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAccident, setSelectedAccident] = useState<any>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [newAccidentReport, setNewAccidentReport] = useState({
    tripId: '',
    location: '',
    severity: '',
    description: '',
    injuries: '',
    fatalities: '',
    cause: '',
    weatherConditions: '',
    roadConditions: ''
  });

  // Access control
  if (user?.role !== 'admin') {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
        <h2 className="text-2xl font-bold text-gray-600 mb-2">Access Restricted</h2>
        <p className="text-gray-500">Only administrators can access accident analysis.</p>
      </div>
    );
  }

  // Filter accidents
  const filteredAccidents = accidents.filter(accident => {
    const matchesSearch = searchTerm === '' || 
      accident.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      accident.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      accident.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      accident.route.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = severityFilter === 'all' || accident.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || accident.status === statusFilter;
    
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  // Calculate statistics
  const totalAccidents = accidents.length;
  const totalInjuries = accidents.reduce((sum, acc) => sum + acc.injuries, 0);
  const totalFatalities = accidents.reduce((sum, acc) => sum + acc.fatalities, 0);
  const totalCost = accidents.reduce((sum, acc) => sum + acc.cost, 0);

  const getSeverityBadge = (severity: string) => {
    const configs = {
      minor: { color: 'bg-green-100 text-green-800', label: 'Minor' },
      major: { color: 'bg-orange-100 text-orange-800', label: 'Major' },
      critical: { color: 'bg-red-100 text-red-800', label: 'Critical' }
    };
    
    const config = configs[severity as keyof typeof configs] || configs.minor;
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      investigated: { color: 'bg-blue-100 text-blue-800', label: 'Investigated' },
      under_investigation: { color: 'bg-purple-100 text-purple-800', label: 'Under Investigation' },
      closed: { color: 'bg-gray-100 text-gray-800', label: 'Closed' }
    };
    
    const config = configs[status as keyof typeof configs] || configs.pending;
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const handleReportAccident = () => {
    if (!newAccidentReport.tripId || !newAccidentReport.location || !newAccidentReport.severity) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Simulate API call
    setTimeout(() => {
      toast.success('Accident report submitted successfully');
      setNewAccidentReport({
        tripId: '',
        location: '',
        severity: '',
        description: '',
        injuries: '',
        fatalities: '',
        cause: '',
        weatherConditions: '',
        roadConditions: ''
      });
      setShowReportDialog(false);
    }, 500);
  };

  const exportData = () => {
    console.log('Exporting accident data:', filteredAccidents);
    toast.success('Accident data exported successfully');
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Accident Analysis</h1>
        <p className="text-muted-foreground">
          Monitor and analyze transport accidents across the RISE network
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="accidents">Accidents</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Accidents</p>
                    <p className="text-2xl font-bold">{totalAccidents}</p>
                    <p className="text-xs text-red-600 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +2 this month
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Injuries</p>
                    <p className="text-2xl font-bold">{totalInjuries}</p>
                    <p className="text-xs text-orange-600 flex items-center mt-1">
                      <Users className="h-3 w-3 mr-1" />
                      {Math.round(totalInjuries / totalAccidents)} avg per incident
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Fatalities</p>
                    <p className="text-2xl font-bold">{totalFatalities}</p>
                    <p className="text-xs text-gray-600 flex items-center mt-1">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {((totalFatalities / totalAccidents) * 100).toFixed(1)}% fatality rate
                    </p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-gray-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                    <p className="text-2xl font-bold">₵{totalCost.toLocaleString()}</p>
                    <p className="text-xs text-blue-600 flex items-center mt-1">
                      <BarChart3 className="h-3 w-3 mr-1" />
                      ₵{Math.round(totalCost / totalAccidents).toLocaleString()} avg cost
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Accidents & Quick Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Accidents</CardTitle>
                <CardDescription>Latest accident reports requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {accidents.slice(0, 5).map((accident) => (
                    <div key={accident.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium">{accident.id}</p>
                          {getSeverityBadge(accident.severity)}
                        </div>
                        <p className="text-sm text-muted-foreground">{accident.location}</p>
                        <p className="text-sm text-muted-foreground">{accident.route}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(accident.date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {accident.injuries} injured
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Accident Severity Distribution</CardTitle>
                <CardDescription>Breakdown by severity level</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPieChart>
                    <Pie
                      data={severityDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ severity, percentage }) => `${severity}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {severityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Accidents Tab */}
        <TabsContent value="accidents" className="space-y-6">
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="accident-search">Search Accidents</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="accident-search"
                  placeholder="Search by ID, location, driver, or route..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="minor">Minor</SelectItem>
                  <SelectItem value="major">Major</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="investigated">Investigated</SelectItem>
                  <SelectItem value="under_investigation">Under Investigation</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowReportDialog(true)} 
                  size="sm"
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Report Accident
                </Button>
                <Button onClick={exportData} variant="outline" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Accident Records ({filteredAccidents.length})</CardTitle>
              <CardDescription>Complete accident history and investigations</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Accident ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Casualties</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccidents.map((accident) => (
                    <TableRow key={accident.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{accident.id}</p>
                          <p className="text-sm text-muted-foreground">{accident.route}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{new Date(accident.date).toLocaleDateString()}</p>
                          <p className="text-sm text-muted-foreground">{new Date(accident.date).toLocaleTimeString()}</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm truncate">{accident.location}</p>
                      </TableCell>
                      <TableCell>{getSeverityBadge(accident.severity)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="text-orange-600">{accident.injuries} injured</p>
                          {accident.fatalities > 0 && (
                            <p className="text-red-600">{accident.fatalities} fatalities</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(accident.status)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedAccident(accident)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Accident Trends</CardTitle>
                <CardDescription>Monthly accident statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={accidentTrendsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="accidents" 
                      stackId="1"
                      stroke="#ef4444" 
                      fill="#ef4444"
                      fillOpacity={0.6}
                      name="Accidents"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="injuries" 
                      stackId="2"
                      stroke="#f59e0b" 
                      fill="#f59e0b"
                      fillOpacity={0.6}
                      name="Injuries"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Accident Causes</CardTitle>
                <CardDescription>Analysis of primary accident causes</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={causeAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="cause" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cost Impact Analysis</CardTitle>
              <CardDescription>Financial impact of accidents over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={accidentTrendsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₵${value.toLocaleString()}`, 'Cost']} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="cost" 
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    name="Total Cost (₵)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Safety Report
                </CardTitle>
                <CardDescription>
                  Comprehensive safety analysis and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  Monthly Summary
                </CardTitle>
                <CardDescription>
                  Monthly accident statistics and trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-purple-600" />
                  Vehicle Safety
                </CardTitle>
                <CardDescription>
                  Vehicle-specific accident patterns and maintenance needs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Accident Details Dialog */}
      <Dialog open={!!selectedAccident} onOpenChange={() => setSelectedAccident(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Accident Details - {selectedAccident?.id}</DialogTitle>
            <DialogDescription>
              Complete accident report and investigation details
            </DialogDescription>
          </DialogHeader>
          {selectedAccident && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Basic Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date:</span>
                        <span>{new Date(selectedAccident.date).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Location:</span>
                        <span className="text-right">{selectedAccident.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Route:</span>
                        <span>{selectedAccident.route}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Severity:</span>
                        <span>{getSeverityBadge(selectedAccident.severity)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Vehicle & Driver</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Vehicle:</span>
                        <span>{selectedAccident.vehicleId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Driver:</span>
                        <span>{selectedAccident.driverName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Passengers:</span>
                        <span>{selectedAccident.passengersAboard}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Casualties</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Injuries:</span>
                        <span className="text-orange-600">{selectedAccident.injuries}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fatalities:</span>
                        <span className="text-red-600">{selectedAccident.fatalities}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Conditions</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Weather:</span>
                        <span>{selectedAccident.weatherConditions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Road:</span>
                        <span>{selectedAccident.roadConditions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Time:</span>
                        <span>{selectedAccident.timeOfDay}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Investigation</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <span>{getStatusBadge(selectedAccident.status)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cost:</span>
                        <span>₵{selectedAccident.cost.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                  {selectedAccident.description}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Report Accident Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Report New Accident
            </DialogTitle>
            <DialogDescription>
              Submit a new accident report for investigation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="trip-id">Trip ID *</Label>
                <Input
                  id="trip-id"
                  value={newAccidentReport.tripId}
                  onChange={(e) => setNewAccidentReport({...newAccidentReport, tripId: e.target.value})}
                  placeholder="e.g., TRP001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="severity">Severity *</Label>
                <Select value={newAccidentReport.severity} onValueChange={(value) => setNewAccidentReport({...newAccidentReport, severity: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="major">Major</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={newAccidentReport.location}
                onChange={(e) => setNewAccidentReport({...newAccidentReport, location: e.target.value})}
                placeholder="Exact location of the accident"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="injuries">Number of Injuries</Label>
                <Input
                  id="injuries"
                  type="number"
                  value={newAccidentReport.injuries}
                  onChange={(e) => setNewAccidentReport({...newAccidentReport, injuries: e.target.value})}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fatalities">Number of Fatalities</Label>
                <Input
                  id="fatalities"
                  type="number"
                  value={newAccidentReport.fatalities}
                  onChange={(e) => setNewAccidentReport({...newAccidentReport, fatalities: e.target.value})}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={newAccidentReport.description}
                onChange={(e) => setNewAccidentReport({...newAccidentReport, description: e.target.value})}
                placeholder="Detailed description of what happened..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cause">Probable Cause</Label>
                <Select value={newAccidentReport.cause} onValueChange={(value) => setNewAccidentReport({...newAccidentReport, cause: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select cause" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="driver_error">Driver Error</SelectItem>
                    <SelectItem value="weather">Weather</SelectItem>
                    <SelectItem value="mechanical_failure">Mechanical Failure</SelectItem>
                    <SelectItem value="road_conditions">Road Conditions</SelectItem>
                    <SelectItem value="other_vehicle">Other Vehicle</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="weather">Weather</Label>
                <Select value={newAccidentReport.weatherConditions} onValueChange={(value) => setNewAccidentReport({...newAccidentReport, weatherConditions: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Weather" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clear">Clear</SelectItem>
                    <SelectItem value="rain">Rain</SelectItem>
                    <SelectItem value="heavy_rain">Heavy Rain</SelectItem>
                    <SelectItem value="fog">Fog</SelectItem>
                    <SelectItem value="storm">Storm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="road">Road Conditions</Label>
                <Select value={newAccidentReport.roadConditions} onValueChange={(value) => setNewAccidentReport({...newAccidentReport, roadConditions: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Road" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                    <SelectItem value="under_construction">Under Construction</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleReportAccident} className="flex-1 bg-red-600 hover:bg-red-700">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Submit Report
              </Button>
              <Button variant="outline" onClick={() => setShowReportDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}