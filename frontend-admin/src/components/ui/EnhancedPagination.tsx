import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { Button } from './Button';
import { Select } from './Select';

interface EnhancedPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasNext: boolean;
  hasPrev: boolean;
  totalItems: number;
  itemsPerPage: number;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  showJumpToPage?: boolean;
  className?: string;
}

export const EnhancedPagination: React.FC<EnhancedPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  hasNext,
  hasPrev,
  totalItems,
  itemsPerPage,
  onItemsPerPageChange,
  pageSizeOptions = [10, 20, 50, 100],
  showPageSizeSelector = true,
  showJumpToPage = true,
  className = '',
}) => {
  const [jumpToPageValue, setJumpToPageValue] = useState('');

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const handleJumpToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNumber = parseInt(jumpToPageValue);
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      onPageChange(pageNumber);
      setJumpToPageValue('');
    }
  };

  const handlePageSizeChange = (newSize: string) => {
    const size = parseInt(newSize);
    if (onItemsPerPageChange) {
      onItemsPerPageChange(size);
    }
  };

  if (totalPages <= 1 && !showPageSizeSelector) {
    return (
      <div className={`flex items-center justify-between ${className}`}>
        <div className="text-sm text-gray-700">
          Showing {totalItems} {totalItems === 1 ? 'result' : 'results'}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main pagination controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-gray-700">
          Showing {startItem} to {endItem} of {totalItems} results
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            {/* First page */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              className="hidden sm:flex items-center gap-1"
              title="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>

            {/* Previous page */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={!hasPrev}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
            </Button>

            {/* Page numbers */}
            <div className="hidden sm:flex items-center gap-1">
              {getVisiblePages().map((page, index) => (
                <React.Fragment key={index}>
                  {page === '...' ? (
                    <span className="px-3 py-2 text-gray-500">...</span>
                  ) : (
                    <Button
                      variant={page === currentPage ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => onPageChange(page as number)}
                      className="min-w-[2.5rem]"
                    >
                      {page}
                    </Button>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Mobile page indicator */}
            <div className="sm:hidden text-sm text-gray-700 px-3 py-2">
              {currentPage} of {totalPages}
            </div>

            {/* Next page */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={!hasNext}
              className="flex items-center gap-1"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Last page */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="hidden sm:flex items-center gap-1"
              title="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Additional controls */}
      {(showPageSizeSelector || showJumpToPage) && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200">
          {/* Page size selector */}
          {showPageSizeSelector && onItemsPerPageChange && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Show:</span>
              <Select
                value={itemsPerPage.toString()}
                onChange={e => handlePageSizeChange(e.target.value)}
                options={pageSizeOptions.map(size => ({
                  value: size.toString(),
                  label: `${size} per page`,
                }))}
                className="w-auto min-w-[120px]"
              />
            </div>
          )}

          {/* Jump to page */}
          {showJumpToPage && totalPages > 5 && (
            <form
              onSubmit={handleJumpToPage}
              className="flex items-center gap-2"
            >
              <span className="text-sm text-gray-700">Go to page:</span>
              <input
                type="number"
                min="1"
                max={totalPages}
                value={jumpToPageValue}
                onChange={e => setJumpToPageValue(e.target.value)}
                className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={currentPage.toString()}
              />
              <Button
                type="submit"
                size="sm"
                variant="secondary"
                disabled={
                  !jumpToPageValue ||
                  parseInt(jumpToPageValue) < 1 ||
                  parseInt(jumpToPageValue) > totalPages
                }
              >
                Go
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
