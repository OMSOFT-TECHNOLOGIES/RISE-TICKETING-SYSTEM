import { apiRequest } from './client';
import type { ApiResponse } from './types';

export const notificationApi = {
  getAll: async (params?: {
    unreadOnly?: boolean;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.unreadOnly) queryParams.append('unreadOnly', 'true');
    if (params?.type && params.type !== 'all') queryParams.append('type', params.type);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    return apiRequest(`/api/notifications${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  markRead: async (id: string): Promise<ApiResponse> => {
    return apiRequest(`/api/notifications/${id}/read`, { method: 'PATCH' });
  },

  markAllRead: async (): Promise<ApiResponse> => {
    return apiRequest('/api/notifications/read-all', { method: 'PATCH' });
  },

  getAlerts: async (): Promise<ApiResponse> => {
    return apiRequest('/api/alerts', { method: 'GET' });
  },

  dismissAlert: async (id: string): Promise<ApiResponse> => {
    return apiRequest(`/api/alerts/${id}/dismiss`, { method: 'POST' });
  },
};
