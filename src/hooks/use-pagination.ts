import { useState, useMemo, useCallback } from "react";

export interface UsePaginationOptions {
  total: number;
  initialPage?: number;
  initialPerPage?: number;
}

export interface UsePaginationResult {
  page: number;
  perPage: number;
  totalPages: number;
  total: number;
  offset: number;
  hasNext: boolean;
  hasPrev: boolean;
  isFirstPage: boolean;
  isLastPage: boolean;
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  setPerPage: (perPage: number) => void;
  goToPage: (page: number) => void;
  getPageRange: () => number[];
}

export function usePagination({
  total,
  initialPage = 1,
  initialPerPage = 20,
}: UsePaginationOptions): UsePaginationResult {
  const [page, setPageState] = useState(initialPage);
  const [perPage, setPerPageState] = useState(initialPerPage);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / perPage)), [total, perPage]);
  const offset = useMemo(() => (page - 1) * perPage, [page, perPage]);

  const setPage = useCallback(
    (newPage: number) => {
      setPageState(Math.max(1, Math.min(newPage, totalPages)));
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    setPageState((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setPageState((prev) => Math.max(prev - 1, 1));
  }, []);

  const firstPage = useCallback(() => setPageState(1), []);

  const lastPage = useCallback(() => setPageState(totalPages), [totalPages]);

  const setPerPage = useCallback(
    (newPerPage: number) => {
      setPerPageState(newPerPage);
      setPageState(1);
    },
    []
  );

  const goToPage = useCallback(
    (targetPage: number) => {
      setPageState(Math.max(1, Math.min(targetPage, totalPages)));
    },
    [totalPages]
  );

  const getPageRange = useCallback((): number[] => {
    const maxVisible = 7;
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, page - half);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [page, totalPages]);

  return {
    page,
    perPage,
    totalPages,
    total,
    offset,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    isFirstPage: page === 1,
    isLastPage: page === totalPages,
    setPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    setPerPage,
    goToPage,
    getPageRange,
  };
}

export function useInfiniteScroll<T>(
  initialItems: T[],
  fetchMore: (page: number) => Promise<T[]>,
  options?: { perPage?: number }
): {
  items: T[];
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  reset: () => void;
} {
  const [items, setItems] = useState<T[]>(initialItems);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const perPage = options?.perPage ?? 20;

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const newItems = await fetchMore(page);
      if (newItems.length < perPage) {
        setHasMore(false);
      }
      setItems((prev) => [...prev, ...newItems]);
      setPage((prev) => prev + 1);
    } finally {
      setIsLoading(false);
    }
  }, [page, isLoading, hasMore, fetchMore, perPage]);

  const reset = useCallback(() => {
    setItems(initialItems);
    setPage(1);
    setHasMore(true);
  }, [initialItems]);

  return { items, isLoading, hasMore, loadMore, reset };
}
