import { apiRequest } from './client';
import type { ApiResponse } from './types';

export const deathTrapApi = {
  getAll: async (params?: {
    search?: string;
    type?: string;
    severity?: string;
    status?: string;
    region?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.type && params.type !== 'all') queryParams.append('type', params.type);
    if (params?.severity && params.severity !== 'all') {
      queryParams.append('severity', params.severity);
    }
    if (params?.status && params.status !== 'all') {
      queryParams.append('status', params.status);
    }
    if (params?.region) queryParams.append('region', params.region);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    return apiRequest(`/api/death-traps${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  getById: async (id: string): Promise<ApiResponse> => {
    return apiRequest(`/api/death-traps/${id}`, { method: 'GET' });
  },

  create: async (hazardData: unknown): Promise<ApiResponse> => {
    return apiRequest('/api/death-traps', {
      method: 'POST',
      body: JSON.stringify(hazardData),
    });
  },

  update: async (id: string, hazardData: unknown): Promise<ApiResponse> => {
    return apiRequest(`/api/death-traps/${id}`, {
      method: 'PUT',
      body: JSON.stringify(hazardData),
    });
  },

  updateStatus: async (id: string, data: unknown): Promise<ApiResponse> => {
    return apiRequest(`/api/death-traps/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  getStatistics: async (): Promise<ApiResponse> => {
    return apiRequest('/api/death-traps/statistics', { method: 'GET' });
  },
};
