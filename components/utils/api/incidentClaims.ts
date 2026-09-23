import { apiRequest } from './client';
import type { ApiResponse } from './types';

export const incidentClaimApi = {
  getAll: async (params?: {
    search?: string;
    status?: string;
    incidentId?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status && params.status !== 'all') {
      queryParams.append('status', params.status);
    }
    if (params?.incidentId) queryParams.append('incidentId', params.incidentId);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    return apiRequest(`/api/incident-claims${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  getById: async (id: string): Promise<ApiResponse> => {
    return apiRequest(`/api/incident-claims/${id}`, { method: 'GET' });
  },

  create: async (claimData: unknown): Promise<ApiResponse> => {
    return apiRequest('/api/incident-claims', {
      method: 'POST',
      body: JSON.stringify(claimData),
    });
  },

  updateStatus: async (id: string, data: unknown): Promise<ApiResponse> => {
    return apiRequest(`/api/incident-claims/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  getStatistics: async (): Promise<ApiResponse> => {
    return apiRequest('/api/incident-claims/statistics', { method: 'GET' });
  },
};
