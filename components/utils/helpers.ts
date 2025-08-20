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

export const getStatusInfo = (status: string, type: 'trip' | 'vehicle' | 'driver' | 'station' | 'incident' | 'deathTrap' = 'trip') => {
  // statusOptions is an object with categorized arrays
  const categoryOptions = statusOptions[type] || [];
  return categoryOptions.find(s => s.value === status) || { 
    value: status, 
    label: status.charAt(0).toUpperCase() + status.slice(1), 
    color: 'gray' 
  };
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

// Helper function to get status badge with consistent styling
export const getStatusBadgeClass = (status: string): string => {
  const statusInfo = getStatusInfo(status);
  
  switch (statusInfo.color) {
    case 'green':
      return 'bg-green-100 text-green-800';
    case 'red':
      return 'bg-red-100 text-red-800';
    case 'yellow':
      return 'bg-yellow-100 text-yellow-800';
    case 'blue':
      return 'bg-blue-100 text-blue-800';
    case 'purple':
      return 'bg-purple-100 text-purple-800';
    case 'orange':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Role badge helper
export const getRoleBadgeClass = (role: string): string => {
  switch (role) {
    case 'super_admin':
      return 'bg-red-100 text-red-800';
    case 'admin':
      return 'bg-purple-100 text-purple-800';
    case 'regional_manager':
      return 'bg-blue-100 text-blue-800';
    case 'district_manager':
      return 'bg-green-100 text-green-800';
    case 'admin_operation':
      return 'bg-indigo-100 text-indigo-800';
    case 'admin_hrm':
      return 'bg-pink-100 text-pink-800';
    case 'district_incident_reporter':
      return 'bg-yellow-100 text-yellow-800';
    case 'station_worker':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};