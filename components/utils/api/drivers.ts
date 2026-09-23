import { apiRequest } from './client';
import type { ApiResponse } from './types';

export const driverApi = {
  getAll: async (params?: {
    stationId?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.stationId) queryParams.append('stationId', params.stationId);
    if (params?.status && params.status !== 'all') {
      queryParams.append('status', params.status);
    }
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    return apiRequest(`/api/drivers${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  getById: async (id: string): Promise<ApiResponse> => {
    return apiRequest(`/api/drivers/${id}`, { method: 'GET' });
  },

  create: async (driverData: unknown): Promise<ApiResponse> => {
    return apiRequest('/api/drivers', {
      method: 'POST',
      body: JSON.stringify(driverData),
    });
  },

  update: async (id: string, driverData: unknown): Promise<ApiResponse> => {
    return apiRequest(`/api/drivers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(driverData),
    });
  },

  updateStatus: async (id: string, status: string): Promise<ApiResponse> => {
    return apiRequest(`/api/drivers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  delete: async (id: string): Promise<ApiResponse> => {
    return apiRequest(`/api/drivers/${id}`, { method: 'DELETE' });
  },

  getStatistics: async (): Promise<ApiResponse> => {
    return apiRequest('/api/drivers/statistics', { method: 'GET' });
  },

  getAvailable: async (stationId?: string): Promise<ApiResponse> => {
    const queryString = stationId ? `?stationId=${stationId}` : '';
    return apiRequest(`/api/drivers/available${queryString}`, { method: 'GET' });
  },
};
