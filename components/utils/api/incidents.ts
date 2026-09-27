import { apiRequest, fetchAuthenticatedBlob } from './client';
import type { ApiResponse } from './types';
import {
  incidentEvidenceDownloadUrl,
  incidentEvidenceFileName,
} from '../../IncidentManagement/utils/incidentEvidence';

export const incidentApi = {
  getAll: async (params?: {
    search?: string;
    type?: string;
    status?: string;
    severity?: string;
    region?: string;
    district?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.type && params.type !== 'all') queryParams.append('type', params.type);
    if (params?.status && params.status !== 'all') {
      queryParams.append('status', params.status);
    }
    if (params?.severity && params.severity !== 'all') {
      queryParams.append('severity', params.severity);
    }
    if (params?.region) queryParams.append('region', params.region);
    if (params?.district) queryParams.append('district', params.district);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    return apiRequest(`/api/incidents${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  getById: async (id: string): Promise<ApiResponse> => {
    return apiRequest(`/api/incidents/${id}`, { method: 'GET' });
  },

  getClaimOptions: async (params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    const queryString = queryParams.toString();
    return apiRequest(`/api/incidents/claim-options${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  getClaimantCandidates: async (incidentId: string): Promise<ApiResponse> => {
    return apiRequest(
      `/api/incidents/${encodeURIComponent(incidentId)}/claimant-candidates`,
      { method: 'GET' }
    );
  },

  create: async (incidentData: unknown): Promise<ApiResponse> => {
    return apiRequest('/api/incidents', {
      method: 'POST',
      body: JSON.stringify(incidentData),
    });
  },

  update: async (id: string, incidentData: unknown): Promise<ApiResponse> => {
    return apiRequest(`/api/incidents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(incidentData),
    });
  },

  updateStatus: async (
    id: string,
    data: { status: string; assignedTo?: string }
  ): Promise<ApiResponse> => {
    return apiRequest(`/api/incidents/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<ApiResponse> => {
    return apiRequest(`/api/incidents/${id}`, { method: 'DELETE' });
  },

  getStatistics: async (): Promise<ApiResponse> => {
    return apiRequest('/api/incidents/statistics', { method: 'GET' });
  },

  uploadEvidence: async (id: string, file: File): Promise<ApiResponse> => {
    const form = new FormData();
    form.append('file', file);
    return apiRequest(`/api/incidents/${encodeURIComponent(id)}/evidence`, {
      method: 'POST',
      body: form,
    });
  },

  fetchEvidenceBlob: async (
    incidentId: string,
    storedPath: string,
    fallbackMime?: string
  ): Promise<Blob> => {
    const url = incidentEvidenceDownloadUrl(incidentId, storedPath);
    const name = incidentEvidenceFileName(storedPath).toLowerCase();
    let mime = fallbackMime ?? 'application/octet-stream';
    if (/\.(jpe?g)$/.test(name)) mime = 'image/jpeg';
    else if (/\.png$/.test(name)) mime = 'image/png';
    else if (/\.gif$/.test(name)) mime = 'image/gif';
    else if (/\.webp$/.test(name)) mime = 'image/webp';
    else if (/\.mp4$/.test(name)) mime = 'video/mp4';
    else if (/\.webm$/.test(name)) mime = 'video/webm';
    else if (/\.mov$/.test(name)) mime = 'video/quicktime';
    return fetchAuthenticatedBlob(url, mime);
  },

  evidencePreviewUrl: (incidentId: string, storedPath: string): string =>
    incidentEvidenceDownloadUrl(incidentId, storedPath),

  confirmPublicReport: async (
    id: string,
    data: { confirmationStatus: 'confirmed' | 'rejected'; confirmedByAgency: string }
  ): Promise<ApiResponse> => {
    return apiRequest(`/api/incidents/${id}/confirm`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  getMap: async (params?: {
    region?: string;
    status?: string;
    severity?: string;
  }): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.region) queryParams.append('region', params.region);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.severity) queryParams.append('severity', params.severity);

    const queryString = queryParams.toString();
    return apiRequest(`/api/incidents/map${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },
};
