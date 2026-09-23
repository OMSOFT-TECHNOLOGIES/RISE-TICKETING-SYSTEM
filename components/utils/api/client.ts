import type { ApiResponse } from './types';
import { appEnv } from '../env';

export const API_BASE_URL = appEnv.apiBaseUrl;

const AUTH_TOKEN_KEY = 'rise-auth-token';

export const getAuthToken = (): string | null => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

/** Normalize API error payloads to a display-safe string */
export function formatApiError(error: unknown, fallback = 'An unexpected error occurred'): string {
  if (error == null || error === '') return fallback;
  if (typeof error === 'string') return error;

  if (typeof error === 'object') {
    const record = error as Record<string, unknown>;

    if (typeof record.message === 'string') {
      const base = record.message;
      const details = record.details;
      if (details && typeof details === 'object') {
        if (Array.isArray(details)) {
          const fieldErrors = details
            .map((item) => {
              if (item && typeof item === 'object' && 'message' in item) {
                const entry = item as { field?: string; message?: string };
                return `${entry.field ?? 'Field'}: ${entry.message ?? ''}`;
              }
              return String(item);
            })
            .filter(Boolean)
            .join(', ');
          return fieldErrors ? `${base}. ${fieldErrors}` : base;
        }
        const fieldErrors = Object.entries(details as Record<string, unknown>)
          .map(([field, msg]) => `${field}: ${String(msg)}`)
          .join(', ');
        return fieldErrors ? `${base}. ${fieldErrors}` : base;
      }
      return base;
    }

    if (typeof record.error === 'string') return record.error;
    if (record.error && typeof record.error === 'object') {
      return formatApiError(record.error, fallback);
    }

    if (typeof record.code === 'string') {
      return record.code;
    }
  }

  return fallback;
}

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    let data: Record<string, unknown>;
    try {
      data = await response.json();
    } catch {
      if (!response.ok) {
        return {
          success: false,
          error: `Server error: ${response.status} ${response.statusText}`,
        };
      }
      data = {};
    }

    if (!response.ok) {
      const errorDetails = data.details ?? data.errors ?? null;
      const rawError =
        data.error ??
        (errorDetails ? { message: data.message, details: errorDetails } : data.message);

      return {
        success: false,
        error: formatApiError(rawError, `HTTP Error: ${response.status}`),
        details: errorDetails,
      };
    }

    if (data.success === false) {
      const errorDetails = data.details ?? data.errors ?? null;
      const rawError =
        data.error ??
        (errorDetails ? { message: data.message, details: errorDetails } : data.message);

      return {
        success: false,
        error: formatApiError(rawError, 'Request failed'),
        details: errorDetails,
      };
    }

    return {
      success: true,
      data: (data.data ?? data) as T,
      message: typeof data.message === 'string' ? data.message : undefined,
    };
  } catch (error) {
    console.error('API Request Error:', error);

    let errorMessage = 'Network error. Please check your connection.';

    if (error instanceof TypeError && error.message.includes('fetch')) {
      errorMessage = `Unable to connect to server. Please ensure the backend is running on ${API_BASE_URL}`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/** Read total item count from paginated or statistics API responses */
export function extractListTotal(data: unknown, entityKey?: string): number {
  if (Array.isArray(data)) return data.length;
  if (!data || typeof data !== 'object') return 0;

  const record = data as Record<string, unknown>;
  const pagination = record.pagination as Record<string, unknown> | undefined;

  if (pagination && typeof pagination.totalItems === 'number') {
    return pagination.totalItems;
  }

  if (entityKey && Array.isArray(record[entityKey])) {
    return record[entityKey].length;
  }

  if (Array.isArray(record.items)) {
    return record.items.length;
  }

  return 0;
}

/** Read a numeric KPI from statistics payloads */
export function extractStatCount(data: unknown, keys: string[]): number {
  if (typeof data === 'number') return data;
  if (!data || typeof data !== 'object') return 0;

  const record = data as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number') return value;
  }

  return 0;
}

/** Extract list data from common API response shapes */
export function parseListResponse<T>(
  data: unknown,
  entityKey?: string
): T[] {
  if (Array.isArray(data)) {
    return data as T[];
  }

  if (data && typeof data === 'object' && entityKey) {
    const record = data as Record<string, unknown>;
    const items = record[entityKey];
    if (Array.isArray(items)) {
      return items as T[];
    }
  }

  return [];
}
