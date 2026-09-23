import { apiRequest } from './client';
import type { ApiResponse } from './types';

export const ticketApi = {
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
    return apiRequest(`/api/tickets${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  getById: async (id: string): Promise<ApiResponse> => {
    return apiRequest(`/api/tickets/${id}`, { method: 'GET' });
  },

  updateStatus: async (id: string, status: string): Promise<ApiResponse> => {
    return apiRequest(`/api/tickets/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  sendSms: async (id: string, smsData?: unknown): Promise<ApiResponse> => {
    return apiRequest(`/api/tickets/${id}/send-sms`, {
      method: 'POST',
      body: smsData ? JSON.stringify(smsData) : undefined,
    });
  },

  print: async (id: string): Promise<ApiResponse> => {
    return apiRequest(`/api/tickets/${id}/print`, { method: 'GET' });
  },

  submitRating: async (id: string, rating: number): Promise<ApiResponse> => {
    return apiRequest(`/api/tickets/${id}/rating`, {
      method: 'POST',
      body: JSON.stringify({ rating }),
    });
  },

  submitComplaint: async (id: string, complaintData: unknown): Promise<ApiResponse> => {
    return apiRequest(`/api/tickets/${id}/complaint`, {
      method: 'POST',
      body: JSON.stringify(complaintData),
    });
  },

  getStatistics: async (params?: { stationId?: string }): Promise<ApiResponse> => {
    const queryString = params?.stationId ? `?stationId=${params.stationId}` : '';
    return apiRequest(`/api/tickets/statistics${queryString}`, { method: 'GET' });
  },

  getByToken: async (token: string): Promise<ApiResponse> => {
    return apiRequest(`/e-ticket/${token}`, { method: 'GET' });
  },
};
