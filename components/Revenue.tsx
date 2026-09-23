import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useAuth } from './AuthContext';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  MapPin,
  Route,
  CreditCard,
  Receipt,
  Loader2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  Legend,
  Pie,
} from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { formatCurrency } from './utils/helpers';
import { revenueApi } from './utils/api';
import { notify } from './utils/notify';
import {
  loadRevenueFromApi,
  type PaymentMethodItem,
  type RevenuePeriodItem,
  type RouteRevenueItem,
  type StationRevenueItem,
} from './Revenue/utils';

const REVENUE_TAB_TRIGGER_CLASS =
  'rounded-md py-2 text-sm font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:font-semibold data-[state=active]:ring-1 data-[state=active]:ring-emerald-700/40';

export function Revenue() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trendData, setTrendData] = useState<RevenuePeriodItem[]>([]);
  const [stationRevenue, setStationRevenue] = useState<StationRevenueItem[]>([]);
  const [routeRevenue, setRouteRevenue] = useState<RouteRevenueItem[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalTrips, setTotalTrips] = useState(0);
  const [totalPassengers, setTotalPassengers] = useState(0);
  const [avgRevenuePerTrip, setAvgRevenuePerTrip] = useState(0);

  const fetchRevenueData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { analytics, error: loadError } = await loadRevenueFromApi(
        selectedPeriod,
        user?.stationId
      );

      setTrendData(analytics.trendData);
      setStationRevenue(analytics.stationRevenue);
      setRouteRevenue(analytics.routeRevenue);
      setPaymentMethods(analytics.paymentMethods);
      setTotalRevenue(analytics.totalRevenue);
      setTotalTrips(analytics.totalTrips);
      setTotalPassengers(analytics.totalPassengers);
      setAvgRevenuePerTrip(analytics.avgRevenuePerTrip);
      setError(loadError ?? null);
    } catch (err) {
      console.error('Revenue fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, user?.stationId]);

  const handleExportReport = async () => {
    const response = await revenueApi.export({ format: 'csv', period: selectedPeriod });
    if (response.success) {
      notify.success('Revenue report export completed');
    } else {
      notify.error(response.error || 'Export failed');
    }
  };

  useEffect(() => {
    fetchRevenueData();
  }, [fetchRevenueData]);

  if (!user || (user.role !== 'admin' && user.role !== 'super_admin' && user.role !== 'regional_manager')) {
    return (
      <div className="p-6 text-center">
        <DollarSign className="h-16 w-16 mx-auto mb-4 text-gray-400" />
        <h2 className="text-2xl font-bold text-gray-600 mb-2">Access Restricted</h2>
        <p className="text-gray-500">Only administrators and managers can access revenue reports.</p>
      </div>
    );
  }

  const chartData = trendData.map((item) => ({
    name: item.period,
    revenue: item.totalRevenue,
    profit: item.profit || 0,
    costs: (item.fuelCosts || 0) + (item.maintenanceCosts || 0),
  }));

  const hasData =
    totalRevenue > 0 ||
    trendData.length > 0 ||
    stationRevenue.length > 0 ||
    routeRevenue.length > 0 ||
    paymentMethods.length > 0;

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#193cb8] mb-4" />
        <p className="text-muted-foreground">Loading revenue data...</p>
      </div>
    );
  }

  if (error && !hasData) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Failed to Load Revenue Data</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={fetchRevenueData} style={{ backgroundColor: '#193cb8' }}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Revenue Management</h1>
          <p className="text-muted-foreground">
            Comprehensive revenue tracking and financial analytics
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchRevenueData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => void handleExportReport()}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Custom Period
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
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
              <Route className="h-8 w-8 text-[#193cb8]" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Revenue/Trip</p>
                <p className="text-2xl font-bold">{formatCurrency(Math.round(avgRevenuePerTrip))}</p>
              </div>
              <Receipt className="h-8 w-8 text-[#193cb8]" />
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
              <CreditCard className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Revenue Analytics</CardTitle>
            <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <TabsList className="h-auto gap-1 bg-muted/50 p-1.5 rounded-lg border shadow-none">
                <TabsTrigger value="daily" className={REVENUE_TAB_TRIGGER_CLASS}>
                  Daily
                </TabsTrigger>
                <TabsTrigger value="monthly" className={REVENUE_TAB_TRIGGER_CLASS}>
                  Monthly
                </TabsTrigger>
                <TabsTrigger value="quarterly" className={REVENUE_TAB_TRIGGER_CLASS}>
                  Quarterly
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium mb-4">Revenue Trend</h4>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => [
                        formatCurrency(Number(value)),
                        name === 'revenue' ? 'Revenue' : name === 'profit' ? 'Profit' : 'Costs',
                      ]}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#193cb8" strokeWidth={3} name="Revenue" />
                    <Line type="monotone" dataKey="profit" stroke="#82ca9d" strokeWidth={2} name="Profit" />
                  </RechartsLineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No trend data available for this period
                </div>
              )}
            </div>
            <div>
              <h4 className="text-sm font-medium mb-4">Payment Methods Distribution</h4>
              {paymentMethods.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={paymentMethods}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#193cb8"
                      dataKey="value"
                    >
                      {paymentMethods.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No payment method data available
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Station Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stationRevenue.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium mb-4">Revenue by Station</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsBarChart data={stationRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} />
                    <Bar dataKey="revenue" fill="#193cb8" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Top Performing Stations</h4>
                {stationRevenue.slice(0, 3).map((station, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{station.name}</p>
                      {station.percentage != null && (
                        <p className="text-sm text-muted-foreground">{station.percentage}% of total</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(station.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">No station revenue data available</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Route className="h-5 w-5" />
            <span>Top Routes by Revenue</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {routeRevenue.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Route</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Trips</TableHead>
                  <TableHead>Avg Fare</TableHead>
                  <TableHead>Performance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routeRevenue.map((route, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{route.route}</TableCell>
                    <TableCell>{formatCurrency(route.revenue)}</TableCell>
                    <TableCell>{route.trips.toLocaleString()}</TableCell>
                    <TableCell>{formatCurrency(route.avgFare)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {index < 2 ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                        <span className={`text-sm ${index < 2 ? 'text-green-600' : 'text-red-600'}`}>
                          {index < 2 ? 'Growing' : 'Declining'}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center text-muted-foreground">No route revenue data available</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
