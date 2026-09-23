import { apiRequest } from './client';
import type { ApiResponse } from './types';

export const accountApi = {
  getStatistics: async (period?: string): Promise<ApiResponse> => {
    const queryString = period ? `?period=${period}` : '';
    return apiRequest(`/api/accounts/statistics${queryString}`, { method: 'GET' });
  },

  getTransactions: async (params?: {
    search?: string;
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status && params.status !== 'all') {
      queryParams.append('status', params.status);
    }
    if (params?.type && params.type !== 'all') queryParams.append('type', params.type);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    return apiRequest(
      `/api/accounts/transactions${queryString ? `?${queryString}` : ''}`,
      { method: 'GET' }
    );
  },

  createTransaction: async (transactionData: unknown): Promise<ApiResponse> => {
    return apiRequest('/api/accounts/transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  },

  updateTransactionStatus: async (id: string, data: unknown): Promise<ApiResponse> => {
    return apiRequest(`/api/accounts/transactions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  getRevenueSources: async (params?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status && params.status !== 'all') {
      queryParams.append('status', params.status);
    }
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    return apiRequest(
      `/api/accounts/revenue-sources${queryString ? `?${queryString}` : ''}`,
      { method: 'GET' }
    );
  },

  createRevenueSource: async (sourceData: unknown): Promise<ApiResponse> => {
    return apiRequest('/api/accounts/revenue-sources', {
      method: 'POST',
      body: JSON.stringify(sourceData),
    });
  },

  updateRevenueSource: async (id: string, sourceData: unknown): Promise<ApiResponse> => {
    return apiRequest(`/api/accounts/revenue-sources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(sourceData),
    });
  },

  getBudgets: async (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.status && params.status !== 'all') {
      queryParams.append('status', params.status);
    }
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    return apiRequest(`/api/accounts/budgets${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  createBudget: async (budgetData: unknown): Promise<ApiResponse> => {
    return apiRequest('/api/accounts/budgets', {
      method: 'POST',
      body: JSON.stringify(budgetData),
    });
  },

  getTrends: async (year?: number): Promise<ApiResponse> => {
    const queryString = year ? `?year=${year}` : '';
    return apiRequest(`/api/accounts/analytics/trends${queryString}`, { method: 'GET' });
  },

  getExpenseBreakdown: async (period?: string): Promise<ApiResponse> => {
    const queryString = period ? `?period=${period}` : '';
    return apiRequest(`/api/accounts/analytics/expense-breakdown${queryString}`, {
      method: 'GET',
    });
  },

  exportReport: async (exportData: { format: string; tab: string }): Promise<ApiResponse> => {
    return apiRequest('/api/accounts/reports/export', {
      method: 'POST',
      body: JSON.stringify(exportData),
    });
  },
};
