import React, { useState } from 'react';
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
  LineChart
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
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
  Legend
} from 'recharts';

// Mock data for dashboard
const adminStats = {
  totalUsers: 45,
  totalStations: 12,
  totalVehicles: 234,
  totalTrips: 1456,
  monthlyRevenue: 45670,
  activeIncidents: 3
};

const workerStats = {
  stationVehicles: 18,
  todayTrips: 24,
  completedTrips: 156,
  stationRevenue: 12450,
  activeDrivers: 15,
  pendingMaintenance: 2
};

// Mock analytics data
const dailyData = [
  { name: 'Mon', trips: 45, revenue: 2300, passengers: 340 },
  { name: 'Tue', trips: 52, revenue: 2650, passengers: 385 },
  { name: 'Wed', trips: 48, revenue: 2400, passengers: 360 },
  { name: 'Thu', trips: 61, revenue: 3100, passengers: 425 },
  { name: 'Fri', trips: 58, revenue: 2950, passengers: 410 },
  { name: 'Sat', trips: 72, revenue: 3800, passengers: 520 },
  { name: 'Sun', trips: 65, revenue: 3400, passengers: 485 }
];

const monthlyData = [
  { name: 'Jan', trips: 1240, revenue: 62000, passengers: 8900 },
  { name: 'Feb', trips: 1180, revenue: 59000, passengers: 8500 },
  { name: 'Mar', trips: 1350, revenue: 67500, passengers: 9800 },
  { name: 'Apr', trips: 1420, revenue: 71000, passengers: 10200 },
  { name: 'May', trips: 1380, revenue: 69000, passengers: 9950 },
  { name: 'Jun', trips: 1450, revenue: 72500, passengers: 10400 },
  { name: 'Jul', trips: 1520, revenue: 76000, passengers: 10800 },
  { name: 'Aug', trips: 1480, revenue: 74000, passengers: 10600 },
  { name: 'Sep', trips: 1390, revenue: 69500, passengers: 10000 },
  { name: 'Oct', trips: 1460, revenue: 73000, passengers: 10500 },
  { name: 'Nov', trips: 1510, revenue: 75500, passengers: 10850 },
  { name: 'Dec', trips: 1580, revenue: 79000, passengers: 11200 }
];

const yearlyData = [
  { name: '2020', trips: 14500, revenue: 725000, passengers: 104000 },
  { name: '2021', trips: 12800, revenue: 640000, passengers: 92000 },
  { name: '2022', trips: 15200, revenue: 760000, passengers: 109000 },
  { name: '2023', trips: 16800, revenue: 840000, passengers: 120000 },
  { name: '2024', trips: 17260, revenue: 863000, passengers: 124000 }
];

const regionData = [
  { name: 'Greater Accra', value: 35, color: '#0088FE' },
  { name: 'Ashanti', value: 28, color: '#00C49F' },
  { name: 'Western', value: 15, color: '#FFBB28' },
  { name: 'Central', value: 12, color: '#FF8042' },
  { name: 'Others', value: 10, color: '#8884d8' }
];

const recentActivities = [
  { id: 1, type: 'trip', message: 'New trip booked: Accra to Kumasi', time: '2 minutes ago' },
  { id: 2, type: 'incident', message: 'Vehicle breakdown reported on N1 Highway', time: '15 minutes ago' },
  { id: 3, type: 'driver', message: 'New driver registered: Kwaku Boateng', time: '1 hour ago' },
  { id: 4, type: 'maintenance', message: 'Vehicle GV-123-20 maintenance completed', time: '2 hours ago' }
];

export function Dashboard() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('daily');
  const isAdmin = user?.role === 'admin';

  const StatCard = ({ title, value, icon: Icon, change, trend }: {
    title: string;
    value: string | number;
    icon: any;
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

  const getChartData = () => {
    switch (selectedPeriod) {
      case 'monthly': return monthlyData;
      case 'yearly': return yearlyData;
      default: return dailyData;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user?.name}</h1>
        <p className="text-gray-600">
          {isAdmin 
            ? 'Here\'s what\'s happening across all RISE stations today.' 
            : `Managing ${user?.stationName} - here's your station overview.`
          }
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isAdmin ? (
          <>
            <StatCard
              title="Total Users"
              value={adminStats.totalUsers}
              icon={Users}
              change="+12% from last month"
              trend="up"
            />
            <StatCard
              title="Active Stations"
              value={adminStats.totalStations}
              icon={MapPin}
              change="+2 new stations"
              trend="up"
            />
            <StatCard
              title="Fleet Vehicles"
              value={adminStats.totalVehicles}
              icon={Bus}
              change="+8% this month"
              trend="up"
            />
            <StatCard
              title="Monthly Revenue"
              value={`₵${adminStats.monthlyRevenue.toLocaleString()}`}
              icon={DollarSign}
              change="+15% vs last month"
              trend="up"
            />
          </>
        ) : (
          <>
            <StatCard
              title="Station Vehicles"
              value={workerStats.stationVehicles}
              icon={Bus}
              change="2 in maintenance"
            />
            <StatCard
              title="Today's Trips"
              value={workerStats.todayTrips}
              icon={Route}
              change="+3 from yesterday"
              trend="up"
            />
            <StatCard
              title="Active Drivers"
              value={workerStats.activeDrivers}
              icon={Users}
              change="All available"
              trend="up"
            />
            <StatCard
              title="Station Revenue"
              value={`₵${workerStats.stationRevenue.toLocaleString()}`}
              icon={DollarSign}
              change="+8% this week"
              trend="up"
            />
          </>
        )}
      </div>

      {/* Analytics Charts (Admin Only) */}
      {isAdmin && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Analytics Overview</span>
                </CardTitle>
                <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <TabsList>
                    <TabsTrigger value="daily">Daily</TabsTrigger>
                    <TabsTrigger value="monthly">Monthly</TabsTrigger>
                    <TabsTrigger value="yearly">Yearly</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Trips and Revenue Chart */}
                <div>
                  <h4 className="text-sm font-medium mb-4">Trips & Revenue</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsLineChart data={getChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Line 
                        yAxisId="left" 
                        type="monotone" 
                        dataKey="trips" 
                        stroke="#8884d8" 
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

                {/* Passenger Traffic */}
                <div>
                  <h4 className="text-sm font-medium mb-4">Passenger Traffic</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsBarChart data={getChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="passengers" fill="#8884d8" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Regional Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChart className="h-5 w-5" />
                <span>Regional Distribution</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Tooltip />
                    <Legend />
                    <RechartsPieChart dataKey="value">
                      {regionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </RechartsPieChart>
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {regionData.map((region, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: region.color }}
                        />
                        <span className="text-sm">{region.name}</span>
                      </div>
                      <span className="text-sm font-medium">{region.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isAdmin ? (
              <>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium">Add New Station</p>
                    <p className="text-sm text-gray-600">Register a new transport station</p>
                  </div>
                  <MapPin className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium">Manage Users</p>
                    <p className="text-sm text-gray-600">Add or update user accounts</p>
                  </div>
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div>
                    <p className="font-medium">View Reports</p>
                    <p className="text-sm text-gray-600">Generate system-wide reports</p>
                  </div>
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium">Book New Trip</p>
                    <p className="text-sm text-gray-600">Schedule a new passenger trip</p>
                  </div>
                  <Route className="h-5 w-5 text-blue-600" />
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

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {activity.type === 'incident' && (
                      <div className="p-2 bg-red-100 rounded-full">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      </div>
                    )}
                    {activity.type === 'trip' && (
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Route className="h-4 w-4 text-blue-600" />
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
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status (Admin only) */}
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
                  <p className="font-medium text-yellow-900">3 Active Incidents</p>
                  <p className="text-sm text-yellow-700">Requires attention</p>
                </div>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  Warning
                </Badge>
              </div>
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium text-blue-900">Database Backup</p>
                  <p className="text-sm text-blue-700">Last backup: 2 hours ago</p>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
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