import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
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
  RefreshCw,
  Users,
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
import { cn } from './ui/utils';
import { PageHeader } from './shared/PageHeader';
import { DashboardStatCard } from './Dashboard/DashboardStatCard';
import { RisePreloader, RiseStatusAlert } from './shared/feedback';
import { ScrollableTable } from './shared/ScrollableTable';
import {
  loadRevenueFromApi,
  type PaymentMethodItem,
  type RevenuePeriodItem,
  type RouteRevenueItem,
  type StationRevenueItem,
} from './Revenue/utils';

const PERIOD_TAB_CLASS = 'justify-center gap-1.5 px-3 text-sm font-medium';
const CHART_CARD_CLASS = 'rounded-2xl shadow-sm ring-1 ring-border/50 border-0';

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
    void fetchRevenueData();
  }, [fetchRevenueData]);

  if (!user || (user.role !== 'admin' && user.role !== 'super_admin' && user.role !== 'regional_manager')) {
    return (
      <div className="min-h-[420px] rise-dashboard-page p-6 flex flex-col items-center justify-center text-center">
        <DollarSign className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold tracking-tight">Access restricted</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
          Only administrators and regional managers can access revenue analytics.
        </p>
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

  const periodLabel =
    selectedPeriod === 'daily' ? 'Daily' : selectedPeriod === 'quarterly' ? 'Quarterly' : 'Monthly';

  if (loading && !hasData && !error) {
    return (
      <div className="p-6 min-h-[420px] rise-dashboard-page">
        <RisePreloader variant="page" label="Loading revenue analytics…" />
      </div>
    );
  }

  return (
    <div className="min-h-full rise-dashboard-page">
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <PageHeader
          title="Revenue analytics"
          description="Track ticket revenue, payment mix, station and route performance for the selected period."
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void fetchRevenueData()}
                disabled={loading}
              >
                <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={() => void handleExportReport()}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" disabled title="Custom date range coming soon">
                <Calendar className="h-4 w-4 mr-2" />
                Custom period
              </Button>
            </>
          }
        />

        {error && !hasData ? (
          <RiseStatusAlert type="error" title="Could not load revenue data">
            {error}
            <Button variant="outline" size="sm" className="mt-3" onClick={() => void fetchRevenueData()}>
              Try again
            </Button>
          </RiseStatusAlert>
        ) : null}

        {error && hasData && !loading ? (
          <RiseStatusAlert type="warning" title="Some revenue data may be incomplete">
            {error}
          </RiseStatusAlert>
        ) : null}

        <section className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-4 sm:p-5 ring-1 ring-border/40">
          <h2 className="text-sm font-semibold tracking-tight mb-4">Period summary</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            <DashboardStatCard
              title="Total revenue"
              value={formatCurrency(totalRevenue)}
              icon={DollarSign}
              accent="emerald"
              hint={`${periodLabel} view`}
            />
            <DashboardStatCard
              title="Total trips"
              value={totalTrips.toLocaleString()}
              icon={Route}
              accent="blue"
              hint="In selected period"
            />
            <DashboardStatCard
              title="Avg revenue / trip"
              value={formatCurrency(Math.round(avgRevenuePerTrip))}
              icon={Receipt}
              accent="violet"
              hint="Yield per trip"
            />
            <DashboardStatCard
              title="Total passengers"
              value={totalPassengers.toLocaleString()}
              icon={Users}
              accent="amber"
              hint="Tickets sold"
            />
          </div>
        </section>

        <Card className={CHART_CARD_CLASS}>
          <CardHeader className="border-b border-border/60 bg-muted/20 pb-4 space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Revenue trends &amp; payments</CardTitle>
                <CardDescription className="mt-1">
                  Line trend and payment method mix for the active period granularity.
                </CardDescription>
              </div>
              <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod} className="w-full lg:w-auto">
                <div className="rise-segment-tabs w-full max-w-md lg:ml-auto">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="daily" className={PERIOD_TAB_CLASS}>
                      Daily
                    </TabsTrigger>
                    <TabsTrigger value="monthly" className={PERIOD_TAB_CLASS}>
                      Monthly
                    </TabsTrigger>
                    <TabsTrigger value="quarterly" className={PERIOD_TAB_CLASS}>
                      Quarterly
                    </TabsTrigger>
                  </TabsList>
                </div>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className={loading ? 'opacity-60 pointer-events-none transition-opacity' : ''}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-4">Revenue trend</h4>
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
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground rounded-xl border border-dashed border-border/80 bg-muted/20">
                      No trend data for this period
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-4">Payment methods</h4>
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
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground rounded-xl border border-dashed border-border/80 bg-muted/20">
                      No payment method data
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={CHART_CARD_CLASS}>
          <CardHeader className="border-b border-border/60 bg-muted/20">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              Station performance
            </CardTitle>
            <CardDescription>Revenue contribution by station</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {stationRevenue.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-4">Revenue by station</h4>
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
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Top stations</h4>
                  {stationRevenue.slice(0, 5).map((station, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/20"
                    >
                      <div>
                        <p className="font-medium text-sm">{station.name}</p>
                        {station.percentage != null ? (
                          <p className="text-xs text-muted-foreground">{station.percentage}% of total</p>
                        ) : null}
                      </div>
                      <p className="font-semibold tabular-nums">{formatCurrency(station.revenue)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">No station revenue data available</div>
            )}
          </CardContent>
        </Card>

        <Card className={`${CHART_CARD_CLASS} overflow-hidden`}>
          <CardHeader className="border-b border-border/60 bg-muted/20">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Route className="h-5 w-5 text-muted-foreground" />
              Top routes by revenue
            </CardTitle>
            <CardDescription>Route-level yield and trip counts</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {routeRevenue.length > 0 ? (
              <ScrollableTable
                className="border-0 shadow-none ring-0"
                maxHeightClass="max-h-[min(50vh,420px)]"
                minWidthClass="min-w-[720px]"
              >
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent bg-muted/30">
                      <TableHead>Route</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Trips</TableHead>
                      <TableHead>Avg fare</TableHead>
                      <TableHead>Trend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {routeRevenue.map((route, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{route.route}</TableCell>
                        <TableCell className="tabular-nums">{formatCurrency(route.revenue)}</TableCell>
                        <TableCell className="tabular-nums">{route.trips.toLocaleString()}</TableCell>
                        <TableCell className="tabular-nums">{formatCurrency(route.avgFare)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            {index < 2 ? (
                              <>
                                <TrendingUp className="h-4 w-4 text-emerald-600" />
                                <span className="text-emerald-700 dark:text-emerald-400">Growing</span>
                              </>
                            ) : (
                              <>
                                <TrendingDown className="h-4 w-4 text-red-600" />
                                <span className="text-red-700 dark:text-red-400">Declining</span>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollableTable>
            ) : (
              <div className="py-12 text-center text-muted-foreground px-6">No route revenue data available</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
