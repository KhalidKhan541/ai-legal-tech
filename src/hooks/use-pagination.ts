"use client"

import { useState, useMemo, useCallback } from "react"

interface UsePaginationOptions {
  totalItems: number
  initialPage?: number
  initialPageSize?: number
  pageSizeOptions?: number[]
}

interface UsePaginationResult {
  currentPage: number
  pageSize: number
  totalPages: number
  totalItems: number
  startIndex: number
  endIndex: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  nextPage: () => void
  previousPage: () => void
  firstPage: () => void
  lastPage: () => void
}

export function usePagination({
  totalItems,
  initialPage = 1,
  initialPageSize = 10,
}: UsePaginationOptions): UsePaginationResult {
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const totalPages = useMemo(
    () => Math.ceil(totalItems / pageSize),
    [totalItems, pageSize]
  )

  const startIndex = useMemo(
    () => (currentPage - 1) * pageSize,
    [currentPage, pageSize]
  )

  const endIndex = useMemo(
    () => Math.min(startIndex + pageSize - 1, totalItems - 1),
    [startIndex, pageSize, totalItems]
  )

  const hasNextPage = currentPage < totalPages
  const hasPreviousPage = currentPage > 1

  const setPage = useCallback(
    (page: number) => {
      const validPage = Math.max(1, Math.min(page, totalPages))
      setCurrentPage(validPage)
    },
    [totalPages]
  )

  const handlePageSizeChange = useCallback(
    (size: number) => {
      setPageSize(size)
      const newTotalPages = Math.ceil(totalItems / size)
      if (currentPage > newTotalPages) {
        setCurrentPage(newTotalPages || 1)
      }
    },
    [totalItems, currentPage]
  )

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage((prev) => prev + 1)
    }
  }, [hasNextPage])

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setCurrentPage((prev) => prev - 1)
    }
  }, [hasPreviousPage])

  const firstPage = useCallback(() => {
    setCurrentPage(1)
  }, [])

  const lastPage = useCallback(() => {
    setCurrentPage(totalPages)
  }, [totalPages])

  return {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    hasNextPage,
    hasPreviousPage,
    setPage,
    setPageSize: handlePageSizeChange,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
  }
}

interface UseCursorPaginationOptions {
  initialCursor?: string | null
}

interface UseCursorPaginationResult {
  cursor: string | null
  setCursor: (cursor: string | null) => void
  nextPage: (nextCursor: string) => void
  reset: () => void
  hasCursor: boolean
}

export function useCursorPagination({
  initialCursor = null,
}: UseCursorPaginationOptions = {}): UseCursorPaginationResult {
  const [cursor, setCursor] = useState<string | null>(initialCursor)

  const nextPage = useCallback((nextCursor: string) => {
    setCursor(nextCursor)
  }, [])

  const reset = useCallback(() => {
    setCursor(initialCursor)
  }, [initialCursor])

  return {
    cursor,
    setCursor,
    nextPage,
    reset,
    hasCursor: cursor !== null,
  }
}

interface UseInfiniteScrollOptions {
  threshold?: number
  enabled?: boolean
}

interface UseInfiniteScrollResult {
  containerRef: React.RefObject<HTMLDivElement>
  loadMore: () => void
  isLoading: boolean
}

export function useInfiniteScroll({
  threshold = 200,
  enabled = true,
}: UseInfiniteScrollOptions = {}): UseInfiniteScrollResult {
  const [isLoading, setIsLoading] = useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const loadMore = useCallback(() => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 1000)
  }, [])

  React.useEffect(() => {
    if (!enabled || !containerRef.current) return

    const container = containerRef.current

    const handleScroll = () => {
      if (
        container.scrollHeight - container.scrollTop - container.clientHeight <
        threshold
      ) {
        loadMore()
      }
    }

    container.addEventListener("scroll", handleScroll)
    return () => container.removeEventListener("scroll", handleScroll)
  }, [enabled, threshold, loadMore])

  return { containerRef, loadMore, isLoading }
}
