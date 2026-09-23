import { apiRequest } from './client';
import type { ApiResponse } from './types';

export const feedbackApi = {
  getRatings: async (params?: {
    search?: string;
    stationId?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.stationId) queryParams.append('stationId', params.stationId);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    return apiRequest(`/api/ratings${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  getComplaints: async (params?: {
    search?: string;
    status?: string;
    priority?: string;
    category?: string;
    stationId?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status && params.status !== 'all') {
      queryParams.append('status', params.status);
    }
    if (params?.priority && params.priority !== 'all') {
      queryParams.append('priority', params.priority);
    }
    if (params?.category && params.category !== 'all') {
      queryParams.append('category', params.category);
    }
    if (params?.stationId) queryParams.append('stationId', params.stationId);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    return apiRequest(`/api/complaints${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  getComplaint: async (id: string): Promise<ApiResponse> => {
    return apiRequest(`/api/complaints/${id}`, { method: 'GET' });
  },

  respondToComplaint: async (
    id: string,
    data: { response: string; status?: string }
  ): Promise<ApiResponse> => {
    return apiRequest(`/api/complaints/${id}/respond`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  getStatistics: async (params?: { stationId?: string }): Promise<ApiResponse> => {
    const queryString = params?.stationId ? `?stationId=${params.stationId}` : '';
    return apiRequest(`/api/feedback/statistics${queryString}`, { method: 'GET' });
  },

  getRatingTrends: async (params?: { from?: string; to?: string }): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.from) queryParams.append('from', params.from);
    if (params?.to) queryParams.append('to', params.to);

    const queryString = queryParams.toString();
    return apiRequest(
      `/api/feedback/analytics/rating-trends${queryString ? `?${queryString}` : ''}`,
      { method: 'GET' }
    );
  },

  getRatingDistribution: async (params?: { stationId?: string }): Promise<ApiResponse> => {
    const queryString = params?.stationId ? `?stationId=${params.stationId}` : '';
    return apiRequest(`/api/feedback/analytics/rating-distribution${queryString}`, {
      method: 'GET',
    });
  },

  getComplaintCategories: async (params?: { stationId?: string }): Promise<ApiResponse> => {
    const queryString = params?.stationId ? `?stationId=${params.stationId}` : '';
    return apiRequest(`/api/feedback/analytics/complaint-categories${queryString}`, {
      method: 'GET',
    });
  },

  export: async (exportData: { type: string; format: string }): Promise<ApiResponse> => {
    return apiRequest('/api/feedback/export', {
      method: 'POST',
      body: JSON.stringify(exportData),
    });
  },
};
