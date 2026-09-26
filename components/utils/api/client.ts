import type { ApiResponse } from './types';
import { appEnv } from '../env';
import {
  isAccessTokenExpired,
  triggerSessionExpired,
} from '../authSession';

export const API_BASE_URL = appEnv.apiBaseUrl;

const AUTH_TOKEN_KEY = 'rise-auth-token';
const REFRESH_TOKEN_KEY = 'rise-auth-refresh-token';

export const getAuthToken = (): string | null => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setRefreshToken = (token: string): void => {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
};

export const removeRefreshToken = (): void => {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const clearAuthTokens = (): void => {
  removeAuthToken();
  removeRefreshToken();
};

const AUTH_SKIP_REFRESH_PATHS = [
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
];

function isAuthSkipRefreshEndpoint(endpoint: string): boolean {
  return AUTH_SKIP_REFRESH_PATHS.some(
    (path) => endpoint === path || endpoint.startsWith(`${path}/`)
  );
}

let refreshInFlight: Promise<boolean> | null = null;

/** Exchange refresh token for a new access token (raw fetch — avoids apiRequest recursion). */
export async function refreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      let data: Record<string, unknown> = {};
      try {
        data = (await response.json()) as Record<string, unknown>;
      } catch {
        data = {};
      }

      if (!response.ok) {
        return false;
      }

      const payload = (data.data ?? data) as Record<string, unknown>;
      const accessToken = payload.token;
      const nextRefresh = payload.refreshToken;

      if (typeof accessToken !== 'string' || !accessToken) {
        return false;
      }

      setAuthToken(accessToken);
      if (typeof nextRefresh === 'string' && nextRefresh) {
        setRefreshToken(nextRefresh);
      }

      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

async function ensureValidAccessToken(endpoint: string): Promise<boolean> {
  if (isAuthSkipRefreshEndpoint(endpoint)) {
    return true;
  }

  const token = getAuthToken();
  if (!token) {
    return true;
  }

  if (!isAccessTokenExpired(token)) {
    return true;
  }

  const refreshed = await refreshAccessToken();
  if (!refreshed) {
    triggerSessionExpired();
    return false;
  }

  return true;
}

function shouldRetryAfterAuthFailure(
  status: number,
  hadToken: boolean,
  accessToken: string | null
): boolean {
  if (!hadToken) return false;
  if (status === 401) return true;
  if (status === 403 && accessToken && isAccessTokenExpired(accessToken)) {
    return true;
  }
  return false;
}

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

async function executeApiRequest<T>(
  endpoint: string,
  options: RequestInit,
  allowAuthRetry: boolean
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();
  const hadToken = Boolean(token);

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  };

  const activeToken = getAuthToken();
  if (activeToken) {
    headers['Authorization'] = `Bearer ${activeToken}`;
  }

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

  if (
    allowAuthRetry &&
    shouldRetryAfterAuthFailure(response.status, hadToken, activeToken)
  ) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return executeApiRequest<T>(endpoint, options, false);
    }
    triggerSessionExpired();
    return {
      success: false,
      error: 'Your session has expired. Please sign in again.',
    };
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
}

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const canProceed = await ensureValidAccessToken(endpoint);
    if (!canProceed) {
      return {
        success: false,
        error: 'Your session has expired. Please sign in again.',
      };
    }

    return await executeApiRequest<T>(endpoint, options, true);
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

/** Fetch binary content (images/videos) with the same auth as JSON API calls. */
export async function fetchAuthenticatedBlob(
  url: string,
  fallbackMime = 'application/octet-stream'
): Promise<Blob> {
  const token = getAuthToken();
  if (token && isAccessTokenExpired(token)) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      triggerSessionExpired();
      throw new Error('Your session has expired. Please sign in again.');
    }
  }

  const activeToken = getAuthToken();
  let response = await fetch(url, {
    method: 'GET',
    headers: activeToken ? { Authorization: `Bearer ${activeToken}` } : {},
  });

  if (
    (response.status === 401 || response.status === 403) &&
    activeToken &&
    getRefreshToken()
  ) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const retryToken = getAuthToken();
      response = await fetch(url, {
        method: 'GET',
        headers: retryToken ? { Authorization: `Bearer ${retryToken}` } : {},
      });
    } else {
      triggerSessionExpired();
      throw new Error('Your session has expired. Please sign in again.');
    }
  }

  if (!response.ok) {
    throw new Error(`Media request failed (${response.status})`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    throw new Error('Media not available');
  }

  const buffer = await response.arrayBuffer();
  const mime =
    contentType.split(';')[0]?.trim() ||
    fallbackMime;
  return new Blob([buffer], { type: mime });
}

export type ListPagination = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

export const DEFAULT_LIST_PAGE_SIZE = 20;

/** Parse standard backend pagination block from list API responses. */
export function parsePagination(data: unknown): ListPagination | null {
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;
  const raw = record.pagination;
  if (!raw || typeof raw !== 'object') return null;
  const pag = raw as Record<string, unknown>;
  const totalItems = Number(pag.totalItems ?? pag.total ?? 0);
  const limit = Number(pag.limit ?? DEFAULT_LIST_PAGE_SIZE);
  const totalPages = Math.max(
    1,
    Number(pag.totalPages ?? (Math.ceil(totalItems / limit) || 1))
  );
  return {
    page: Number(pag.page ?? 1),
    limit,
    totalItems,
    totalPages,
  };
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
