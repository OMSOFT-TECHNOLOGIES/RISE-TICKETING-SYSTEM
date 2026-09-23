import { apiRequest } from './client';
import type { ApiResponse } from './types';

export const unionApi = {
  getAll: async (params?: {
    region?: string;
    search?: string;
    status?: string;
    limit?: number;
    page?: number;
  }): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.region && params.region !== 'all') {
      queryParams.append('region', params.region);
    }
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit != null) queryParams.append('limit', String(params.limit));
    if (params?.page != null) queryParams.append('page', String(params.page));

    const queryString = queryParams.toString();
    return apiRequest(`/api/unions${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  getById: async (id: string): Promise<ApiResponse> => {
    return apiRequest(`/api/unions/${id}`, { method: 'GET' });
  },

  create: async (unionData: unknown): Promise<ApiResponse> => {
    return apiRequest('/api/unions', {
      method: 'POST',
      body: JSON.stringify(unionData),
    });
  },

  update: async (id: string, unionData: unknown): Promise<ApiResponse> => {
    return apiRequest(`/api/unions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(unionData),
    });
  },

  delete: async (id: string): Promise<ApiResponse> => {
    return apiRequest(`/api/unions/${id}`, { method: 'DELETE' });
  },

  getStatistics: async (region?: string): Promise<ApiResponse> => {
    const queryString = region ? `?region=${region}` : '';
    return apiRequest(`/api/unions/statistics${queryString}`, { method: 'GET' });
  },

  getActiveUnions: async (region?: string): Promise<ApiResponse> => {
    return unionApi.getAll({
      status: 'active',
      limit: 500,
      page: 1,
      region,
    });
  },
};
