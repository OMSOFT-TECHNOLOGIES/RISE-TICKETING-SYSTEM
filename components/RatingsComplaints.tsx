import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { useAuth } from './AuthContext';
import { 
  Star,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Download,
  Eye,
  Reply,
  Calendar,
  BarChart3,
  ThumbsUp,
  ThumbsDown,
  Send
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Progress } from './ui/progress';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { toast } from 'sonner';

// Mock data for ratings and complaints
const mockRatings = [
  {
    id: 'R001',
    ticketId: 'TKT001',
    tripId: 'TRP001',
    passengerName: 'John Doe',
    passengerPhone: '+233 24 111 1111',
    route: 'Accra Central → Kumasi Main',
    vehicle: 'GV-123-20',
    driver: 'Kwame Asante',
    rating: 4,
    ratingDate: '2024-01-20T13:00:00',
    stationId: 'STA001',
    stationName: 'Accra Central Station'
  },
  {
    id: 'R002',
    ticketId: 'TKT003',
    tripId: 'TRP002',
    passengerName: 'Kwaku Mensah',
    passengerPhone: '+233 27 333 3333',
    route: 'Accra Central → Cape Coast',
    vehicle: 'GV-456-21',
    driver: 'Ama Osei',
    rating: 2,
    ratingDate: '2024-01-18T13:30:00',
    stationId: 'STA001',
    stationName: 'Accra Central Station'
  }
];

const mockComplaints = [
  {
    id: 'CMP001',
    ticketId: 'TKT003',
    tripId: 'TRP002',
    passengerName: 'Kwaku Mensah',
    passengerPhone: '+233 27 333 3333',
    passengerEmail: 'kwaku.mensah@email.com',
    route: 'Accra Central → Cape Coast',
    vehicle: 'GV-456-21',
    driver: 'Ama Osei',
    category: 'vehicle_condition',
    description: 'Air conditioning was not working during the trip. Very uncomfortable journey.',
    submittedDate: '2024-01-18T13:30:00',
    status: 'pending',
    priority: 'medium',
    stationId: 'STA001',
    stationName: 'Accra Central Station',
    response: null,
    responseDate: null,
    respondedBy: null
  },
  {
    id: 'CMP002',
    ticketId: 'TKT004',
    tripId: 'TRP004',
    passengerName: 'Akosua Darko',
    passengerPhone: '+233 28 444 4444',
    passengerEmail: 'akosua.darko@email.com',
    route: 'Kumasi Main → Accra Central',
    vehicle: 'KU-789-19',
    driver: 'Kofi Mensah',
    category: 'trip_cancellation',
    description: 'Trip was cancelled last minute without proper notice. I had to make alternative arrangements.',
    submittedDate: '2024-01-25T12:00:00',
    status: 'resolved',
    priority: 'high',
    stationId: 'STA002',
    stationName: 'Kumasi Main Station',
    response: 'We apologize for the inconvenience. A full refund has been processed and you have been contacted by our customer service team.',
    responseDate: '2024-01-25T14:30:00',
    respondedBy: 'Admin User'
  },
  {
    id: 'CMP003',
    ticketId: 'TKT005',
    tripId: 'TRP003',
    passengerName: 'Samuel Adjei',
    passengerPhone: '+233 20 555 1234',
    passengerEmail: 'samuel.adjei@email.com',
    route: 'Takoradi → Accra Central',
    vehicle: 'GV-789-20',
    driver: 'Yaw Boateng',
    category: 'driver_behavior',
    description: 'Driver was speaking loudly on phone during the trip and driving recklessly.',
    submittedDate: '2024-01-22T16:45:00',
    status: 'in_progress',
    priority: 'high',
    stationId: 'STA003',
    stationName: 'Takoradi Port Station',
    response: null,
    responseDate: null,
    respondedBy: null
  }
];

// Analytics data
const ratingTrendsData = [
  { month: 'Jul', avgRating: 4.2, totalRatings: 45 },
  { month: 'Aug', avgRating: 4.0, totalRatings: 52 },
  { month: 'Sep', avgRating: 4.3, totalRatings: 48 },
  { month: 'Oct', avgRating: 4.1, totalRatings: 61 },
  { month: 'Nov', avgRating: 4.4, totalRatings: 55 },
  { month: 'Dec', avgRating: 4.2, totalRatings: 67 },
  { month: 'Jan', avgRating: 4.0, totalRatings: 43 }
];

const ratingDistributionData = [
  { rating: '5 Stars', count: 25, percentage: 35, color: '#22c55e' },
  { rating: '4 Stars', count: 30, percentage: 42, color: '#84cc16' },
  { rating: '3 Stars', count: 10, percentage: 14, color: '#eab308' },
  { rating: '2 Stars', count: 4, percentage: 6, color: '#f97316' },
  { rating: '1 Star', count: 2, percentage: 3, color: '#ef4444' }
];

const complaintCategoriesData = [
  { category: 'Vehicle Condition', count: 8, color: '#3b82f6' },
  { category: 'Driver Behavior', count: 5, color: '#ef4444' },
  { category: 'Delay/Schedule', count: 12, color: '#f59e0b' },
  { category: 'Trip Cancellation', count: 3, color: '#8b5cf6' },
  { category: 'Customer Service', count: 6, color: '#06b6d4' },
  { category: 'Other', count: 4, color: '#6b7280' }
];

const complaintCategories = [
  { value: 'vehicle_condition', label: 'Vehicle Condition' },
  { value: 'driver_behavior', label: 'Driver Behavior' },
  { value: 'delay', label: 'Delay/Schedule' },
  { value: 'trip_cancellation', label: 'Trip Cancellation' },
  { value: 'customer_service', label: 'Customer Service' },
  { value: 'pricing', label: 'Pricing/Billing' },
  { value: 'safety', label: 'Safety Concerns' },
  { value: 'other', label: 'Other' }
];

export function RatingsComplaints() {
  const { user } = useAuth();
  const [ratings] = useState(mockRatings);
  const [complaints, setComplaints] = useState(mockComplaints);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [dateRange, setDateRange] = useState('30');

  // Access control
  if (user?.role !== 'admin') {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
        <h2 className="text-2xl font-bold text-gray-600 mb-2">Access Restricted</h2>
        <p className="text-gray-500">Only administrators can access ratings and complaints management.</p>
      </div>
    );
  }

  // Filter complaints
  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = searchTerm === '' || 
      complaint.passengerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.route.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.ticketId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || complaint.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || complaint.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || complaint.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  // Calculate statistics
  const totalRatings = ratings.length;
  const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings;
  const totalComplaints = complaints.length;
  const pendingComplaints = complaints.filter(c => c.status === 'pending').length;
  const resolvedComplaints = complaints.filter(c => c.status === 'resolved').length;

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      in_progress: { color: 'bg-blue-100 text-blue-800', icon: AlertTriangle },
      resolved: { color: 'bg-green-100 text-green-800', icon: CheckCircle }
    };
    
    const config = configs[status as keyof typeof configs] || configs.pending;
    const IconComponent = config.icon;
    
    return (
      <Badge className={config.color}>
        <IconComponent className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={colors[priority as keyof typeof colors] || colors.medium}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-muted-foreground">{rating}</span>
      </div>
    );
  };

  const handleResponseSubmit = () => {
    if (!responseText.trim()) {
      toast.error('Please enter a response');
      return;
    }

    setComplaints(complaints.map(complaint => 
      complaint.id === selectedComplaint.id 
        ? {
            ...complaint,
            response: responseText,
            responseDate: new Date().toISOString(),
            respondedBy: user?.name || 'Admin',
            status: 'resolved'
          }
        : complaint
    ));

    setResponseText('');
    setShowResponseDialog(false);
    setSelectedComplaint(null);
    toast.success('Response sent successfully');
  };

  const exportData = (type: 'ratings' | 'complaints') => {
    const data = type === 'ratings' ? ratings : filteredComplaints;
    console.log(`Exporting ${type} data:`, data);
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} data exported successfully`);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Ratings & Complaints</h1>
        <p className="text-muted-foreground">
          Monitor customer feedback and manage complaints across all RISE stations
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ratings">Ratings</TabsTrigger>
          <TabsTrigger value="complaints">Complaints</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Average Rating</p>
                    <p className="text-2xl font-bold">{avgRating.toFixed(1)}</p>
                    <div className="flex items-center mt-1">
                      {renderStarRating(Math.round(avgRating))}
                    </div>
                  </div>
                  <Star className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Ratings</p>
                    <p className="text-2xl font-bold">{totalRatings}</p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +12% this month
                    </p>
                  </div>
                  <ThumbsUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Complaints</p>
                    <p className="text-2xl font-bold">{pendingComplaints}</p>
                    <p className="text-xs text-red-600 flex items-center mt-1">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Need attention
                    </p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Resolution Rate</p>
                    <p className="text-2xl font-bold">{Math.round((resolvedComplaints / totalComplaints) * 100)}%</p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {resolvedComplaints}/{totalComplaints} resolved
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Rating Distribution</CardTitle>
                <CardDescription>Breakdown of customer ratings</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={ratingDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ rating, percentage }) => `${rating}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {ratingDistributionData.map((entry, index) => (
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
                <CardTitle>Complaint Categories</CardTitle>
                <CardDescription>Most common complaint types</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={complaintCategoriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Ratings Tab */}
        <TabsContent value="ratings" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="ratings-search">Search Ratings</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="ratings-search"
                  placeholder="Search by passenger, route, or ticket..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={() => exportData('ratings')} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Ratings ({ratings.length})</CardTitle>
              <CardDescription>Customer ratings for completed trips</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Passenger</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ratings.map((rating) => (
                    <TableRow key={rating.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{rating.passengerName}</p>
                          <p className="text-sm text-muted-foreground">{rating.ticketId}</p>
                        </div>
                      </TableCell>
                      <TableCell>{rating.route}</TableCell>
                      <TableCell>{rating.vehicle}</TableCell>
                      <TableCell>{rating.driver}</TableCell>
                      <TableCell>{renderStarRating(rating.rating)}</TableCell>
                      <TableCell>
                        {new Date(rating.ratingDate).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Complaints Tab */}
        <TabsContent value="complaints" className="space-y-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="complaints-search">Search Complaints</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="complaints-search"
                  placeholder="Search complaints..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {complaintCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={() => exportData('complaints')} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Complaints ({filteredComplaints.length})</CardTitle>
              <CardDescription>Customer complaints requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Passenger</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComplaints.map((complaint) => (
                    <TableRow key={complaint.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{complaint.passengerName}</p>
                          <p className="text-sm text-muted-foreground">{complaint.route}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {complaintCategories.find(c => c.value === complaint.category)?.label}
                      </TableCell>
                      <TableCell>{getPriorityBadge(complaint.priority)}</TableCell>
                      <TableCell>{getStatusBadge(complaint.status)}</TableCell>
                      <TableCell>
                        {new Date(complaint.submittedDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedComplaint(complaint);
                              setShowResponseDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {complaint.status !== 'resolved' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedComplaint(complaint);
                                setShowResponseDialog(true);
                              }}
                            >
                              <Reply className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
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
          <Card>
            <CardHeader>
              <CardTitle>Rating Trends</CardTitle>
              <CardDescription>Average rating and volume over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={ratingTrendsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" domain={[0, 5]} />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="avgRating" 
                    stroke="#8884d8" 
                    strokeWidth={3}
                    name="Average Rating"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="totalRatings" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    name="Total Ratings"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Insights</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Customer Satisfaction</span>
                  <span className="font-bold">
                    {Math.round((ratings.filter(r => r.rating >= 4).length / ratings.length) * 100)}%
                  </span>
                </div>
                <Progress value={Math.round((ratings.filter(r => r.rating >= 4).length / ratings.length) * 100)} />

                <div className="flex justify-between items-center">
                  <span>Complaint Resolution Time</span>
                  <span className="font-bold">2.3 days</span>
                </div>
                <Progress value={85} />

                <div className="flex justify-between items-center">
                  <span>Response Rate</span>
                  <span className="font-bold">
                    {Math.round((resolvedComplaints / totalComplaints) * 100)}%
                  </span>
                </div>
                <Progress value={Math.round((resolvedComplaints / totalComplaints) * 100)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Issues</CardTitle>
                <CardDescription>Most common complaint categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {complaintCategoriesData.slice(0, 5).map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-sm">{category.category}</span>
                      </div>
                      <span className="font-bold">{category.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Complaint Response Dialog */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Complaint Details & Response</DialogTitle>
            <DialogDescription>
              Review complaint and provide response to customer
            </DialogDescription>
          </DialogHeader>
          {selectedComplaint && (
            <div className="space-y-6">
              {/* Complaint Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Passenger:</span>
                    <p>{selectedComplaint.passengerName}</p>
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span>
                    <p>{selectedComplaint.passengerPhone}</p>
                  </div>
                  <div>
                    <span className="font-medium">Route:</span>
                    <p>{selectedComplaint.route}</p>
                  </div>
                  <div>
                    <span className="font-medium">Category:</span>
                    <p>{complaintCategories.find(c => c.value === selectedComplaint.category)?.label}</p>
                  </div>
                </div>

                <div>
                  <span className="font-medium">Description:</span>
                  <p className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">
                    {selectedComplaint.description}
                  </p>
                </div>

                <div className="flex space-x-4">
                  {getPriorityBadge(selectedComplaint.priority)}
                  {getStatusBadge(selectedComplaint.status)}
                </div>
              </div>

              {/* Existing Response */}
              {selectedComplaint.response && (
                <div>
                  <span className="font-medium">Previous Response:</span>
                  <div className="mt-1 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm">{selectedComplaint.response}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Responded by {selectedComplaint.respondedBy} on{' '}
                      {new Date(selectedComplaint.responseDate).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Response Form */}
              {selectedComplaint.status !== 'resolved' && (
                <div className="space-y-4">
                  <Label htmlFor="response">Your Response</Label>
                  <Textarea
                    id="response"
                    placeholder="Provide a detailed response to address the customer's concern..."
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    rows={4}
                  />
                  <div className="flex space-x-2">
                    <Button onClick={handleResponseSubmit} className="flex-1">
                      <Send className="h-4 w-4 mr-2" />
                      Send Response
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowResponseDialog(false)}
                      className="flex-1"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}