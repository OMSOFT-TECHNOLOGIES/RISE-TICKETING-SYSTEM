import { apiRequest } from './client';
import type { ApiResponse } from './types';

export const vehicleApi = {
  getAll: async (params?: {
    stationId?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    /** Trip scheduling: include vehicles outside the caller’s region/district. */
    allRegions?: boolean;
  }): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.stationId) queryParams.append('stationId', params.stationId);
    if (params?.allRegions) queryParams.append('allRegions', 'true');
    if (params?.status && params.status !== 'all') {
      queryParams.append('status', params.status);
    }
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    return apiRequest(`/api/vehicles${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  getById: async (id: string): Promise<ApiResponse> => {
    return apiRequest(`/api/vehicles/${id}`, { method: 'GET' });
  },

  getLatestTripByRegistration: async (registrationNumber: string): Promise<ApiResponse> => {
    const query = new URLSearchParams({ registrationNumber: registrationNumber.trim() });
    return apiRequest(`/api/vehicles/latest-trip?${query}`, { method: 'GET' });
  },

  create: async (vehicleData: unknown): Promise<ApiResponse> => {
    return apiRequest('/api/vehicles', {
      method: 'POST',
      body: JSON.stringify(vehicleData),
    });
  },

  update: async (id: string, vehicleData: unknown): Promise<ApiResponse> => {
    return apiRequest(`/api/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(vehicleData),
    });
  },

  delete: async (id: string): Promise<ApiResponse> => {
    return apiRequest(`/api/vehicles/${id}`, { method: 'DELETE' });
  },

  getStatistics: async (params?: {
    stationId?: string;
    region?: string;
    district?: string;
  }): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.stationId) queryParams.append('stationId', params.stationId);
    if (params?.region) queryParams.append('region', params.region);
    if (params?.district) queryParams.append('district', params.district);
    const queryString = queryParams.toString();
    return apiRequest(
      `/api/vehicles/statistics${queryString ? `?${queryString}` : ''}`,
      { method: 'GET' }
    );
  },

  getBookable: async (params?: {
    search?: string;
    allRegions?: boolean;
  }): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.allRegions) queryParams.append('allRegions', 'true');
    const queryString = queryParams.toString();
    return apiRequest(
      `/api/vehicles/bookable${queryString ? `?${queryString}` : ''}`,
      { method: 'GET' }
    );
  },

  assignDriver: async (
    vehicleId: string | number,
    driverId?: string | null
  ): Promise<ApiResponse> => {
    return apiRequest(`/api/vehicles/${vehicleId}/assign-driver`, {
      method: 'POST',
      body: JSON.stringify({ driverId: driverId ?? null }),
    });
  },

  updateMileage: async (vehicleId: string, mileage: number): Promise<ApiResponse> => {
    return apiRequest(`/api/vehicles/${vehicleId}/mileage`, {
      method: 'PATCH',
      body: JSON.stringify({ mileage }),
    });
  },

  recordMaintenance: async (
    vehicleId: string,
    maintenanceData: unknown
  ): Promise<ApiResponse> => {
    return apiRequest(`/api/vehicles/${vehicleId}/maintenance`, {
      method: 'POST',
      body: JSON.stringify(maintenanceData),
    });
  },
};
