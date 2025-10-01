import React from 'react';
import { Filter, X } from 'lucide-react';
import { Button, Select } from '../ui';
import type { ReferenceFilters } from '../../types/reference';

interface ReferenceFilterPanelProps {
  filters: ReferenceFilters;
  onFiltersChange: (filters: ReferenceFilters) => void;
  onClearFilters: () => void;
  className?: string;
}

export const ReferenceFilterPanel: React.FC<ReferenceFilterPanelProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  className = '',
}) => {
  const hasActiveFilters = Object.values(filters).some(
    value => value !== undefined
  );

  const handleStatusChange = (status: string) => {
    onFiltersChange({
      ...filters,
      status:
        status === ''
          ? undefined
          : (status as 'PENDING' | 'CONTACTED' | 'APPLIED'),
    });
  };

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-900">Filters</h3>
          {hasActiveFilters && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Active
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Filter */}
        <div>
          <Select
            label="Status"
            value={filters.status || ''}
            onChange={e => handleStatusChange(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'PENDING', label: 'Pending' },
              { value: 'CONTACTED', label: 'Contacted' },
              { value: 'APPLIED', label: 'Applied' },
            ]}
            className="w-full"
          />
        </div>

        {/* Placeholder for additional filters */}
        <div className="md:col-span-1 lg:col-span-3">
          <div className="text-sm text-gray-500 italic">
            Additional filters can be added here as needed
          </div>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {filters.status && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Status: {filters.status}
                <button
                  onClick={() => handleStatusChange('')}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
