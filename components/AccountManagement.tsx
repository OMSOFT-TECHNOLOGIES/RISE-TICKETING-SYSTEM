import React, { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useAuth } from './AuthContext';
import { AccessRestricted } from './AccessRestricted';
import { notify } from './utils/notify';
import { accountApi } from './utils/api';
import { parseListResponse } from './utils/api/client';
import type {
  Budget,
  ChartDataPoint,
  NewRevenueSourceForm,
  NewTransactionForm,
  RevenueSource,
  Transaction,
} from './AccountManagement/types';
import {
  ACCOUNT_TAB_TRIGGER_CLASS,
  DEFAULT_NEW_REVENUE_SOURCE,
  DEFAULT_NEW_TRANSACTION,
} from './AccountManagement/constants';
import {
  calculateStats,
  filterTransactions,
  validateRevenueSourceForm,
  validateTransactionForm,
  getExpenseBreakdown,
} from './AccountManagement/utils';
import { AccountCommandHeader } from './AccountManagement/components/AccountCommandHeader';
import { AccountKpiDashboard } from './AccountManagement/components/AccountKpiDashboard';
import { OverviewSection } from './AccountManagement/components/OverviewSection';
import { TransactionsSection } from './AccountManagement/components/TransactionsSection';
import { RevenueSourcesSection } from './AccountManagement/components/RevenueSourcesSection';
import { BudgetsSection } from './AccountManagement/components/BudgetsSection';
import { ReportsSection } from './AccountManagement/components/ReportsSection';
import { AccountDialogs } from './AccountManagement/components/AccountDialogs';

export function AccountManagement() {
  const { user, hasPermission, isSuperAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [revenueSources, setRevenueSources] = useState<RevenueSource[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<ChartDataPoint[]>([]);
  const [apiExpenseBreakdown, setApiExpenseBreakdown] = useState<ChartDataPoint[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddTransactionDialog, setShowAddTransactionDialog] = useState(false);
  const [showAddRevenueSourceDialog, setShowAddRevenueSourceDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [newTransaction, setNewTransaction] = useState<NewTransactionForm>(DEFAULT_NEW_TRANSACTION);
  const [newRevenueSource, setNewRevenueSource] = useState<NewRevenueSourceForm>(DEFAULT_NEW_REVENUE_SOURCE);

  const loadAccountData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [transactionsRes, revenueSourcesRes, budgetsRes, trendsRes, expenseRes, statsRes] =
        await Promise.all([
          accountApi.getTransactions({ limit: 500 }),
          accountApi.getRevenueSources(),
          accountApi.getBudgets(),
          accountApi.getTrends(),
          accountApi.getExpenseBreakdown('monthly'),
          accountApi.getStatistics('monthly'),
        ]);

      let loadError: string | null = null;

      if (transactionsRes.success && transactionsRes.data !== undefined) {
        setTransactions(parseListResponse<Transaction>(transactionsRes.data, 'transactions'));
      } else {
        loadError = transactionsRes.error || 'Failed to load transactions';
      }

      if (revenueSourcesRes.success && revenueSourcesRes.data !== undefined) {
        setRevenueSources(
          parseListResponse<RevenueSource>(revenueSourcesRes.data, 'revenueSources')
        );
      } else if (!loadError) {
        loadError = revenueSourcesRes.error || 'Failed to load revenue sources';
      }

      if (budgetsRes.success && budgetsRes.data !== undefined) {
        setBudgets(parseListResponse<Budget>(budgetsRes.data, 'budgets'));
      } else if (!loadError) {
        loadError = budgetsRes.error || 'Failed to load budgets';
      }

      if (trendsRes.success && trendsRes.data !== undefined) {
        const rawTrends = trendsRes.data as
          | ChartDataPoint[]
          | { trends?: ChartDataPoint[] }
          | Array<{ month: number | string; revenue: number; expense: number; profit?: number }>;
        if (Array.isArray(rawTrends)) {
          setMonthlyTrends(
            rawTrends.map((row) => ({
              month: String((row as { month?: number | string }).month ?? ''),
              revenue: Number((row as { revenue?: number }).revenue ?? 0),
              expenses: Number(
                (row as { expense?: number; expenses?: number }).expense ??
                  (row as { expenses?: number }).expenses ??
                  0
              ),
              profit: Number((row as { profit?: number }).profit ?? 0),
            }))
          );
        } else {
          setMonthlyTrends(rawTrends.trends ?? []);
        }
      }

      if (expenseRes.success && Array.isArray(expenseRes.data)) {
        setApiExpenseBreakdown(
          expenseRes.data.map((item, index) => {
            const row = item as { category?: string; amount?: number };
            return {
              name: String(row.category ?? 'Other'),
              value: Number(row.amount ?? 0),
              color: ['#193cb8', '#ef4444', '#f59e0b', '#22c55e', '#8b5cf6'][index % 5],
            };
          })
        );
      } else {
        setApiExpenseBreakdown(null);
      }

      if (statsRes.success && statsRes.data && typeof statsRes.data === 'object') {
        // Statistics available for future KPI overrides if ledger is empty
        void statsRes.data;
      }

      if (loadError) {
        setError(loadError);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load account data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccountData();
  }, []);

  const canManageAccounts =
    isSuperAdmin() || hasPermission('manage_finances') || hasPermission('view_revenue');

  const stats = useMemo(() => {
    const base = calculateStats(transactions);
    const totalBudget = budgets.reduce((sum, b) => sum + b.allocatedAmount, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spentAmount, 0);
    return {
      ...base,
      totalBudget,
      totalSpent,
      budgetUtilization: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
    };
  }, [transactions, budgets]);

  const expenseBreakdown = useMemo(() => {
    if (apiExpenseBreakdown && apiExpenseBreakdown.length > 0) {
      return apiExpenseBreakdown;
    }
    return getExpenseBreakdown(transactions);
  }, [transactions, apiExpenseBreakdown]);
  const filteredTransactions = useMemo(
    () => filterTransactions(transactions, searchQuery, filterStatus, filterCategory),
    [transactions, searchQuery, filterStatus, filterCategory]
  );

  const canEdit = (transaction: Transaction) =>
    isSuperAdmin() || transaction.createdBy === user?.id;

  const handleAddTransaction = async () => {
    if (!validateTransactionForm(newTransaction)) {
      notify.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const transactionData = {
        type: newTransaction.type,
        category: newTransaction.category,
        subcategory: newTransaction.subcategory || undefined,
        amount: parseFloat(newTransaction.amount),
        description: newTransaction.description,
        source: newTransaction.type === 'revenue' ? newTransaction.source : undefined,
        recipient: newTransaction.type === 'expense' ? newTransaction.recipient : undefined,
        date: newTransaction.date,
        tags: newTransaction.tags,
      };

      const response = await accountApi.createTransaction(transactionData);

      if (response.success) {
        setNewTransaction(DEFAULT_NEW_TRANSACTION);
        setShowAddTransactionDialog(false);
        notify.success('Transaction added successfully');
        await loadAccountData();
      } else {
        notify.error(response.error || 'Failed to add transaction');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddRevenueSource = async () => {
    if (!validateRevenueSourceForm(newRevenueSource)) {
      notify.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const sourceData = {
        name: newRevenueSource.name,
        type: newRevenueSource.type,
        region: newRevenueSource.region,
        district: newRevenueSource.district || undefined,
        contactPerson: newRevenueSource.contactPerson,
        phone: newRevenueSource.phone,
        monthlyTarget: parseFloat(newRevenueSource.monthlyTarget),
      };

      const response = await accountApi.createRevenueSource(sourceData);

      if (response.success) {
        setNewRevenueSource(DEFAULT_NEW_REVENUE_SOURCE);
        setShowAddRevenueSourceDialog(false);
        notify.success('Revenue source added successfully');
        await loadAccountData();
      } else {
        notify.error(response.error || 'Failed to add revenue source');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = async () => {
    const response = await accountApi.exportReport({ format: 'csv', tab: activeTab });
    if (response.success) {
      notify.success('Financial report export completed');
    } else {
      notify.error(response.error || 'Export failed');
    }
  };

  if (!canManageAccounts) {
    return (
      <AccessRestricted message="You need appropriate permissions to access account management." />
    );
  }

  if (loading) {
    return (
      <div className="min-h-full bg-muted/30 flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#193cb8]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-full bg-muted/30 flex flex-col items-center justify-center py-24 px-6 text-center">
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <button
          type="button"
          onClick={() => loadAccountData()}
          className="text-sm font-medium text-[#193cb8] hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-muted/30">
      <AccountCommandHeader
        stats={stats}
        onExport={handleExport}
        onAddTransaction={() => setShowAddTransactionDialog(true)}
      />

      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        <AccountKpiDashboard stats={stats} />

        <Card className="border shadow-none">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="px-5 pt-5 pb-0 border-b overflow-x-auto">
                <TabsList className="inline-flex h-auto w-full min-w-max gap-1 bg-muted/50 p-1.5 rounded-lg border shadow-none">
                  <TabsTrigger value="overview" className={ACCOUNT_TAB_TRIGGER_CLASS}>
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="transactions" className={ACCOUNT_TAB_TRIGGER_CLASS}>
                    Transactions
                  </TabsTrigger>
                  <TabsTrigger value="revenue" className={ACCOUNT_TAB_TRIGGER_CLASS}>
                    Revenue Sources
                  </TabsTrigger>
                  <TabsTrigger value="budgets" className={ACCOUNT_TAB_TRIGGER_CLASS}>
                    Budgets
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className={ACCOUNT_TAB_TRIGGER_CLASS}>
                    Analytics
                  </TabsTrigger>
                  <TabsTrigger value="reports" className={ACCOUNT_TAB_TRIGGER_CLASS}>
                    Reports
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-5">
                <TabsContent value="overview" className="mt-0">
                  <OverviewSection
                    stats={stats}
                    monthlyTrends={monthlyTrends}
                    expenseBreakdown={expenseBreakdown}
                    recentTransactions={transactions}
                  />
                </TabsContent>

                <TabsContent value="transactions" className="mt-0">
                  <TransactionsSection
                    transactions={filteredTransactions}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    filterStatus={filterStatus}
                    setFilterStatus={setFilterStatus}
                    filterCategory={filterCategory}
                    setFilterCategory={setFilterCategory}
                    onSelectTransaction={() => {}}
                    canEdit={canEdit}
                    userId={user?.id}
                    isSuperAdmin={isSuperAdmin()}
                  />
                </TabsContent>

                <TabsContent value="revenue" className="mt-0">
                  <RevenueSourcesSection
                    sources={revenueSources}
                    onAddSource={() => setShowAddRevenueSourceDialog(true)}
                  />
                </TabsContent>

                <TabsContent value="budgets" className="mt-0">
                  <BudgetsSection budgets={budgets} />
                </TabsContent>

                <TabsContent value="analytics" className="mt-0">
                  <OverviewSection
                    stats={stats}
                    monthlyTrends={monthlyTrends}
                    expenseBreakdown={expenseBreakdown}
                    recentTransactions={transactions}
                  />
                </TabsContent>

                <TabsContent value="reports" className="mt-0">
                  <ReportsSection />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>

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
