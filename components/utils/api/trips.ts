import { apiRequest } from './client';
import type { ApiResponse } from './types';

export const tripApi = {
  getAll: async (params?: {
    stationId?: string;
    driverId?: string;
    status?: string;
    date?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.stationId) queryParams.append('stationId', params.stationId);
    if (params?.driverId) queryParams.append('driverId', params.driverId);
    if (params?.status && params.status !== 'all') {
      queryParams.append('status', params.status);
    }
    if (params?.date) queryParams.append('date', params.date);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    return apiRequest(`/api/trips${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  getById: async (id: string): Promise<ApiResponse> => {
    return apiRequest(`/api/trips/${id}`, { method: 'GET' });
  },

  create: async (tripData: unknown): Promise<ApiResponse> => {
    return apiRequest('/api/trips', {
      method: 'POST',
      body: JSON.stringify(tripData),
    });
  },

  update: async (id: string, tripData: unknown): Promise<ApiResponse> => {
    return apiRequest(`/api/trips/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tripData),
    });
  },

  updateStatus: async (
    id: string,
    status: string,
    statusReason?: string
  ): Promise<ApiResponse> => {
    return apiRequest(`/api/trips/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, statusReason }),
    });
  },

  issuePoliceCheck: async (id: string): Promise<ApiResponse> => {
    return apiRequest(`/api/trips/${id}/police-check`, { method: 'POST' });
  },

  delete: async (id: string): Promise<ApiResponse> => {
    return apiRequest(`/api/trips/${id}`, { method: 'DELETE' });
  },

  bookPassenger: async (id: string, bookingData: unknown): Promise<ApiResponse> => {
    return apiRequest(`/api/trips/${id}/book`, {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  },

  getStatistics: async (params?: {
    stationId?: string;
    region?: string;
    district?: string;
    period?: string;
    from?: string;
    to?: string;
    date?: string;
  }): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.stationId) queryParams.append('stationId', params.stationId);
    if (params?.region) queryParams.append('region', params.region);
    if (params?.district) queryParams.append('district', params.district);
    if (params?.period) queryParams.append('period', params.period);
    if (params?.from) queryParams.append('from', params.from);
    if (params?.to) queryParams.append('to', params.to);
    if (params?.date) queryParams.append('date', params.date);

    const queryString = queryParams.toString();
    return apiRequest(`/api/trips/statistics${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  getCommissionTiers: async (): Promise<ApiResponse> => {
    return apiRequest('/api/trip-tiers', { method: 'GET' });
  },

  updateCommissionTiers: async (payload: unknown): Promise<ApiResponse> => {
    return apiRequest('/api/trip-tiers', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  getTierInfo: async (params: {
    fare: number;
    passengerCount: number;
  }): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('fare', params.fare.toString());
    queryParams.append('passengerCount', params.passengerCount.toString());

    return apiRequest(`/api/trips/tier-info?${queryParams.toString()}`, {
      method: 'GET',
    });
  },
};
