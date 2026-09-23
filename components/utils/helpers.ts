import { Badge } from '../ui/badge';
import { statusOptions } from '../constants/statusOptions';

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

/** Parse RISE user ids (USR001) or numeric strings for API numeric fields */
export function parseRiseNumericId(
  id: string | number | undefined | null
): number | undefined {
  if (id === undefined || id === null || id === '') return undefined;
  if (typeof id === 'number' && !Number.isNaN(id)) return id;
  const trimmed = String(id).trim();
  if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10);
  const match = trimmed.toUpperCase().match(/^USR(\d+)$/);
  if (match) return parseInt(match[1], 10);
  return undefined;
}

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
      return 'bg-[#193cb8]/10 text-[#193cb8]';
    case 'purple':
      return 'bg-[#193cb8]/10 text-[#193cb8]';
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
      return 'bg-[#193cb8]/10 text-[#193cb8]';
    case 'regional_manager':
      return 'bg-[#193cb8]/10 text-[#193cb8]';
    case 'district_manager':
      return 'bg-green-100 text-green-800';
    case 'admin_operation':
      return 'bg-[#193cb8]/10 text-[#193cb8]';
    case 'admin_hrm':
      return 'bg-pink-100 text-pink-800';
    case 'district_incident_reporter':
      return 'bg-yellow-100 text-yellow-800';
    case 'station_manager':
      return 'bg-teal-100 text-teal-800';
    case 'station_worker':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

function escapeCsvCell(value: unknown): string {
  const text = value == null ? '' : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/** Download rows as a UTF-8 CSV file in the browser. */
export function downloadCsv(
  filename: string,
  headers: string[],
  rows: unknown[][]
): void {
  const lines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ];
  const blob = new Blob([`\uFEFF${lines.join('\n')}`], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}