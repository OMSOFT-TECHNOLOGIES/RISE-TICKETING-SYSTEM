import { apiRequest } from './client';
import type { ApiResponse } from './types';

export const passengerApi = {
  getAll: async (params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    return apiRequest(`/api/passengers${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  getById: async (id: string): Promise<ApiResponse> => {
    return apiRequest(`/api/passengers/${id}`, { method: 'GET' });
  },

  lookupByPhone: async (phone: string): Promise<ApiResponse> => {
    const query = new URLSearchParams({ phone: phone.trim() });
    return apiRequest(`/api/passengers/lookup?${query.toString()}`, {
      method: 'GET',
    });
  },

  create: async (passengerData: unknown): Promise<ApiResponse> => {
    return apiRequest('/api/passengers', {
      method: 'POST',
      body: JSON.stringify(passengerData),
    });
  },

  update: async (id: string, passengerData: unknown): Promise<ApiResponse> => {
    return apiRequest(`/api/passengers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(passengerData),
    });
  },

  getTripPassengers: async (
    tripId: string,
    params?: { status?: string; search?: string }
  ): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.status && params.status !== 'all') {
      queryParams.append('status', params.status);
    }
    if (params?.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    return apiRequest(
      `/api/trips/${tripId}/passengers${queryString ? `?${queryString}` : ''}`,
      { method: 'GET' }
    );
  },

  addToTrip: async (tripId: string, passengerData: unknown): Promise<ApiResponse> => {
    return apiRequest(`/api/trips/${tripId}/passengers`, {
      method: 'POST',
      body: JSON.stringify(passengerData),
    });
  },

  updateTripPassengerStatus: async (
    tripId: string,
    id: string,
    status: string
  ): Promise<ApiResponse> => {
    return apiRequest(`/api/trips/${tripId}/passengers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  updateTripPassenger: async (
    tripId: string,
    id: string,
    data: Record<string, unknown>
  ): Promise<ApiResponse> => {
    return apiRequest(`/api/trips/${tripId}/passengers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  removeFromTrip: async (tripId: string, id: string): Promise<ApiResponse> => {
    return apiRequest(`/api/trips/${tripId}/passengers/${id}`, {
      method: 'DELETE',
    });
  },

  exportTripPassengers: async (
    tripId: string,
    format?: 'csv' | 'excel'
  ): Promise<ApiResponse> => {
    const queryString = format ? `?format=${format}` : '';
    return apiRequest(`/api/trips/${tripId}/passengers/export${queryString}`, {
      method: 'GET',
    });
  },
};
