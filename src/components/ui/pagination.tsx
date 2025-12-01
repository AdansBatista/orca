'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  total?: number;
  pageSize?: number;
  showInfo?: boolean;
  className?: string;
}

/**
 * Reusable pagination component with page numbers and navigation buttons.
 *
 * @example
 * ```tsx
 * <Pagination
 *   page={currentPage}
 *   totalPages={10}
 *   onPageChange={setCurrentPage}
 *   total={100}
 *   pageSize={10}
 *   showInfo
 * />
 * ```
 */
export function Pagination({
  page,
  totalPages,
  onPageChange,
  total,
  pageSize,
  showInfo = true,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // Calculate page range to display
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 7; // Max page buttons to show

    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (page > 3) {
        pages.push('ellipsis');
      }

      // Show pages around current
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (page < totalPages - 2) {
        pages.push('ellipsis');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  // Calculate showing range
  const startItem = total && pageSize ? (page - 1) * pageSize + 1 : 0;
  const endItem = total && pageSize ? Math.min(page * pageSize, total) : 0;

  return (
    <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-4', className)}>
      {/* Info text */}
      {showInfo && total !== undefined && pageSize !== undefined && (
        <p className="text-sm text-muted-foreground whitespace-nowrap">
          Showing {startItem} to {endItem} of {total} results
        </p>
      )}

      {/* Page navigation */}
      <div className="flex items-center gap-1">
        {/* First page */}
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          className="hidden sm:inline-flex"
          title="First page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Previous page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        {/* Page numbers - hidden on mobile */}
        <div className="hidden sm:flex items-center gap-1">
          {pages.map((pageNum, idx) => (
            pageNum === 'ellipsis' ? (
              <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">
                ...
              </span>
            ) : (
              <Button
                key={pageNum}
                variant={pageNum === page ? 'default' : 'outline'}
                size="icon-sm"
                onClick={() => onPageChange(pageNum)}
                className={cn(
                  'min-w-[32px]',
                  pageNum === page && 'pointer-events-none'
                )}
              >
                {pageNum}
              </Button>
            )
          ))}
        </div>

        {/* Mobile page indicator */}
        <span className="sm:hidden text-sm text-muted-foreground px-2">
          {page} / {totalPages}
        </span>

        {/* Next page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="gap-1"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Last page */}
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
          className="hidden sm:inline-flex"
          title="Last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
