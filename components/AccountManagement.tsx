import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Target,
  Wallet,
  PieChart,
  Building2,
  Users,
  MapPin,
  FileText,
  BarChart3
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner';

// Import types and constants
import { 
  RevenueSource, 
  Transaction, 
  Budget, 
  NewTransactionForm, 
  NewRevenueSourceForm 
} from './AccountManagement/types';
import { 
  DEFAULT_NEW_TRANSACTION, 
  DEFAULT_NEW_REVENUE_SOURCE 
} from './AccountManagement/constants';
import { 
  getMockRevenueSources, 
  getMockTransactions, 
  getMockBudgets, 
  getMockMonthlyTrends 
} from './AccountManagement/mockData';
import { 
  formatCurrency, 
  calculateStats, 
  getExpenseBreakdown, 
  filterTransactions,
  generateTransactionId,
  generateRevenueSourceId,
  validateTransactionForm,
  validateRevenueSourceForm,
  getStatusBadge
} from './AccountManagement/utils';

// Import components
import { OverviewSection } from './AccountManagement/components/OverviewSection';
import { TransactionsSection } from './AccountManagement/components/TransactionsSection';
import { AccountDialogs } from './AccountManagement/components/AccountDialogs';

export function AccountManagement() {
  const { user, hasPermission, isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [revenueSources, setRevenueSources] = useState<RevenueSource[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [showAddTransactionDialog, setShowAddTransactionDialog] = useState(false);
  const [showAddRevenueSourceDialog, setShowAddRevenueSourceDialog] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [newTransaction, setNewTransaction] = useState<NewTransactionForm>(DEFAULT_NEW_TRANSACTION);
  const [newRevenueSource, setNewRevenueSource] = useState<NewRevenueSourceForm>(DEFAULT_NEW_REVENUE_SOURCE);

  // Initialize mock data
  useEffect(() => {
    setRevenueSources(getMockRevenueSources());
    setTransactions(getMockTransactions(user?.id));
    setBudgets(getMockBudgets());
  }, [user?.id]);

  // Calculate statistics
  const stats = calculateStats(transactions);
  const enhancedStats = {
    ...stats,
    totalBudget: budgets.reduce((sum, b) => sum + b.allocatedAmount, 0),
    totalSpent: budgets.reduce((sum, b) => sum + b.spentAmount, 0),
    budgetUtilization: budgets.reduce((sum, b) => sum + b.allocatedAmount, 0) > 0 
      ? (budgets.reduce((sum, b) => sum + b.spentAmount, 0) / budgets.reduce((sum, b) => sum + b.allocatedAmount, 0)) * 100 
      : 0
  };

  // Get chart data
  const expenseBreakdown = getExpenseBreakdown(transactions);
  const monthlyTrends = getMockMonthlyTrends();
  const filteredTransactions = filterTransactions(transactions, searchQuery, filterStatus, filterCategory);

  // Handle new transaction creation
  const handleAddTransaction = () => {
    if (!validateTransactionForm(newTransaction)) {
      toast.error('Please fill in all required fields');
      return;
    }

    const transaction: Transaction = {
      id: generateTransactionId(transactions),
      type: newTransaction.type,
      category: newTransaction.category,
      subcategory: newTransaction.subcategory || undefined,
      amount: parseFloat(newTransaction.amount),
      description: newTransaction.description,
      source: newTransaction.type === 'revenue' ? newTransaction.source : undefined,
      recipient: newTransaction.type === 'expense' ? newTransaction.recipient : undefined,
      date: newTransaction.date,
      status: 'pending',
      tags: newTransaction.tags,
      createdBy: user?.id || 'admin',
      createdAt: new Date().toISOString()
    };

    setTransactions([...transactions, transaction]);
    setNewTransaction(DEFAULT_NEW_TRANSACTION);
    setShowAddTransactionDialog(false);
    toast.success('Transaction added successfully');
  };

  // Handle new revenue source creation
  const handleAddRevenueSource = () => {
    if (!validateRevenueSourceForm(newRevenueSource)) {
      toast.error('Please fill in all required fields');
      return;
    }

    const revenueSource: RevenueSource = {
      id: generateRevenueSourceId(revenueSources.length),
      name: newRevenueSource.name,
      type: newRevenueSource.type,
      region: newRevenueSource.region,
      district: newRevenueSource.district || undefined,
      contactPerson: newRevenueSource.contactPerson,
      phone: newRevenueSource.phone,
      totalContribution: 0,
      monthlyTarget: parseFloat(newRevenueSource.monthlyTarget),
      status: 'active',
      lastPayment: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    setRevenueSources([...revenueSources, revenueSource]);
    setNewRevenueSource(DEFAULT_NEW_REVENUE_SOURCE);
    setShowAddRevenueSourceDialog(false);
    toast.success('Revenue source added successfully');
  };

  // Check permissions
  const canManageAccounts = isSuperAdmin() || hasPermission('manage_finances') || hasPermission('view_revenue');
  const canEdit = (transaction: Transaction, userId?: string, isSuperAdmin?: boolean) => 
    isSuperAdmin || transaction.createdBy === userId;

  if (!canManageAccounts) {
    return (
      <div className="p-6 text-center">
        <DollarSign className="h-16 w-16 mx-auto mb-4 text-gray-400" />
        <h2 className="text-2xl font-bold text-gray-600 mb-2">Access Restricted</h2>
        <p className="text-gray-500">You need appropriate permissions to access account management.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            Account Management
          </h1>
          <p className="text-muted-foreground">
            Manage revenue streams and expense tracking across all RISE operations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Dialog open={showAddTransactionDialog} onOpenChange={setShowAddTransactionDialog}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Transaction
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Hero Image */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0">
          <ImageWithFallback 
            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaW5hbmNpYWwlMjBkYXNoYm9hcmQlMjBtb25leSUyMG1hbmFnZW1lbnR8ZW58MXx8fHwxNzU1NjMyOTExfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Financial Dashboard"
            className="w-full h-32 object-cover opacity-20"
          />
        </div>
        <CardContent className="relative p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">Financial Overview</h2>
              <p className="text-muted-foreground">Track revenue, expenses, and budget utilization across all operations</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(enhancedStats.totalProfit)}</div>
              <div className="text-sm text-muted-foreground">Total Profit</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(enhancedStats.monthlyRevenue)}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12% from last month
                </p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Expenses</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(enhancedStats.monthlyExpenses)}</p>
                <p className="text-xs text-red-600 flex items-center mt-1">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  -5% from last month
                </p>
              </div>
              <ArrowDownRight className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Profit</p>
                <p className={`text-2xl font-bold ${enhancedStats.monthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(enhancedStats.monthlyProfit)}
                </p>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  <Target className="h-3 w-3 mr-1" />
                  Budget target: ₵20,000
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Budget Utilization</p>
                <p className="text-2xl font-bold text-blue-600">{enhancedStats.budgetUtilization.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  <Wallet className="h-3 w-3 mr-1" />
                  {formatCurrency(enhancedStats.totalSpent)} of {formatCurrency(enhancedStats.totalBudget)}
                </p>
              </div>
              <PieChart className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Sources</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <OverviewSection 
            stats={enhancedStats}
            monthlyTrends={monthlyTrends}
            expenseBreakdown={expenseBreakdown}
            recentTransactions={transactions}
          />
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <TransactionsSection
            transactions={filteredTransactions}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            onSelectTransaction={setSelectedTransaction}
            canEdit={canEdit}
            userId={user?.id}
            isSuperAdmin={isSuperAdmin()}
          />
        </TabsContent>

        {/* Revenue Sources Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Revenue Sources</h3>
            <Dialog open={showAddRevenueSourceDialog} onOpenChange={setShowAddRevenueSourceDialog}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Revenue Source
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {revenueSources.map((source) => (
              <Card key={source.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {source.type === 'station' && <Building2 className="h-4 w-4 text-blue-600" />}
                      {source.type === 'union' && <Users className="h-4 w-4 text-purple-600" />}
                      {source.type === 'region' && <MapPin className="h-4 w-4 text-green-600" />}
                      {source.type === 'district' && <Building2 className="h-4 w-4 text-orange-600" />}
                      <span className="text-sm font-medium capitalize">{source.type}</span>
                    </div>
                    {getStatusBadge(source.status)}
                  </div>
                  
                  <h4 className="font-medium mb-2">{source.name}</h4>
                  <p className="text-sm text-muted-foreground mb-3">{source.region}{source.district && ` - ${source.district}`}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Contribution:</span>
                      <span className="font-medium text-green-600">{formatCurrency(source.totalContribution)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly Target:</span>
                      <span className="font-medium">{formatCurrency(source.monthlyTarget)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Payment:</span>
                      <span>{new Date(source.lastPayment).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Contact: {source.contactPerson}</span>
                      <span>{source.phone}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Other tabs content would go here - simplified for now */}
        <TabsContent value="budgets">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">Budget Management</h3>
            <p className="text-muted-foreground">Budget management features coming soon...</p>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">Financial Analytics</h3>
            <p className="text-muted-foreground">Advanced analytics features coming soon...</p>
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div>
                    <h4 className="font-medium">Financial Summary Report</h4>
                    <p className="text-sm text-muted-foreground">Complete financial overview</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <BarChart3 className="h-8 w-8 text-green-600" />
                  <div>
                    <h4 className="font-medium">Revenue Analysis</h4>
                    <p className="text-sm text-muted-foreground">Detailed revenue breakdown</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Target className="h-8 w-8 text-purple-600" />
                  <div>
                    <h4 className="font-medium">Budget Performance</h4>
                    <p className="text-sm text-muted-foreground">Budget vs actual analysis</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AccountDialogs
        showAddTransactionDialog={showAddTransactionDialog}
        setShowAddTransactionDialog={setShowAddTransactionDialog}
        newTransaction={newTransaction}
        setNewTransaction={setNewTransaction}
        onAddTransaction={handleAddTransaction}
        showAddRevenueSourceDialog={showAddRevenueSourceDialog}
        setShowAddRevenueSourceDialog={setShowAddRevenueSourceDialog}
        newRevenueSource={newRevenueSource}
        setNewRevenueSource={setNewRevenueSource}
        onAddRevenueSource={handleAddRevenueSource}
      />
    </div>
  );
}