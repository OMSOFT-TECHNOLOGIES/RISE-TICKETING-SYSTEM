import {
  apiRequest,
  clearAuthTokens,
  removeAuthToken,
  setAuthToken,
  setRefreshToken,
} from './client';
import type { ApiResponse, LoginResponse } from './types';

export const authApi = {
  login: async (username: string, password: string): Promise<ApiResponse<LoginResponse>> => {
    const response = await apiRequest<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (response.success && response.data?.token) {
      setAuthToken(response.data.token);
      if (response.data.refreshToken) {
        setRefreshToken(response.data.refreshToken);
      }
    }

    return response;
  },

  refresh: async (refreshToken: string): Promise<ApiResponse<LoginResponse>> => {
    return apiRequest<LoginResponse>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },

  logout: async (): Promise<ApiResponse> => {
    const response = await apiRequest('/api/auth/logout', {
      method: 'POST',
    });

    clearAuthTokens();
    return response;
  },

  forgotPassword: async (email: string): Promise<ApiResponse> => {
    return apiRequest('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  verifyResetToken: async (
    token: string
  ): Promise<ApiResponse<{ valid: boolean; email: string; expiresAt: string }>> => {
    return apiRequest(`/api/auth/verify-reset-token/${token}`, {
      method: 'GET',
    });
  },

  resetPassword: async (token: string, newPassword: string): Promise<ApiResponse> => {
    return apiRequest('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  },

  getCurrentUser: async (): Promise<ApiResponse> => {
    return apiRequest('/api/auth/me', {
      method: 'GET',
    });
  },

  updateProfile: async (profileData: {
    fullName?: string;
    email?: string;
    phone?: string;
    bio?: string;
  }): Promise<ApiResponse> => {
    return apiRequest('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(profileData),
    });
  },

  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse> => {
    return apiRequest('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
