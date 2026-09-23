import { apiRequest } from './client';
import type { ApiResponse } from './types';

export const reportApi = {
  getOverview: async (params?: {
    from?: string;
    to?: string;
    stationId?: string;
    route?: string;
  }): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.from) queryParams.append('from', params.from);
    if (params?.to) queryParams.append('to', params.to);
    if (params?.stationId) queryParams.append('stationId', params.stationId);
    if (params?.route) queryParams.append('route', params.route);

    const queryString = queryParams.toString();
    return apiRequest(`/api/reports/overview${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  getFinancial: async (params?: {
    from?: string;
    to?: string;
    stationId?: string;
    route?: string;
  }): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.from) queryParams.append('from', params.from);
    if (params?.to) queryParams.append('to', params.to);
    if (params?.stationId) queryParams.append('stationId', params.stationId);
    if (params?.route) queryParams.append('route', params.route);

    const queryString = queryParams.toString();
    return apiRequest(`/api/reports/financial${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  getOperations: async (params?: {
    from?: string;
    to?: string;
    stationId?: string;
    route?: string;
  }): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.from) queryParams.append('from', params.from);
    if (params?.to) queryParams.append('to', params.to);
    if (params?.stationId) queryParams.append('stationId', params.stationId);
    if (params?.route) queryParams.append('route', params.route);

    const queryString = queryParams.toString();
    return apiRequest(`/api/reports/operations${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  getPerformance: async (params?: {
    from?: string;
    to?: string;
    stationId?: string;
    route?: string;
  }): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.from) queryParams.append('from', params.from);
    if (params?.to) queryParams.append('to', params.to);
    if (params?.stationId) queryParams.append('stationId', params.stationId);
    if (params?.route) queryParams.append('route', params.route);

    const queryString = queryParams.toString();
    return apiRequest(`/api/reports/performance${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  generate: async (reportData: unknown): Promise<ApiResponse> => {
    return apiRequest('/api/reports/generate', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  },

  email: async (emailData: unknown): Promise<ApiResponse> => {
    return apiRequest('/api/reports/email', {
      method: 'POST',
      body: JSON.stringify(emailData),
    });
  },
};
