import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useAuth } from './AuthContext';
import { 
  Users, 
  MapPin, 
  Bus, 
  Route, 
  TrendingUp, 
  AlertTriangle,
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  Loader2
} from 'lucide-react';
import { Badge } from './ui/badge';
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
  Pie,
  Cell,
  Legend
} from 'recharts';
import { dashboardApi, parseListResponse } from './utils/api';
import { UserActivityPanel } from './Dashboard/UserActivityPanel';

const REGION_COLORS = ['#193cb8', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

type ChartPoint = { name: string; trips: number; revenue: number; passengers: number };
type RegionPoint = { name: string; value: number; color?: string };
type ActivityItem = { id: string | number; type: string; message: string; time: string };

function extractChartData(data: unknown): ChartPoint[] {
  if (Array.isArray(data)) return data as ChartPoint[];
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    const points = record.points ?? record.data ?? record.chart;
    if (Array.isArray(points)) return points as ChartPoint[];
  }
  return [];
}

function extractRegionData(data: unknown): RegionPoint[] {
  if (Array.isArray(data)) {
    return (data as RegionPoint[]).map((item, index) => ({
      ...item,
      color: item.color ?? REGION_COLORS[index % REGION_COLORS.length],
    }));
  }
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    const regions = record.regions ?? record.data;
    if (Array.isArray(regions)) {
      return (regions as RegionPoint[]).map((item, index) => ({
        ...item,
        color: item.color ?? REGION_COLORS[index % REGION_COLORS.length],
      }));
    }
  }
  return [];
}

export function Dashboard() {
  const { user, isSuperAdmin } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [regionData, setRegionData] = useState<RegionPoint[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadStats = async () => {
      setLoading(true);
      setStatsError(null);
      try {
        const response = isAdmin
          ? await dashboardApi.getAdmin(selectedPeriod)
          : await dashboardApi.getStation({ stationId: user?.stationId, period: selectedPeriod });

        if (!cancelled) {
          if (response.success && response.data) {
            setStats(response.data as Record<string, number>);
          } else {
            setStatsError(response.error ?? 'Failed to load dashboard stats');
            setStats(null);
          }
        }
      } catch {
        if (!cancelled) {
          setStatsError('Failed to load dashboard stats');
          setStats(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadStats();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, user?.stationId, selectedPeriod]);

  useEffect(() => {
    if (!isAdmin) {
      setChartsLoading(false);
      return;
    }

    let cancelled = false;

    const loadCharts = async () => {
      setChartsLoading(true);
      try {
        const [chartRes, regionRes] = await Promise.all([
          dashboardApi.getTripsRevenueChart({ period: selectedPeriod }),
          dashboardApi.getRegionsChart({ period: selectedPeriod }),
        ]);

        if (!cancelled) {
          if (chartRes.success) setChartData(extractChartData(chartRes.data));
          if (regionRes.success) setRegionData(extractRegionData(regionRes.data));
        }
      } finally {
        if (!cancelled) setChartsLoading(false);
      }
    };

    loadCharts();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, selectedPeriod]);

  useEffect(() => {
    let cancelled = false;

    const loadActivities = async () => {
      const response = await dashboardApi.getActivities({
        limit: 10,
        stationId: isAdmin ? undefined : user?.stationId,
      });

      if (!cancelled && response.success && response.data !== undefined) {
        setActivities(parseListResponse<ActivityItem>(response.data, 'activities'));
      }
    };

    loadActivities();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, user?.stationId]);

  const StatCard = ({ title, value, icon: Icon, change, trend }: {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    change?: string;
    trend?: 'up' | 'down';
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <div className={`text-xs flex items-center mt-1 ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            <TrendingUp className="h-3 w-3 mr-1" />
            {change}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
        <Loader2 className="h-8 w-8 animate-spin text-[#193cb8] mb-4" />
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user?.fullName}</h1>
        <p className="text-gray-600">
          {isAdmin 
            ? 'Here\'s what\'s happening across all RISE stations today.' 
            : `Managing ${user?.stationName} - here's your station overview.`
          }
        </p>
        {statsError && (
          <p className="text-sm text-red-600 mt-2">{statsError}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isAdmin ? (
          <>
            <StatCard title="Total Users" value={stats?.totalUsers ?? 0} icon={Users} />
            <StatCard title="Active Stations" value={stats?.totalStations ?? 0} icon={MapPin} />
            <StatCard title="Fleet Vehicles" value={stats?.totalVehicles ?? 0} icon={Bus} />
            <StatCard
              title="Monthly Revenue"
              value={`₵${(stats?.monthlyRevenue ?? 0).toLocaleString()}`}
              icon={DollarSign}
            />
          </>
        ) : (
          <>
            <StatCard title="Station Vehicles" value={stats?.stationVehicles ?? 0} icon={Bus} />
            <StatCard title="Today's Trips" value={stats?.todayTrips ?? 0} icon={Route} />
            <StatCard title="Active Drivers" value={stats?.activeDrivers ?? 0} icon={Users} />
            <StatCard
              title="Station Revenue"
              value={`₵${(stats?.stationRevenue ?? 0).toLocaleString()}`}
              icon={DollarSign}
            />
          </>
        )}
      </div>

      {isSuperAdmin() && <UserActivityPanel />}

      {isAdmin && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Analytics Overview</span>
                </CardTitle>
                <Tabs value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as typeof selectedPeriod)}>
                  <TabsList>
                    <TabsTrigger value="daily">Daily</TabsTrigger>
                    <TabsTrigger value="monthly">Monthly</TabsTrigger>
                    <TabsTrigger value="yearly">Yearly</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              {chartsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-[#193cb8]" />
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium mb-4">Trips & Revenue</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsLineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Line 
                          yAxisId="left" 
                          type="monotone" 
                          dataKey="trips" 
                          stroke="#193cb8" 
                          strokeWidth={2}
                          name="Trips"
                        />
                        <Line 
                          yAxisId="right" 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#82ca9d" 
                          strokeWidth={2}
                          name="Revenue (₵)"
                        />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-4">Passenger Traffic</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsBarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="passengers" fill="#193cb8" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChart className="h-5 w-5" />
                <span>Regional Distribution</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-[#193cb8]" />
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie data={regionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
                        {regionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color ?? REGION_COLORS[index % REGION_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  <div className="space-y-3">
                    {regionData.map((region, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: region.color ?? REGION_COLORS[index % REGION_COLORS.length] }}
                          />
                          <span className="text-sm">{region.name}</span>
                        </div>
                        <span className="text-sm font-medium">{region.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isAdmin ? (
              <>
                <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#193cb81a' }}>
                  <div>
                    <p className="font-medium">Add New Station</p>
                    <p className="text-sm text-gray-600">Register a new transport station</p>
                  </div>
                  <MapPin className="h-5 w-5" style={{ color: '#193cb8' }} />
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium">Manage Users</p>
                    <p className="text-sm text-gray-600">Add or update user accounts</p>
                  </div>
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#193cb81a' }}>
                  <div>
                    <p className="font-medium">View Reports</p>
                    <p className="text-sm text-gray-600">Generate system-wide reports</p>
                  </div>
                  <Calendar className="h-5 w-5" style={{ color: '#193cb8' }} />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#193cb81a' }}>
                  <div>
                    <p className="font-medium">Book New Trip</p>
                    <p className="text-sm text-gray-600">Schedule a new passenger trip</p>
                  </div>
                  <Route className="h-5 w-5" style={{ color: '#193cb8' }} />
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium">Register Vehicle</p>
                    <p className="text-sm text-gray-600">Add new vehicle to your station</p>
                  </div>
                  <Bus className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div>
                    <p className="font-medium">Generate Report</p>
                    <p className="text-sm text-gray-600">Create station performance report</p>
                  </div>
                  <Calendar className="h-5 w-5 text-orange-600" />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
              ) : (
                activities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {activity.type === 'incident' && (
                        <div className="p-2 bg-red-100 rounded-full">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        </div>
                      )}
                      {activity.type === 'trip' && (
                        <div className="p-2 rounded-full" style={{ backgroundColor: '#193cb833' }}>
                          <Route className="h-4 w-4" style={{ color: '#193cb8' }} />
                        </div>
                      )}
                      {activity.type === 'driver' && (
                        <div className="p-2 bg-green-100 rounded-full">
                          <Users className="h-4 w-4 text-green-600" />
                        </div>
                      )}
                      {activity.type === 'maintenance' && (
                        <div className="p-2 bg-orange-100 rounded-full">
                          <Bus className="h-4 w-4 text-orange-600" />
                        </div>
                      )}
                      {!['incident', 'trip', 'driver', 'maintenance'].includes(activity.type) && (
                        <div className="p-2 bg-gray-100 rounded-full">
                          <Calendar className="h-4 w-4 text-gray-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{activity.message}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-green-900">All Systems Operational</p>
                  <p className="text-sm text-green-700">Last updated: 5 minutes ago</p>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Online
                </Badge>
              </div>
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div>
                  <p className="font-medium text-yellow-900">
                    {stats?.activeIncidents ?? 0} Active Incidents
                  </p>
                  <p className="text-sm text-yellow-700">Requires attention</p>
                </div>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  Warning
                </Badge>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: '#193cb81a' }}>
                <div>
                  <p className="font-medium" style={{ color: '#193cb8' }}>Database Backup</p>
                  <p className="text-sm" style={{ color: '#193cb8' }}>Last backup: 2 hours ago</p>
                </div>
                <Badge variant="secondary" style={{ backgroundColor: '#193cb833', color: '#193cb8' }}>
                  Scheduled
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
