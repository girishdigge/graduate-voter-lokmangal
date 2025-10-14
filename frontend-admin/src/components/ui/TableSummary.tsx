import React from 'react';
import { FileText, Filter, Search } from 'lucide-react';

interface TableSummaryProps {
  totalItems: number;
  filteredItems: number;
  currentPage: number;
  itemsPerPage: number;
  hasActiveFilters: boolean;
  hasActiveSearch: boolean;
  itemType: string; // e.g., "voters", "references"
  className?: string;
}

export const TableSummary: React.FC<TableSummaryProps> = ({
  totalItems,
  filteredItems,
  currentPage,
  itemsPerPage,
  hasActiveFilters,
  hasActiveSearch,
  itemType,
  className = '',
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, filteredItems);
  const isFiltered = hasActiveFilters || hasActiveSearch;

  return (
    <div
      className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Main summary */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-400" />
            <div>
              <div className="text-sm font-medium text-gray-900">
                {isFiltered ? (
                  <>
                    Showing {startItem}-{endItem} of {filteredItems} filtered{' '}
                    {itemType}
                  </>
                ) : (
                  <>
                    Showing {startItem}-{endItem} of {totalItems} {itemType}
                  </>
                )}
              </div>
              {isFiltered && (
                <div className="text-xs text-gray-500">
                  ({totalItems} total {itemType})
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filter indicators */}
        {isFiltered && (
          <div className="flex items-center gap-2">
            {hasActiveSearch && (
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                <Search className="h-3 w-3" />
                <span>Search active</span>
              </div>
            )}
            {hasActiveFilters && (
              <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                <Filter className="h-3 w-3" />
                <span>Filters active</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Additional stats */}
      {isFiltered && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-600">
            {filteredItems === 0 ? (
              <span className="text-orange-600">
                No {itemType} match your current criteria
              </span>
            ) : (
              <span>
                Filtered results:{' '}
                {((filteredItems / totalItems) * 100).toFixed(1)}% of total{' '}
                {itemType}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
