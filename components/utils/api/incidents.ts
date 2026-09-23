import { apiRequest } from './client';
import type { ApiResponse } from './types';

export const incidentApi = {
  getAll: async (params?: {
    search?: string;
    type?: string;
    status?: string;
    severity?: string;
    region?: string;
    district?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.type && params.type !== 'all') queryParams.append('type', params.type);
    if (params?.status && params.status !== 'all') {
      queryParams.append('status', params.status);
    }
    if (params?.severity && params.severity !== 'all') {
      queryParams.append('severity', params.severity);
    }
    if (params?.region) queryParams.append('region', params.region);
    if (params?.district) queryParams.append('district', params.district);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    return apiRequest(`/api/incidents${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  getById: async (id: string): Promise<ApiResponse> => {
    return apiRequest(`/api/incidents/${id}`, { method: 'GET' });
  },

  create: async (incidentData: unknown): Promise<ApiResponse> => {
    return apiRequest('/api/incidents', {
      method: 'POST',
      body: JSON.stringify(incidentData),
    });
  },

  update: async (id: string, incidentData: unknown): Promise<ApiResponse> => {
    return apiRequest(`/api/incidents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(incidentData),
    });
  },

  updateStatus: async (
    id: string,
    data: { status: string; assignedTo?: string }
  ): Promise<ApiResponse> => {
    return apiRequest(`/api/incidents/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<ApiResponse> => {
    return apiRequest(`/api/incidents/${id}`, { method: 'DELETE' });
  },

  getStatistics: async (): Promise<ApiResponse> => {
    return apiRequest('/api/incidents/statistics', { method: 'GET' });
  },

  getMap: async (params?: {
    region?: string;
    status?: string;
    severity?: string;
  }): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.region) queryParams.append('region', params.region);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.severity) queryParams.append('severity', params.severity);

    const queryString = queryParams.toString();
    return apiRequest(`/api/incidents/map${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },
};
