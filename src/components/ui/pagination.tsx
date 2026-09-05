"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  siblingCount?: number
  showFirstLast?: boolean
  disabled?: boolean
  className?: string
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  showFirstLast = true,
  disabled = false,
  className,
}: PaginationProps) {
  const paginationRange = React.useMemo(() => {
    const totalPageNumbers = siblingCount * 2 + 5

    if (totalPageNumbers >= totalPages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1)
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages)

    const shouldShowLeftDots = leftSiblingIndex > 2
    const shouldShowRightDots = rightSiblingIndex < totalPages - 2

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount
      const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1)
      return [...leftRange, "dots", totalPages]
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount
      const rightRange = Array.from(
        { length: rightItemCount },
        (_, i) => totalPages - rightItemCount + i + 1
      )
      return [1, "dots", ...rightRange]
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i
      )
      return [1, "dots", ...middleRange, "dots", totalPages]
    }

    return []
  }, [currentPage, totalPages, siblingCount])

  const handlePageChange = (page: number) => {
    if (!disabled && page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page)
    }
  }

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={cn("flex items-center justify-center", className)}
    >
      <ul className="flex items-center gap-1">
        {showFirstLast && (
          <li>
            <button
              onClick={() => handlePageChange(1)}
              disabled={disabled || currentPage === 1}
              className={cn(
                "flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors",
                "hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-50"
              )}
            >
              First
            </button>
          </li>
        )}
        <li>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={disabled || currentPage === 1}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
              "hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-50"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </li>
        {paginationRange.map((page, index) => {
          if (page === "dots") {
            return (
              <li key={`dots-${index}`}>
                <span className="flex h-9 w-9 items-center justify-center">
                  <MoreHorizontal className="h-4 w-4 text-slate-400" />
                </span>
              </li>
            )
          }

          const pageNumber = page as number
          const isActive = pageNumber === currentPage

          return (
            <li key={pageNumber}>
              <button
                onClick={() => handlePageChange(pageNumber)}
                disabled={disabled}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-slate-900 text-white"
                    : "hover:bg-slate-100",
                  disabled && "pointer-events-none opacity-50"
                )}
              >
                {pageNumber}
              </button>
            </li>
          )
        })}
        <li>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={disabled || currentPage === totalPages}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
              "hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-50"
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </li>
        {showFirstLast && (
          <li>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={disabled || currentPage === totalPages}
              className={cn(
                "flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors",
                "hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-50"
              )}
            >
              Last
            </button>
          </li>
        )}
      </ul>
    </nav>
  )
}

interface PaginationInfoProps {
  currentPage: number
  pageSize: number
  totalItems: number
  className?: string
}

function PaginationInfo({
  currentPage,
  pageSize,
  totalItems,
  className,
}: PaginationInfoProps) {
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  return (
    <p className={cn("text-sm text-slate-500", className)}>
      Showing <span className="font-medium">{startItem}</span> to{" "}
      <span className="font-medium">{endItem}</span> of{" "}
      <span className="font-medium">{totalItems}</span> results
    </p>
  )
}

export { Pagination, PaginationInfo }
