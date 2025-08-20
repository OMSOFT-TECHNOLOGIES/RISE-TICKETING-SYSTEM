import { RevenueSource, Transaction, Budget, IncidentClaim } from './types';

// Mock data generators for Account Management

export const getMockRevenueSources = (): RevenueSource[] => [
  {
    id: 'RS-001',
    name: 'Accra Central Station',
    type: 'station',
    region: 'Greater Accra',
    district: 'Accra Metropolitan',
    contactPerson: 'John Doe',
    phone: '+233 24 123 4567',
    totalContribution: 45000,
    monthlyTarget: 15000,
    status: 'active',
    lastPayment: '2024-01-15',
    createdAt: new Date().toISOString()
  },
  {
    id: 'RS-002',
    name: 'Ghana Private Road Transport Union',
    type: 'union',
    region: 'National',
    contactPerson: 'Mary Asante',
    phone: '+233 20 987 6543',
    totalContribution: 120000,
    monthlyTarget: 40000,
    status: 'active',
    lastPayment: '2024-01-10',
    createdAt: new Date().toISOString()
  },
  {
    id: 'RS-003',
    name: 'Ashanti Regional Office',
    type: 'region',
    region: 'Ashanti',
    contactPerson: 'Kwame Boateng',
    phone: '+233 24 555 0123',
    totalContribution: 85000,
    monthlyTarget: 30000,
    status: 'active',
    lastPayment: '2024-01-12',
    createdAt: new Date().toISOString()
  }
];

export const getMockTransactions = (userId?: string): Transaction[] => [
  {
    id: 'TXN-001',
    type: 'revenue',
    category: 'Station Fees',
    amount: 15000,
    description: 'Monthly station fee collection from Accra Central',
    source: 'Accra Central Station',
    date: '2024-01-15',
    status: 'completed',
    tags: ['monthly', 'station'],
    createdBy: 'system',
    createdAt: new Date().toISOString()
  },
  {
    id: 'TXN-002',
    type: 'expense',
    category: 'Salary',
    amount: 25000,
    description: 'Monthly salary payment for district managers',
    recipient: 'Payroll Department',
    date: '2024-01-01',
    status: 'completed',
    approvedBy: 'admin',
    tags: ['monthly', 'payroll'],
    createdBy: userId || 'admin',
    createdAt: new Date().toISOString()
  },
  {
    id: 'TXN-003',
    type: 'expense',
    category: 'Claims',
    amount: 8500,
    description: 'Incident claim payment for vehicle accident on N1 Highway',
    recipient: 'Insurance Department',
    date: '2024-01-10',
    status: 'approved',
    approvedBy: 'admin',
    tags: ['claim', 'accident'],
    createdBy: userId || 'admin',
    createdAt: new Date().toISOString()
  },
  {
    id: 'TXN-004',
    type: 'expense',
    category: 'Gadgets',
    amount: 12000,
    description: 'Purchase of GPS tracking devices for vehicles',
    recipient: 'Tech Solutions Ltd',
    date: '2024-01-08',
    status: 'completed',
    approvedBy: 'admin',
    tags: ['technology', 'tracking'],
    createdBy: userId || 'admin',
    createdAt: new Date().toISOString()
  }
];

export const getMockBudgets = (): Budget[] => [
  {
    id: 'BDG-001',
    category: 'Salary',
    allocatedAmount: 300000,
    spentAmount: 75000,
    remainingAmount: 225000,
    period: 'monthly',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    status: 'active',
    approvedBy: 'admin',
    createdAt: new Date().toISOString()
  },
  {
    id: 'BDG-002',
    category: 'Claims',
    allocatedAmount: 50000,
    spentAmount: 8500,
    remainingAmount: 41500,
    period: 'monthly',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    status: 'active',
    approvedBy: 'admin',
    createdAt: new Date().toISOString()
  },
  {
    id: 'BDG-003',
    category: 'Public Sensitization',
    allocatedAmount: 25000,
    spentAmount: 5000,
    remainingAmount: 20000,
    period: 'monthly',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    status: 'active',
    approvedBy: 'admin',
    createdAt: new Date().toISOString()
  }
];

export const getMockMonthlyTrends = () => {
  return Array.from({ length: 12 }, (_, i) => {
    const month = new Date(2024, i).toLocaleDateString('en-US', { month: 'short' });
    const revenue = Math.random() * 50000 + 30000;
    const expenses = Math.random() * 40000 + 25000;
    return {
      month,
      revenue,
      expenses,
      profit: revenue - expenses
    };
  });
};