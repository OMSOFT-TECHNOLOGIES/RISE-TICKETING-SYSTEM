import { Transaction, FinancialStats, ChartDataPoint } from './types';
import { EXPENSE_CATEGORIES, TRANSACTION_STATUSES, CHART_COLORS } from './constants';
import { Badge } from '../ui/badge';
import React from 'react';

// Utility functions for Account Management

export const formatCurrency = (amount: number): string => {
  return `₵${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const calculateStats = (transactions: Transaction[]): FinancialStats => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyRevenue = transactions
    .filter(t => t.type === 'revenue' && 
      new Date(t.date).getMonth() === currentMonth && 
      new Date(t.date).getFullYear() === currentYear)
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpenses = transactions
    .filter(t => t.type === 'expense' && 
      new Date(t.date).getMonth() === currentMonth && 
      new Date(t.date).getFullYear() === currentYear)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalRevenue = transactions
    .filter(t => t.type === 'revenue')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingTransactions = transactions.filter(t => t.status === 'pending').length;

  return {
    monthlyRevenue,
    monthlyExpenses,
    monthlyProfit: monthlyRevenue - monthlyExpenses,
    totalRevenue,
    totalExpenses,
    totalProfit: totalRevenue - totalExpenses,
    pendingTransactions,
    totalBudget: 0, // Will be calculated from budgets
    totalSpent: 0, // Will be calculated from budgets
    budgetUtilization: 0 // Will be calculated from budgets
  };
};

export const getExpenseBreakdown = (transactions: Transaction[]): ChartDataPoint[] => {
  return EXPENSE_CATEGORIES.map((category, index) => {
    const amount = transactions
      .filter(t => t.type === 'expense' && t.category === category)
      .reduce((sum, t) => sum + t.amount, 0);
    return { 
      name: category, 
      value: amount, 
      color: CHART_COLORS[index % CHART_COLORS.length]
    };
  }).filter(item => item.value > 0);
};

export const getStatusBadge = (status: string) => {
  const statusColor = TRANSACTION_STATUSES[status as keyof typeof TRANSACTION_STATUSES] || 'bg-gray-100 text-gray-800';
  
  return React.createElement(Badge, {
    className: statusColor
  }, status.charAt(0).toUpperCase() + status.slice(1));
};

export const filterTransactions = (
  transactions: Transaction[],
  searchQuery: string,
  filterStatus: string,
  filterCategory: string
): Transaction[] => {
  return transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (transaction.source && transaction.source.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (transaction.recipient && transaction.recipient.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || transaction.category === filterCategory;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });
};

export const generateTransactionId = (existingTransactions: Transaction[]): string => {
  return `TXN-${String(existingTransactions.length + 1).padStart(3, '0')}`;
};

export const generateRevenueSourceId = (existingCount: number): string => {
  return `RS-${String(existingCount + 1).padStart(3, '0')}`;
};

export const validateTransactionForm = (form: any): boolean => {
  return !!(form.category && form.amount && form.description);
};

export const validateRevenueSourceForm = (form: any): boolean => {
  return !!(form.name && form.contactPerson && form.monthlyTarget);
};