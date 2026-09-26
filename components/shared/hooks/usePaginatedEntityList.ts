import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { notify } from '../../utils/notify';
import type { ApiResponse } from '../../utils/api/types';
import {
  DEFAULT_LIST_PAGE_SIZE,
  formatApiError,
  parseListResponse,
  parsePagination,
  type ListPagination,
} from '../../utils/api/client';

interface UsePaginatedEntityListOptions<T> {
  fetchFn: (page: number, limit: number) => Promise<ApiResponse>;
  entityKey?: string;
  pageSize?: number;
  errorMessage?: string;
  toastOnError?: boolean;
  /** When any of these change, page resets to 1 */
  resetPageDeps?: unknown[];
}

interface UsePaginatedEntityListResult<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
  refresh: (options?: { toastOnError?: boolean }) => Promise<void>;
  setItems: Dispatch<SetStateAction<T[]>>;
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  pagination: ListPagination | null;
  pageSize: number;
}

export function usePaginatedEntityList<T>({
  fetchFn,
  entityKey,
  pageSize = DEFAULT_LIST_PAGE_SIZE,
  errorMessage = 'Failed to load data',
  toastOnError = false,
  resetPageDeps = [],
}: UsePaginatedEntityListOptions<T>): UsePaginatedEntityListResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<ListPagination | null>(null);

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- explicit reset keys only
  }, resetPageDeps);

  const refresh = useCallback(
    async (options?: { toastOnError?: boolean }) => {
      const shouldToast = options?.toastOnError ?? toastOnError;

      try {
        setLoading(true);
        setError(null);

        const response = await fetchFn(page, pageSize);

        if (response.success && response.data !== undefined) {
          const list = parseListResponse<T>(response.data, entityKey);
          setItems(list);
          const pag =
            parsePagination(response.data) ??
            ({
              page,
              limit: pageSize,
              totalItems: list.length,
              totalPages: 1,
            } satisfies ListPagination);
          setPagination(pag);
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
    [fetchFn, page, pageSize, entityKey, errorMessage, toastOnError]
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    items,
    loading,
    error,
    isSubmitting,
    setIsSubmitting,
    refresh,
    setItems,
    page,
    setPage,
    pagination,
    pageSize,
  };
}
