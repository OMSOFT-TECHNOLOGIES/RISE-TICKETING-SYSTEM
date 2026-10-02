import { apiRequest } from './client';
import type { ApiResponse } from './types';

type DashboardRangeParams = {
  period?: 'daily' | 'monthly' | 'yearly' | string;
  from?: string;
  to?: string;
  date?: string;
};

export type DashboardScopeParams = {
  stationId?: string;
  region?: string;
  district?: string;
};

function appendRangeParams(queryParams: URLSearchParams, params?: DashboardRangeParams): void {
  if (params?.period) queryParams.append('period', params.period);
  if (params?.from) queryParams.append('from', params.from);
  if (params?.to) queryParams.append('to', params.to);
  if (params?.date) queryParams.append('date', params.date);
}

function appendScopeParams(
  queryParams: URLSearchParams,
  params?: DashboardScopeParams
): void {
  if (params?.stationId) queryParams.append('stationId', params.stationId);
  if (params?.region) queryParams.append('region', params.region);
  if (params?.district) queryParams.append('district', params.district);
}

export const dashboardApi = {
  getAdmin: async (
    params?: DashboardRangeParams & DashboardScopeParams
  ): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams();
    appendRangeParams(queryParams, params);
    appendScopeParams(queryParams, params);
    const queryString = queryParams.toString();
    return apiRequest(`/api/dashboard/admin${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  getOverview: async (
    params?: DashboardRangeParams & DashboardScopeParams
  ): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams();
    appendRangeParams(queryParams, params);
    appendScopeParams(queryParams, params);
    const queryString = queryParams.toString();
    return apiRequest(`/api/dashboard/overview${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  getStation: async (params?: {
    stationId?: string;
  } & DashboardRangeParams): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.stationId) queryParams.append('stationId', params.stationId);
    appendRangeParams(queryParams, params);

    const queryString = queryParams.toString();
    return apiRequest(`/api/dashboard/station${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  getTripsRevenueChart: async (
    params?: {
      period?: string;
      from?: string;
      to?: string;
    } & DashboardScopeParams
  ): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    if (params?.from) queryParams.append('from', params.from);
    if (params?.to) queryParams.append('to', params.to);
    appendScopeParams(queryParams, params);

    const queryString = queryParams.toString();
    return apiRequest(
      `/api/dashboard/charts/trips-revenue${queryString ? `?${queryString}` : ''}`,
      { method: 'GET' }
    );
  },

  getRegionsChart: async (
    params?: { period?: string } & DashboardScopeParams
  ): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    appendScopeParams(queryParams, params);
    const queryString = queryParams.toString();
    return apiRequest(
      `/api/dashboard/charts/regions${queryString ? `?${queryString}` : ''}`,
      { method: 'GET' }
    );
  },

  getUserActivity: async (): Promise<ApiResponse> => {
    return apiRequest('/api/dashboard/user-activity', { method: 'GET' });
  },

  getActivities: async (
    params?: { limit?: number } & DashboardScopeParams
  ): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    appendScopeParams(queryParams, params);

    const queryString = queryParams.toString();
    return apiRequest(
      `/api/dashboard/activities${queryString ? `?${queryString}` : ''}`,
      { method: 'GET' }
    );
  },
};
