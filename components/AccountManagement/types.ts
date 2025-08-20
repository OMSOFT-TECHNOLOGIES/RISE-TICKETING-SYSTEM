// Financial interfaces and types for Account Management

export interface RevenueSource {
  id: string;
  name: string;
  type: 'station' | 'union' | 'district' | 'region';
  region: string;
  district?: string;
  contactPerson: string;
  phone: string;
  totalContribution: number;
  monthlyTarget: number;
  status: 'active' | 'inactive' | 'pending';
  lastPayment: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: 'revenue' | 'expense';
  category: string;
  subcategory?: string;
  amount: number;
  description: string;
  source?: string; // For revenue
  recipient?: string; // For expenses
  date: string;
  status: 'completed' | 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  receipt?: string;
  tags: string[];
  createdBy: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  category: string;
  allocatedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  period: 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate: string;
  status: 'active' | 'exceeded' | 'completed';
  approvedBy: string;
  createdAt: string;
}

export interface FinancialStats {
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyProfit: number;
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  pendingTransactions: number;
  totalBudget: number;
  totalSpent: number;
  budgetUtilization: number;
}

export interface NewTransactionForm {
  type: 'revenue' | 'expense';
  category: string;
  subcategory: string;
  amount: string;
  description: string;
  source: string;
  recipient: string;
  date: string;
  tags: string[];
}

export interface NewRevenueSourceForm {
  name: string;
  type: 'station' | 'union' | 'district' | 'region';
  region: string;
  district: string;
  contactPerson: string;
  phone: string;
  monthlyTarget: string;
}

export interface ChartDataPoint {
  name: string;
  value?: number;
  color?: string;
  month?: string;
  revenue?: number;
  expenses?: number;
  profit?: number;
}