import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
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
  Download,
  Calendar as CalendarIcon,
  Filter,
  TrendingUp,
  Users,
  DollarSign,
  Bus,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  Printer,
  Mail,
  RefreshCw,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from './AuthContext';
import { reportApi } from './utils/api';
import { notify } from './utils/notify';
import {
  num,
  mapRevenueTrend,
  mapDailyTrends,
  mapRoutePerformance,
  mapTripStatus,
  mapPerformanceIndicators,
  mapMonthlyComparison,
} from './Reports/reportDataUtils';

const REPORT_TAB_TRIGGER_CLASS =
  'rounded-md py-2.5 text-sm font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:font-semibold data-[state=active]:ring-1 data-[state=active]:ring-emerald-700/40';

const TRIP_STATUS_COLORS = ['#22c55e', '#193cb8', '#f59e0b', '#ef4444'];

function getQueryParams(
  dateRange: { from: Date; to: Date },
  stationFilter: string,
  routeFilter: string
) {
  return {
    from: format(dateRange.from, 'yyyy-MM-dd'),
    to: format(dateRange.to, 'yyyy-MM-dd'),
    stationId: stationFilter !== 'all' ? stationFilter : undefined,
    route: routeFilter !== 'all' ? routeFilter : undefined,
  };
}

export function Reports() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const [reportType, setReportType] = useState('financial');
  const [stationFilter, setStationFilter] = useState('all');
  const [routeFilter, setRouteFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [overviewData, setOverviewData] = useState<Record<string, unknown> | null>(null);
  const [financialData, setFinancialData] = useState<Record<string, unknown> | null>(null);
  const [operationsData, setOperationsData] = useState<Record<string, unknown> | null>(null);
  const [performanceData, setPerformanceData] = useState<Record<string, unknown> | null>(null);

  const fetchAllReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = getQueryParams(dateRange, stationFilter, routeFilter);

    try {
      const [overviewRes, financialRes, operationsRes, performanceRes] = await Promise.all([
        reportApi.getOverview(params),
        reportApi.getFinancial(params),
        reportApi.getOperations(params),
        reportApi.getPerformance(params),
      ]);

      if (overviewRes.success) {
        setOverviewData((overviewRes.data as Record<string, unknown>) ?? null);
      }
      if (financialRes.success) {
        setFinancialData((financialRes.data as Record<string, unknown>) ?? null);
      }
      if (operationsRes.success) {
        setOperationsData((operationsRes.data as Record<string, unknown>) ?? null);
      }
      if (performanceRes.success) {
        setPerformanceData((performanceRes.data as Record<string, unknown>) ?? null);
      }

      const errors = [
        !overviewRes.success && (overviewRes.error || 'Overview report failed'),
        !financialRes.success && (financialRes.error || 'Financial report failed'),
        !operationsRes.success && (operationsRes.error || 'Operations report failed'),
        !performanceRes.success && (performanceRes.error || 'Performance report failed'),
      ].filter(Boolean) as string[];

      if (errors.length === 4) {
        setError(errors.join('. '));
      } else if (errors.length > 0) {
        setError(errors.join('. '));
        notify.error('Some report sections failed to load', { description: errors.join('. ') });
      }
    } catch (err) {
      console.error('Reports fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  }, [dateRange, stationFilter, routeFilter]);

  useEffect(() => {
    fetchAllReports();
  }, [fetchAllReports]);

  const handleGenerateReport = async (exportFormat: 'pdf' | 'excel' | 'csv') => {
    setIsGenerating(true);
    try {
      const params = getQueryParams(dateRange, stationFilter, routeFilter);
      const response = await reportApi.generate({
        type: reportType,
        format: exportFormat,
        ...params,
      });

      if (response.success) {
        notify.success(`${exportFormat.toUpperCase()} report generated successfully`);
        const data = response.data as Record<string, unknown> | undefined;
        const downloadUrl = data?.downloadUrl ?? data?.url;
        if (typeof downloadUrl === 'string') {
          window.open(downloadUrl, '_blank');
        }
      } else {
        notify.error('Failed to generate report', { description: response.error });
      }
    } catch (err) {
      notify.error('Failed to generate report', {
        description: err instanceof Error ? err.message : 'Please try again',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEmailReport = async () => {
    const email = user?.email?.trim();
    if (!email) {
      notify.error('No email on your profile to send the report');
      return;
    }

    try {
      const params = getQueryParams(dateRange, stationFilter, routeFilter);
      const response = await reportApi.email({
        type: reportType,
        recipients: [email],
        ...params,
      });
      if (response.success) {
        notify.success('Report emailed successfully');
      } else {
        notify.error(response.error || 'Failed to email report');
      }
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Failed to email report');
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  const overviewRevenueTrend = mapRevenueTrend(overviewData);
  const financialRevenueTrend = mapRevenueTrend(financialData);
  const financialDailyTrends = mapDailyTrends(financialData);
  const financialRoutePerformance = mapRoutePerformance(financialData);

  const operationsDailyTrends = mapDailyTrends(operationsData);
  const tripStatusData = mapTripStatus(operationsData, TRIP_STATUS_COLORS);

  const performanceRoutePerformance = mapRoutePerformance(performanceData);
  const performanceIndicators = mapPerformanceIndicators(performanceData);
  const monthlyComparison = mapMonthlyComparison(performanceData);

  const totalRevenue = num(overviewData, 'totalRevenue');
  const totalTrips = num(overviewData, 'totalTrips');
  const totalPassengers = num(overviewData, 'totalPassengers', 'totalTickets');
  const avgOccupancy = num(overviewData, 'avgOccupancy');

  const operationsSummary = operationsData ?? {};

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
          <Button onClick={() => fetchAllReports()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

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
            <Button onClick={() => handleGenerateReport('pdf')} disabled={isGenerating}>
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

      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#193cb8] mb-4" />
          <p className="text-muted-foreground">Loading report data...</p>
        </div>
      )}

      {error && !loading && !overviewData && !financialData && !operationsData && !performanceData && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={() => fetchAllReports()}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {error && !loading && (overviewData || financialData || operationsData || performanceData) && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!loading && (overviewData || financialData || operationsData || performanceData) && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-auto gap-1 bg-muted/50 p-1.5 rounded-lg border shadow-none">
            <TabsTrigger value="overview" className={REPORT_TAB_TRIGGER_CLASS}>
              Overview
            </TabsTrigger>
            <TabsTrigger value="financial" className={REPORT_TAB_TRIGGER_CLASS}>
              Financial
            </TabsTrigger>
            <TabsTrigger value="operations" className={REPORT_TAB_TRIGGER_CLASS}>
              Operations
            </TabsTrigger>
            <TabsTrigger value="performance" className={REPORT_TAB_TRIGGER_CLASS}>
              Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold">₵{totalRevenue.toLocaleString()}</p>
                      {overviewData?.revenueGrowth != null && (
                        <p className="text-xs text-green-600 flex items-center mt-1">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {Number(overviewData.revenueGrowth) > 0 ? '+' : ''}
                          {Number(overviewData.revenueGrowth)}% from last period
                        </p>
                      )}
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
                    </div>
                    <Bus className="h-8 w-8 text-[#193cb8]" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Passengers</p>
                      <p className="text-2xl font-bold">{totalPassengers.toLocaleString()}</p>
                    </div>
                    <Users className="h-8 w-8 text-[#193cb8]" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Avg. Occupancy</p>
                      <p className="text-2xl font-bold">{avgOccupancy.toFixed(1)}%</p>
                    </div>
                    <Target className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Revenue & Trips Trend</CardTitle>
                <CardDescription>Monthly revenue and trip count comparison</CardDescription>
              </CardHeader>
              <CardContent>
                {overviewRevenueTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={overviewRevenueTrend}>
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
                        stroke="#193cb8"
                        fill="#193cb8"
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
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No trend data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Month</CardTitle>
                  <CardDescription>Monthly revenue comparison</CardDescription>
                </CardHeader>
                <CardContent>
                  {financialRevenueTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={financialRevenueTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="revenue" fill="#193cb8" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No revenue data available
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Daily Revenue Trends</CardTitle>
                  <CardDescription>Average daily revenue by day of week</CardDescription>
                </CardHeader>
                <CardContent>
                  {financialDailyTrends.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={financialDailyTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="revenue" stroke="#193cb8" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No daily trend data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Route Revenue Performance</CardTitle>
                <CardDescription>Revenue breakdown by route</CardDescription>
              </CardHeader>
              <CardContent>
                {financialRoutePerformance.length > 0 ? (
                  <div className="space-y-4">
                    {financialRoutePerformance.map((route, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{route.route}</span>
                            <span className="text-sm text-muted-foreground">{route.trips} trips</span>
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
                ) : (
                  <div className="py-8 text-center text-muted-foreground">No route performance data available</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="operations" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Trip Status Distribution</CardTitle>
                  <CardDescription>Current status of all trips</CardDescription>
                </CardHeader>
                <CardContent>
                  {tripStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={tripStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#193cb8"
                          dataKey="value"
                        >
                          {tripStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No trip status data available
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Passenger Trends</CardTitle>
                  <CardDescription>Daily passenger count trends</CardDescription>
                </CardHeader>
                <CardContent>
                  {operationsDailyTrends.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={operationsDailyTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="passengers" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No passenger trend data available
                    </div>
                  )}
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
                    <p className="text-2xl font-bold">
                      {operationsSummary.onTimePerformance != null
                        ? `${Number(operationsSummary.onTimePerformance)}%`
                        : '—'}
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      <span className="font-medium">Vehicle Utilization</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {operationsSummary.vehicleUtilization != null
                        ? `${Number(operationsSummary.vehicleUtilization)}%`
                        : '—'}
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-[#193cb8]" />
                      <span className="font-medium">Average Delay</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {operationsSummary.averageDelay != null
                        ? `${Number(operationsSummary.averageDelay)} min`
                        : '—'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Route Performance Analysis</CardTitle>
                <CardDescription>Detailed performance metrics by route</CardDescription>
              </CardHeader>
              <CardContent>
                {performanceRoutePerformance.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={performanceRoutePerformance} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="route" type="category" width={100} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="occupancy" fill="#193cb8" name="Occupancy %" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                    No performance data available
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Indicators</CardTitle>
                  <CardDescription>Key performance metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {performanceIndicators.length > 0 ? (
                    performanceIndicators.map((indicator, index) => (
                      <div key={index}>
                        <div className="flex justify-between items-center">
                          <span>{String(indicator.label ?? indicator.name ?? 'Metric')}</span>
                          <span className="font-bold">{String(indicator.value ?? '—')}</span>
                        </div>
                        {indicator.progress != null && <Progress value={Number(indicator.progress)} />}
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">No performance indicators available</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Comparison</CardTitle>
                  <CardDescription>Performance vs. previous month</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {monthlyComparison.length > 0 ? (
                    monthlyComparison.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 bg-muted rounded-lg"
                      >
                        <span>{String(item.label ?? item.name ?? 'Metric')}</span>
                        <span className="font-bold">{String(item.value ?? '—')}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">No comparison data available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
