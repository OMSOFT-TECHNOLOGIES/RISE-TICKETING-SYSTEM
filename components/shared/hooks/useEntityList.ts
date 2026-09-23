import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { notify } from '../../utils/notify';
import type { ApiResponse } from '../../utils/api/types';
import { formatApiError, parseListResponse } from '../../utils/api/client';

interface UseEntityListOptions<T> {
  fetchFn: () => Promise<ApiResponse>;
  entityKey?: string;
  errorMessage?: string;
  initialData?: T[];
  /** Only show toast on fetch errors when explicitly enabled (e.g. user-triggered refresh) */
  toastOnError?: boolean;
}

interface UseEntityListResult<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
  refresh: (options?: { toastOnError?: boolean }) => Promise<void>;
  setItems: Dispatch<SetStateAction<T[]>>;
}

export function useEntityList<T>({
  fetchFn,
  entityKey,
  errorMessage = 'Failed to load data',
  initialData = [],
  toastOnError = false,
}: UseEntityListOptions<T>): UseEntityListResult<T> {
  const [items, setItems] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refresh = useCallback(
    async (options?: { toastOnError?: boolean }) => {
      const shouldToast = options?.toastOnError ?? toastOnError;

      try {
        setLoading(true);
        setError(null);

        const response = await fetchFn();

        if (response.success && response.data !== undefined) {
          setItems(parseListResponse<T>(response.data, entityKey));
        } else {
          const message = formatApiError(response.error, errorMessage);
          setError(message);
          if (shouldToast) {
            notify.error(message);
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : errorMessage;
        setError(message);
        if (shouldToast) {
          notify.error(message);
        }
      } finally {
        setLoading(false);
      }
    },
    [fetchFn, entityKey, errorMessage, toastOnError]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    items,
    loading,
    error,
    isSubmitting,
    setIsSubmitting,
    refresh,
    setItems,
  };
}
