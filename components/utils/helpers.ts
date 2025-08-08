import { Badge } from '../ui/badge';
import { statusOptions } from '../constants/mockData';

export const formatCurrency = (amount: number): string => {
  return `₵${amount.toLocaleString()}`;
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString();
};

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString();
};

export const generateId = (prefix: string, currentLength: number): string => {
  return `${prefix}${String(currentLength + 1).padStart(3, '0')}`;
};

export const getStatusInfo = (status: string, type: 'user' | 'vehicle' = 'user') => {
  return statusOptions[type].find(s => s.value === status);
};

export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const getLicenseStatus = (expiryDate: string) => {
  const expiry = new Date(expiryDate);
  const today = new Date();
  const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
  
  if (daysUntilExpiry < 0) {
    return { status: 'expired', color: 'bg-red-100 text-red-800', label: 'Expired' };
  } else if (daysUntilExpiry < 30) {
    return { status: 'expiring', color: 'bg-yellow-100 text-yellow-800', label: 'Expiring Soon' };
  } else {
    return { status: 'valid', color: 'bg-green-100 text-green-800', label: 'Valid' };
  }
};