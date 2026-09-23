import { apiRequest } from './client';
import type { ApiResponse } from './types';

export const revenueApi = {
  getSummary: async (params?: {
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
    return apiRequest(`/api/revenue/summary${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  getByStation: async (params?: {
    period?: string;
    from?: string;
    to?: string;
  }): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    if (params?.from) queryParams.append('from', params.from);
    if (params?.to) queryParams.append('to', params.to);

    const queryString = queryParams.toString();
    return apiRequest(`/api/revenue/by-station${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  getByRoute: async (params?: {
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
    return apiRequest(`/api/revenue/by-route${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  getPaymentMethods: async (params?: {
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
      `/api/revenue/payment-methods${queryString ? `?${queryString}` : ''}`,
      { method: 'GET' }
    );
  },

  export: async (params?: { format?: string; period?: string }): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.format) queryParams.append('format', params.format);
    if (params?.period) queryParams.append('period', params.period);

    const queryString = queryParams.toString();
    return apiRequest(`/api/revenue/export${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },
};
