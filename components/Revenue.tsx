import React, { useState } from 'react';
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
  Receipt
} from 'lucide-react';
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
  Legend,
  Pie
} from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { revenueData } from './constants/mockData';
import { formatCurrency } from './utils/helpers';

// Generate daily data from monthly data
const generateDailyData = () => {
  const days = [];
  for (let i = 1; i <= 30; i++) {
    days.push({
      period: `Day ${i}`,
      totalRevenue: Math.floor(Math.random() * 8000) + 2000,
      tripRevenue: Math.floor(Math.random() * 7500) + 1800,
      penalties: Math.floor(Math.random() * 500) + 100,
      fuelCosts: Math.floor(Math.random() * 3000) + 1000,
      maintenanceCosts: Math.floor(Math.random() * 800) + 200,
      profit: Math.floor(Math.random() * 4000) + 1000,
      tripCount: Math.floor(Math.random() * 50) + 20,
      avgFarePerTrip: 45 + Math.floor(Math.random() * 20)
    });
  }
  return days;
};

// Generate quarterly data from monthly data
const generateQuarterlyData = () => {
  const quarters = ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'];
  return quarters.map((quarter, index) => {
    const baseRevenue = 400000 + (index * 50000);
    return {
      period: quarter,
      totalRevenue: baseRevenue + Math.floor(Math.random() * 100000),
      tripRevenue: baseRevenue * 0.9,
      penalties: Math.floor(Math.random() * 20000) + 15000,
      fuelCosts: Math.floor(Math.random() * 150000) + 120000,
      maintenanceCosts: Math.floor(Math.random() * 60000) + 40000,
      profit: Math.floor(Math.random() * 200000) + 150000,
      tripCount: Math.floor(Math.random() * 2000) + 7000,
      avgFarePerTrip: 45 + Math.floor(Math.random() * 15)
    };
  });
};

// Additional revenue data
const stationRevenue = [
  { name: 'Accra Central', revenue: 245000, percentage: 35 },
  { name: 'Kumasi Main', revenue: 196000, percentage: 28 },
  { name: 'Cape Coast', revenue: 140000, percentage: 20 },
  { name: 'Takoradi Port', revenue: 84000, percentage: 12 },
  { name: 'Others', revenue: 35000, percentage: 5 }
];

const routeRevenue = [
  { route: 'Accra → Kumasi', revenue: 156000, trips: 320, avgFare: 45 },
  { route: 'Accra → Cape Coast', revenue: 98000, trips: 280, avgFare: 35 },
  { route: 'Kumasi → Tamale', revenue: 78000, trips: 120, avgFare: 65 },
  { route: 'Accra → Takoradi', revenue: 72000, trips: 180, avgFare: 40 },
  { route: 'Cape Coast → Takoradi', revenue: 45000, trips: 150, avgFare: 30 }
];

const paymentMethods = [
  { name: 'Cash', value: 65, color: '#0088FE' },
  { name: 'Mobile Money', value: 25, color: '#00C49F' },
  { name: 'Bank Card', value: 8, color: '#FFBB28' },
  { name: 'Bank Transfer', value: 2, color: '#FF8042' }
];

export function Revenue() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  // Check if user has permission to view revenue
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin' && user.role !== 'regional_manager')) {
    return (
      <div className="p-6 text-center">
        <DollarSign className="h-16 w-16 mx-auto mb-4 text-gray-400" />
        <h2 className="text-2xl font-bold text-gray-600 mb-2">Access Restricted</h2>
        <p className="text-gray-500">Only administrators and managers can access revenue reports.</p>
      </div>
    );
  }

  // Safely get current data with fallbacks
  const getCurrentData = () => {
    try {
      switch (selectedPeriod) {
        case 'daily': 
          return generateDailyData();
        case 'quarterly': 
          return generateQuarterlyData();
        default: 
          // Use the monthly revenue data from mockData, ensure it's an array
          return Array.isArray(revenueData) ? revenueData : [];
      }
    } catch (error) {
      console.error('Error getting revenue data:', error);
      return [];
    }
  };

  const currentData = getCurrentData();

  // Safe calculations with fallbacks
  const totalRevenue = currentData && currentData.length > 0 
    ? currentData.reduce((sum, item) => sum + (item.totalRevenue || 0), 0)
    : 0;

  const totalTrips = currentData && currentData.length > 0 
    ? currentData.reduce((sum, item) => sum + (item.tripCount || 0), 0)
    : 0;

  const totalPassengers = currentData && currentData.length > 0 
    ? currentData.reduce((sum, item) => sum + ((item.tripCount || 0) * 15), 0) // Estimate 15 passengers per trip
    : 0;

  const avgRevenuePerTrip = totalTrips > 0 ? totalRevenue / totalTrips : 0;

  // Prepare chart data
  const chartData = currentData.map(item => ({
    name: item.period,
    revenue: item.totalRevenue || 0,
    profit: item.profit || 0,
    costs: (item.fuelCosts || 0) + (item.maintenanceCosts || 0)
  }));

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
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Custom Period
          </Button>
        </div>
      </div>

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
                <div className="flex items-center text-sm text-green-600">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +12.5% vs last period
                </div>
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
                <div className="flex items-center text-sm text-green-600">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +8.3% vs last period
                </div>
              </div>
              <Route className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Revenue/Trip</p>
                <p className="text-2xl font-bold">{formatCurrency(Math.round(avgRevenuePerTrip))}</p>
                <div className="flex items-center text-sm text-green-600">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +3.8% vs last period
                </div>
              </div>
              <Receipt className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Passengers</p>
                <p className="text-2xl font-bold">{totalPassengers.toLocaleString()}</p>
                <div className="flex items-center text-sm text-red-600">
                  <TrendingDown className="h-4 w-4 mr-1" />
                  -2.1% vs last period
                </div>
              </div>
              <CreditCard className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Analytics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Revenue Analytics</CardTitle>
            <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <TabsList>
                <TabsTrigger value="daily">Daily</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium mb-4">Revenue Trend</h4>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsLineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      formatCurrency(Number(value)), 
                      name === 'revenue' ? 'Revenue' : name === 'profit' ? 'Profit' : 'Costs'
                    ]} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#8884d8" 
                    strokeWidth={3}
                    name="Revenue"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    name="Profit"
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-4">Payment Methods Distribution</h4>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={paymentMethods}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Station Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Station Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium mb-4">Revenue by Station</h4>
              <ResponsiveContainer width="100%" height={250}>
                <RechartsBarChart data={stationRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} />
                  <Bar dataKey="revenue" fill="#8884d8" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Top Performing Stations</h4>
              {stationRevenue.slice(0, 3).map((station, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{station.name}</p>
                    <p className="text-sm text-muted-foreground">{station.percentage}% of total</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(station.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Route Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Route className="h-5 w-5" />
            <span>Top Routes by Revenue</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}