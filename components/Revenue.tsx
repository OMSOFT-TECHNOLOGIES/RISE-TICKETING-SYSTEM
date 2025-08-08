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
  Legend
} from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { revenueData } from './constants/mockData';
import { formatCurrency } from './utils/helpers';

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

  if (user?.role !== 'admin') {
    return (
      <div className="p-6 text-center">
        <DollarSign className="h-16 w-16 mx-auto mb-4 text-gray-400" />
        <h2 className="text-2xl font-bold text-gray-600 mb-2">Access Restricted</h2>
        <p className="text-gray-500">Only administrators can access revenue reports.</p>
      </div>
    );
  }

  const getCurrentData = () => {
    switch (selectedPeriod) {
      case 'daily': return revenueData.daily;
      case 'quarterly': return revenueData.quarterly;
      default: return revenueData.monthly;
    }
  };

  const currentData = getCurrentData();
  const totalRevenue = currentData.reduce((sum, item) => sum + item.revenue, 0);
  const totalTrips = currentData.reduce((sum, item) => sum + item.trips, 0);
  const totalPassengers = currentData.reduce((sum, item) => sum + item.passengers, 0);
  const avgRevenuePerTrip = totalRevenue / totalTrips;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Revenue Management</h1>
          <p className="text-gray-600">Comprehensive revenue tracking and financial analytics</p>
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
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
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
                <p className="text-sm font-medium text-gray-600">Total Trips</p>
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
                <p className="text-sm font-medium text-gray-600">Avg Revenue/Trip</p>
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
                <p className="text-sm font-medium text-gray-600">Total Passengers</p>
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
                <RechartsLineChart data={currentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#8884d8" 
                    strokeWidth={3}
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-4">Payment Methods</h4>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                  <Legend />
                  <RechartsPieChart dataKey="value" data={paymentMethods}>
                    {paymentMethods.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </RechartsPieChart>
                </RechartsPieChart>
              </ResponsiveContainer>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {routeRevenue.map((route, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{route.route}</TableCell>
                  <TableCell>{formatCurrency(route.revenue)}</TableCell>
                  <TableCell>{route.trips}</TableCell>
                  <TableCell>{formatCurrency(route.avgFare)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}