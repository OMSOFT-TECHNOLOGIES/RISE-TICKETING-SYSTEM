import { apiRequest } from './client';
import type { ApiResponse } from './types';

export type UserListQuery = {
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
  region?: string;
  search?: string;
};

function buildUserQuery(params?: UserListQuery): string {
  const queryParams = new URLSearchParams();
  if (params?.page != null) queryParams.append('page', String(params.page));
  if (params?.limit != null) queryParams.append('limit', String(params.limit));
  if (params?.role) queryParams.append('role', params.role);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.region) queryParams.append('region', params.region);
  if (params?.search) queryParams.append('search', params.search);
  const qs = queryParams.toString();
  return qs ? `?${qs}` : '';
}

export const userApi = {
  getAll: async (params?: UserListQuery): Promise<ApiResponse> => {
    return apiRequest(`/api/users${buildUserQuery(params)}`, { method: 'GET' });
  },

  getById: async (id: string): Promise<ApiResponse> => {
    return apiRequest(`/api/users/${id}`, { method: 'GET' });
  },

  create: async (userData: unknown): Promise<ApiResponse> => {
    return apiRequest('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  update: async (id: string, userData: unknown): Promise<ApiResponse> => {
    return apiRequest(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  toggleStatus: async (id: string, status: string): Promise<ApiResponse> => {
    return apiRequest(`/api/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  delete: async (id: string): Promise<ApiResponse> => {
    return apiRequest(`/api/users/${id}`, { method: 'DELETE' });
  },

  getActiveManagers: async (): Promise<ApiResponse> => {
    return apiRequest('/api/users/managers/active', { method: 'GET' });
  },

  getFormOptions: async (): Promise<ApiResponse> => {
    return apiRequest('/api/users/form-options', { method: 'GET' });
  },

  checkUsername: async (username: string): Promise<ApiResponse<{ available: boolean }>> => {
    return apiRequest(`/api/users/check-username/${username}`, { method: 'GET' });
  },

  checkEmail: async (email: string): Promise<ApiResponse<{ available: boolean }>> => {
    return apiRequest(`/api/users/check-email/${email}`, { method: 'GET' });
  },
};
