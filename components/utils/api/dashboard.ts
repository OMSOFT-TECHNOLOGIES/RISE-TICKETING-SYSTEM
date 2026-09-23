import { apiRequest } from './client';
import type { ApiResponse } from './types';

export const dashboardApi = {
  getAdmin: async (period?: 'daily' | 'monthly' | 'yearly'): Promise<ApiResponse> => {
    const queryString = period ? `?period=${period}` : '';
    return apiRequest(`/api/dashboard/admin${queryString}`, { method: 'GET' });
  },

  getStation: async (params?: {
    stationId?: string;
    period?: string;
  }): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.stationId) queryParams.append('stationId', params.stationId);
    if (params?.period) queryParams.append('period', params.period);

    const queryString = queryParams.toString();
    return apiRequest(`/api/dashboard/station${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  getTripsRevenueChart: async (params?: {
    period?: string;
    from?: string;
    to?: string;
    stationId?: string;
  }): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    if (params?.from) queryParams.append('from', params.from);
    if (params?.to) queryParams.append('to', params.to);
    if (params?.stationId) queryParams.append('stationId', params.stationId);

    const queryString = queryParams.toString();
    return apiRequest(
      `/api/dashboard/charts/trips-revenue${queryString ? `?${queryString}` : ''}`,
      { method: 'GET' }
    );
  },

  getRegionsChart: async (params?: { period?: string }): Promise<ApiResponse> => {
    const queryString = params?.period ? `?period=${params.period}` : '';
    return apiRequest(`/api/dashboard/charts/regions${queryString}`, { method: 'GET' });
  },

  getUserActivity: async (): Promise<ApiResponse> => {
    return apiRequest('/api/dashboard/user-activity', { method: 'GET' });
  },

  getActivities: async (params?: {
    limit?: number;
    stationId?: string;
  }): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.stationId) queryParams.append('stationId', params.stationId);

    const queryString = queryParams.toString();
    return apiRequest(
      `/api/dashboard/activities${queryString ? `?${queryString}` : ''}`,
      { method: 'GET' }
    );
  },
};
