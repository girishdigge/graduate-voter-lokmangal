import React, { useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '../ui';

interface ReferenceSearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  initialValue?: string;
}

export const ReferenceSearchBar: React.FC<ReferenceSearchBarProps> = ({
  onSearch,
  placeholder = 'Search by reference name, contact, or voter name...',
  className = '',
  initialValue = '',
}) => {
  const [query, setQuery] = useState(initialValue);

  const handleSearch = useCallback(() => {
    onSearch(query.trim());
  }, [query, onSearch]);

  const handleClear = useCallback(() => {
    setQuery('');
    onSearch('');
  }, [onSearch]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    },
    [handleSearch]
  );

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <Input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {query && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      <div className="mt-2 flex gap-2">
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          type="button"
        >
          Search
        </button>
        {query && (
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
            type="button"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};
