import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { DEFAULT_LIST_PAGE_SIZE, type ListPagination } from '../../utils/api/client';

/** Slice an in-memory list (e.g. after client-side filters) with page controls. */
export function useClientPagination<T>(
  items: T[],
  initialPageSize = DEFAULT_LIST_PAGE_SIZE,
  resetKey = ''
) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  const pagination: ListPagination = useMemo(
    () => ({
      page,
      limit: pageSize,
      totalItems,
      totalPages,
    }),
    [page, pageSize, totalItems, totalPages]
  );

  return {
    page,
    setPage,
    paginatedItems,
    pagination,
    pageSize,
    setPageSize: setPageSize as Dispatch<SetStateAction<number>>,
  };
}
