import { apiRequest } from './client';
import type { ApiResponse } from './types';

export const stationApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    region?: string;
    district?: string;
    status?: string;
    search?: string;
  }): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.region) queryParams.append('region', params.region);
    if (params?.district) queryParams.append('district', params.district);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    return apiRequest(`/api/stations${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  getById: async (id: string): Promise<ApiResponse> => {
    return apiRequest(`/api/stations/${id}`, { method: 'GET' });
  },

  create: async (stationData: unknown): Promise<ApiResponse> => {
    return apiRequest('/api/stations', {
      method: 'POST',
      body: JSON.stringify(stationData),
    });
  },

  update: async (id: string, stationData: unknown): Promise<ApiResponse> => {
    return apiRequest(`/api/stations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(stationData),
    });
  },

  updateStatus: async (id: string, status: string): Promise<ApiResponse> => {
    return apiRequest(`/api/stations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  delete: async (id: string): Promise<ApiResponse> => {
    return apiRequest(`/api/stations/${id}`, { method: 'DELETE' });
  },

  getStatistics: async (id: string, period?: string): Promise<ApiResponse> => {
    const queryString = period ? `?period=${period}` : '';
    return apiRequest(`/api/stations/${id}/statistics${queryString}`, {
      method: 'GET',
    });
  },

  checkCode: async (code: string): Promise<ApiResponse<{ available: boolean }>> => {
    return apiRequest(`/api/stations/check-code/${code}`, { method: 'GET' });
  },
};
