import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Progress } from './ui/progress';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  FileText, 
  Download, 
  Calendar as CalendarIcon, 
  Filter, 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign,
  Bus,
  MapPin,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  Printer,
  Mail,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

// Mock data for reports
const revenueData = [
  { month: 'Jan', revenue: 45000, trips: 340, passengers: 8500 },
  { month: 'Feb', revenue: 52000, trips: 380, passengers: 9200 },
  { month: 'Mar', revenue: 48000, trips: 360, passengers: 8800 },
  { month: 'Apr', revenue: 61000, trips: 420, passengers: 10500 },
  { month: 'May', revenue: 55000, trips: 400, passengers: 9800 },
  { month: 'Jun', revenue: 67000, trips: 450, passengers: 11200 },
  { month: 'Jul', revenue: 73000, trips: 480, passengers: 12000 }
];

const tripStatusData = [
  { name: 'Completed', value: 450, color: '#22c55e' },
  { name: 'In Progress', value: 23, color: '#3b82f6' },
  { name: 'Scheduled', value: 67, color: '#f59e0b' },
  { name: 'Cancelled', value: 12, color: '#ef4444' }
];

const routePerformanceData = [
  { route: 'Accra-Kumasi', trips: 89, revenue: 156780, occupancy: 92 },
  { route: 'Kumasi-Tamale', trips: 67, revenue: 98440, occupancy: 85 },
  { route: 'Takoradi-Accra', trips: 78, revenue: 134560, occupancy: 88 },
  { route: 'Cape Coast-Accra', trips: 56, revenue: 87320, occupancy: 79 },
  { route: 'Ho-Accra', trips: 34, revenue: 67890, occupancy: 76 }
];

const dailyTrendsData = [
  { day: 'Mon', passengers: 1200, revenue: 8400 },
  { day: 'Tue', passengers: 1350, revenue: 9450 },
  { day: 'Wed', passengers: 1100, revenue: 7700 },
  { day: 'Thu', passengers: 1450, revenue: 10150 },
  { day: 'Fri', passengers: 1600, revenue: 11200 },
  { day: 'Sat', passengers: 1800, revenue: 12600 },
  { day: 'Sun', passengers: 1300, revenue: 9100 }
];

export function Reports() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(2024, 6, 1), // July 1, 2024
    to: new Date(2024, 6, 31)   // July 31, 2024
  });
  const [reportType, setReportType] = useState('financial');
  const [stationFilter, setStationFilter] = useState('all');
  const [routeFilter, setRouteFilter] = useState('all');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = async (format: 'pdf' | 'excel' | 'csv') => {
    setIsGenerating(true);
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGenerating(false);
    console.log(`Generating ${format.toUpperCase()} report for ${reportType}`);
  };

  const handleEmailReport = () => {
    console.log('Emailing report...');
  };

  const handlePrintReport = () => {
    window.print();
  };

  const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);
  const totalTrips = revenueData.reduce((sum, item) => sum + item.trips, 0);
  const totalPassengers = revenueData.reduce((sum, item) => sum + item.passengers, 0);
  const avgOccupancy = routePerformanceData.reduce((sum, item) => sum + item.occupancy, 0) / routePerformanceData.length;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive reporting system for operations, revenue, and performance analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handlePrintReport} variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button onClick={handleEmailReport} variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Email
          </Button>
          <Button onClick={() => window.location.reload()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Report Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filters
          </CardTitle>
          <CardDescription>
            Configure parameters for your reports and analytics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="financial">Financial Report</SelectItem>
                  <SelectItem value="operations">Operations Report</SelectItem>
                  <SelectItem value="passenger">Passenger Analytics</SelectItem>
                  <SelectItem value="performance">Performance Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from && dateRange.to
                      ? `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd')}`
                      : 'Select dates'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setDateRange({ from: range.from, to: range.to });
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Station</label>
              <Select value={stationFilter} onValueChange={setStationFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stations</SelectItem>
                  <SelectItem value="accra">Accra Central</SelectItem>
                  <SelectItem value="kumasi">Kumasi Station</SelectItem>
                  <SelectItem value="takoradi">Takoradi Terminal</SelectItem>
                  <SelectItem value="tamale">Tamale Station</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Route</label>
              <Select value={routeFilter} onValueChange={setRouteFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Routes</SelectItem>
                  <SelectItem value="accra-kumasi">Accra - Kumasi</SelectItem>
                  <SelectItem value="kumasi-tamale">Kumasi - Tamale</SelectItem>
                  <SelectItem value="takoradi-accra">Takoradi - Accra</SelectItem>
                  <SelectItem value="cape-coast-accra">Cape Coast - Accra</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-4 border-t">
            <Button 
              onClick={() => handleGenerateReport('pdf')} 
              disabled={isGenerating}
            >
              {isGenerating ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Generate PDF
            </Button>
            <Button 
              onClick={() => handleGenerateReport('excel')} 
              variant="outline"
              disabled={isGenerating}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button 
              onClick={() => handleGenerateReport('csv')} 
              variant="outline"
              disabled={isGenerating}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">₵{totalRevenue.toLocaleString()}</p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +12.5% from last period
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Trips</p>
                    <p className="text-2xl font-bold">{totalTrips.toLocaleString()}</p>
                    <p className="text-xs text-blue-600 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +8.3% from last period
                    </p>
                  </div>
                  <Bus className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Passengers</p>
                    <p className="text-2xl font-bold">{totalPassengers.toLocaleString()}</p>
                    <p className="text-xs text-purple-600 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +15.2% from last period
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg. Occupancy</p>
                    <p className="text-2xl font-bold">{avgOccupancy.toFixed(1)}%</p>
                    <p className="text-xs text-orange-600 flex items-center mt-1">
                      <Target className="h-3 w-3 mr-1" />
                      Target: 85%
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue & Trips Trend</CardTitle>
              <CardDescription>Monthly revenue and trip count comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#8884d8" 
                    fill="#8884d8"
                    fillOpacity={0.6}
                    name="Revenue (₵)"
                  />
                  <Area 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="trips" 
                    stroke="#82ca9d" 
                    fill="#82ca9d"
                    fillOpacity={0.6}
                    name="Trips"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Month</CardTitle>
                <CardDescription>Monthly revenue comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daily Revenue Trends</CardTitle>
                <CardDescription>Average daily revenue by day of week</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyTrendsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Route Revenue Performance</CardTitle>
              <CardDescription>Revenue breakdown by route</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {routePerformanceData.map((route, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{route.route}</span>
                        <span className="text-sm text-muted-foreground">
                          {route.trips} trips
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold">₵{route.revenue.toLocaleString()}</span>
                        <Badge variant="outline">{route.occupancy}% occupancy</Badge>
                      </div>
                      <Progress value={route.occupancy} className="mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Operations Tab */}
        <TabsContent value="operations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Trip Status Distribution</CardTitle>
                <CardDescription>Current status of all trips</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={tripStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {tripStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Passenger Trends</CardTitle>
                <CardDescription>Daily passenger count trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyTrendsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="passengers" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Operations Summary</CardTitle>
              <CardDescription>Key operational metrics and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium">On-Time Performance</span>
                  </div>
                  <p className="text-2xl font-bold">94.2%</p>
                  <p className="text-sm text-muted-foreground">Above target of 90%</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <span className="font-medium">Vehicle Utilization</span>
                  </div>
                  <p className="text-2xl font-bold">87.5%</p>
                  <p className="text-sm text-muted-foreground">2.5% below target</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">Average Delay</span>
                  </div>
                  <p className="text-2xl font-bold">8.3 min</p>
                  <p className="text-sm text-muted-foreground">Improved from 12.1 min</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Route Performance Analysis</CardTitle>
              <CardDescription>Detailed performance metrics by route</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={routePerformanceData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="route" type="category" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="occupancy" fill="#8884d8" name="Occupancy %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Indicators</CardTitle>
                <CardDescription>Key performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Customer Satisfaction</span>
                  <span className="font-bold">4.6/5.0</span>
                </div>
                <Progress value={92} />

                <div className="flex justify-between items-center">
                  <span>Revenue per Trip</span>
                  <span className="font-bold">₵156.78</span>
                </div>
                <Progress value={78} />

                <div className="flex justify-between items-center">
                  <span>Driver Efficiency</span>
                  <span className="font-bold">91.3%</span>
                </div>
                <Progress value={91} />

                <div className="flex justify-between items-center">
                  <span>Fuel Efficiency</span>
                  <span className="font-bold">8.2 km/L</span>
                </div>
                <Progress value={82} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Comparison</CardTitle>
                <CardDescription>Performance vs. previous month</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span>Revenue Growth</span>
                  <span className="font-bold text-green-600">+12.5%</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span>Trip Completion Rate</span>
                  <span className="font-bold text-blue-600">+3.2%</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <span>Average Delay</span>
                  <span className="font-bold text-yellow-600">-23.8%</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span>Passenger Load Factor</span>
                  <span className="font-bold text-purple-600">+5.1%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}