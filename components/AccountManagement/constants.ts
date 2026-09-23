// Constants for Account Management

// Expense categories as specified
export const EXPENSE_CATEGORIES = [
  'Salary',
  'Claims',
  'Gadgets',
  'Stationary',
  'Public Sensitization',
  'Incident Resolution',
  'Monitoring'
];

export const REVENUE_CATEGORIES = [
  'Station Fees',
  'Union Dues',
  'District Allocations',
  'Regional Grants',
  'Licensing Fees',
  'Fines and Penalties',
  'Other Revenue'
];

export const TRANSACTION_STATUSES = {
  completed: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800'
};

export const CHART_COLORS = [
  '#22c55e', // Green
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#84cc16'  // Lime
];

export const DEFAULT_NEW_TRANSACTION = {
  type: 'expense' as const,
  category: '',
  subcategory: '',
  amount: '',
  description: '',
  source: '',
  recipient: '',
  date: new Date().toISOString().split('T')[0],
  tags: [] as string[]
};

export const ACCOUNT_TAB_TRIGGER_CLASS =
  'rounded-md py-2 text-xs sm:text-sm font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:font-semibold data-[state=active]:ring-1 data-[state=active]:ring-violet-700/40';

export const DEFAULT_NEW_REVENUE_SOURCE = {
  name: '',
  type: 'station' as const,
  region: '',
  district: '',
  contactPerson: '',
  phone: '',
  monthlyTarget: ''
};