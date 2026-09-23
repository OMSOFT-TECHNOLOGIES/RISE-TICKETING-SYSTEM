import { apiRequest } from './client';
import type { ApiResponse } from './types';

export const accidentApi = {
  getAll: async (params?: {
    search?: string;
    severity?: string;
    status?: string;
    stationId?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.severity && params.severity !== 'all') {
      queryParams.append('severity', params.severity);
    }
    if (params?.status && params.status !== 'all') {
      queryParams.append('status', params.status);
    }
    if (params?.stationId) queryParams.append('stationId', params.stationId);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    return apiRequest(`/api/accidents${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  getById: async (id: string): Promise<ApiResponse> => {
    return apiRequest(`/api/accidents/${id}`, { method: 'GET' });
  },

  create: async (accidentData: unknown): Promise<ApiResponse> => {
    return apiRequest('/api/accidents', {
      method: 'POST',
      body: JSON.stringify(accidentData),
    });
  },

  update: async (id: string, accidentData: unknown): Promise<ApiResponse> => {
    return apiRequest(`/api/accidents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(accidentData),
    });
  },

  updateStatus: async (id: string, status: string): Promise<ApiResponse> => {
    return apiRequest(`/api/accidents/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  getStatistics: async (period?: string): Promise<ApiResponse> => {
    const queryString = period ? `?period=${period}` : '';
    return apiRequest(`/api/accidents/statistics${queryString}`, { method: 'GET' });
  },

  getTrends: async (params?: { from?: string; to?: string }): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.from) queryParams.append('from', params.from);
    if (params?.to) queryParams.append('to', params.to);

    const queryString = queryParams.toString();
    return apiRequest(
      `/api/accidents/analytics/trends${queryString ? `?${queryString}` : ''}`,
      { method: 'GET' }
    );
  },

  getSeverityDistribution: async (): Promise<ApiResponse> => {
    return apiRequest('/api/accidents/analytics/severity', { method: 'GET' });
  },

  getCauseAnalysis: async (): Promise<ApiResponse> => {
    return apiRequest('/api/accidents/analytics/causes', { method: 'GET' });
  },

  exportRegistry: async (format: string = 'csv'): Promise<ApiResponse> => {
    return apiRequest('/api/accidents/export', {
      method: 'POST',
      body: JSON.stringify({ format }),
    });
  },

  generateReport: async (templateId: string, params?: unknown): Promise<ApiResponse> => {
    return apiRequest(`/api/accidents/reports/${templateId}`, {
      method: 'POST',
      body: params ? JSON.stringify(params) : undefined,
    });
  },
};
