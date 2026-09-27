import { apiRequest, fetchAuthenticatedBlob } from './client';
import type { ApiResponse } from './types';
import {
  claimDocumentDownloadUrl,
  guessClaimDocumentMime,
} from '../../IncidentClaims/claimDocuments';

export const incidentClaimApi = {
  getAll: async (params?: {
    search?: string;
    status?: string;
    incidentId?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status && params.status !== 'all') {
      queryParams.append('status', params.status);
    }
    if (params?.incidentId) queryParams.append('incidentId', params.incidentId);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    return apiRequest(`/api/incident-claims${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  getById: async (id: string): Promise<ApiResponse> => {
    return apiRequest(`/api/incident-claims/${id}`, { method: 'GET' });
  },

  create: async (claimData: unknown): Promise<ApiResponse> => {
    return apiRequest('/api/incident-claims', {
      method: 'POST',
      body: JSON.stringify(claimData),
    });
  },

  updateStatus: async (id: string, data: unknown): Promise<ApiResponse> => {
    return apiRequest(`/api/incident-claims/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  investigatorReview: async (
    id: string,
    data: { approved: boolean; notes?: string }
  ): Promise<ApiResponse> => {
    return apiRequest(`/api/incident-claims/${id}/investigator-review`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  uploadDocument: async (
    id: string,
    file: File,
    category: 'evidence' | 'medical_receipt' | 'medical_report'
  ): Promise<ApiResponse> => {
    const form = new FormData();
    form.append('file', file);
    const query = new URLSearchParams({ category });
    return apiRequest(`/api/incident-claims/${encodeURIComponent(id)}/documents?${query}`, {
      method: 'POST',
      body: form,
    });
  },

  getCompensationTiers: async (): Promise<ApiResponse> => {
    return apiRequest('/api/incident-claims/compensation-tiers', { method: 'GET' });
  },

  updateCompensationTiers: async (tiers: unknown): Promise<ApiResponse> => {
    return apiRequest('/api/incident-claims/compensation-tiers', {
      method: 'PUT',
      body: JSON.stringify({ tiers }),
    });
  },

  getStatistics: async (): Promise<ApiResponse> => {
    return apiRequest('/api/incident-claims/statistics', { method: 'GET' });
  },

  fetchDocumentBlob: async (claimId: string, storedPath: string): Promise<Blob> => {
    const url = claimDocumentDownloadUrl(claimId, storedPath);
    const mime = guessClaimDocumentMime(storedPath);
    return fetchAuthenticatedBlob(url, mime);
  },
};
