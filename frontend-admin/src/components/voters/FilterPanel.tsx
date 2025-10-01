import React, { useState, useCallback } from 'react';
import { Filter, X } from 'lucide-react';
import { Select, Input, Button } from '../ui';
import type { VoterFilters } from '../../types/voter';

interface FilterPanelProps {
  filters: VoterFilters;
  onFiltersChange: (filters: VoterFilters) => void;
  onClearFilters: () => void;
  className?: string;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = useCallback(
    (key: keyof VoterFilters, value: string | number | undefined) => {
      const newFilters = { ...filters };
      if (value === '' || value === undefined) {
        delete newFilters[key];
      } else {
        newFilters[key] = value as any;
      }
      onFiltersChange(newFilters);
    },
    [filters, onFiltersChange]
  );

  const hasActiveFilters = Object.keys(filters).length > 0;

  const verificationStatusOptions = [
    { value: 'verified', label: 'Verified' },
    { value: 'unverified', label: 'Unverified' },
  ];

  const sexOptions = [
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
    { value: 'OTHER', label: 'Other' },
  ];

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Filter Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="font-medium text-gray-900">Filters</span>
            {hasActiveFilters && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                {Object.keys(filters).length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={onClearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Clear all
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              {isExpanded ? (
                <X className="h-4 w-4" />
              ) : (
                <Filter className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Verification Status */}
            <Select
              label="Verification Status"
              value={filters.verification_status || ''}
              onChange={e =>
                handleFilterChange('verification_status', e.target.value)
              }
              options={verificationStatusOptions}
              placeholder="All statuses"
            />

            {/* Sex */}
            <Select
              label="Sex"
              value={filters.sex || ''}
              onChange={e => handleFilterChange('sex', e.target.value)}
              options={sexOptions}
              placeholder="All"
            />

            {/* Assembly Number */}
            <Input
              label="Assembly Number"
              type="text"
              value={filters.assembly_number || ''}
              onChange={e =>
                handleFilterChange('assembly_number', e.target.value)
              }
              placeholder="Enter assembly number"
            />

            {/* Polling Station Number */}
            <Input
              label="Polling Station"
              type="text"
              value={filters.polling_station_number || ''}
              onChange={e =>
                handleFilterChange('polling_station_number', e.target.value)
              }
              placeholder="Enter polling station"
            />

            {/* City */}
            <Input
              label="City"
              type="text"
              value={filters.city || ''}
              onChange={e => handleFilterChange('city', e.target.value)}
              placeholder="Enter city"
            />

            {/* State */}
            <Input
              label="State"
              type="text"
              value={filters.state || ''}
              onChange={e => handleFilterChange('state', e.target.value)}
              placeholder="Enter state"
            />
          </div>

          {/* Age Range */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Age Range
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Minimum Age"
                type="number"
                value={filters.age_min || ''}
                onChange={e =>
                  handleFilterChange(
                    'age_min',
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                placeholder="Min age"
                min="18"
                max="100"
              />
              <Input
                label="Maximum Age"
                type="number"
                value={filters.age_max || ''}
                onChange={e =>
                  handleFilterChange(
                    'age_max',
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                placeholder="Max age"
                min="18"
                max="100"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t pt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={onClearFilters}>
              Clear Filters
            </Button>
            <Button onClick={() => setIsExpanded(false)}>Apply Filters</Button>
          </div>
        </div>
      )}
    </div>
  );
};
