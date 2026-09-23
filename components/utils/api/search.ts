import { apiRequest } from './client';
import type { ApiResponse } from './types';

export const searchApi = {
  search: async (query: string): Promise<ApiResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('q', query);

    return apiRequest(`/api/search?${queryParams.toString()}`, { method: 'GET' });
  },
};
