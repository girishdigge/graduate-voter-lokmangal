import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type SortingState } from '@tanstack/react-table';
import { MessageSquare, Download } from 'lucide-react';
import { ReferenceSearchBar } from '../components/references/ReferenceSearchBar';
import { ReferenceFilterPanel } from '../components/references/ReferenceFilterPanel';
import { ReferencesTable } from '../components/references/ReferencesTable';
import { Pagination, Button, LoadingSpinner } from '../components/ui';
import { referenceApi } from '../lib/referenceApi';
import type {
  ReferenceFilters,
  ReferenceSearchParams,
} from '../types/reference';

export const ReferencesPage: React.FC = () => {
  const queryClient = useQueryClient();

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ReferenceFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'createdAt', desc: true },
  ]);

  const itemsPerPage = 20;

  // Build search parameters
  const searchParams: ReferenceSearchParams = {
    q: searchQuery,
    ...filters,
    page: currentPage,
    limit: itemsPerPage,
    sort_by: sorting[0]?.id as any,
    sort_order: sorting[0]?.desc ? 'desc' : 'asc',
  };

  // Fetch references data
  const {
    data: referencesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['references', searchParams],
    queryFn: () => referenceApi.getReferences(searchParams),
    placeholderData: previousData => previousData,
  });

  // Update reference status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({
      referenceId,
      status,
    }: {
      referenceId: string;
      status: 'PENDING' | 'CONTACTED' | 'APPLIED';
    }) => referenceApi.updateReferenceStatus(referenceId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['references'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  // Bulk update reference status mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: ({
      referenceIds,
      status,
    }: {
      referenceIds: string[];
      status: 'PENDING' | 'CONTACTED' | 'APPLIED';
    }) => referenceApi.bulkUpdateReferenceStatus({ referenceIds, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['references'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  // Event handlers
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const handleFiltersChange = useCallback((newFilters: ReferenceFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setCurrentPage(1);
  }, []);

  const handleSortingChange = useCallback((newSorting: SortingState) => {
    setSorting(newSorting);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleUpdateReferenceStatus = useCallback(
    async (
      referenceId: string,
      status: 'PENDING' | 'CONTACTED' | 'APPLIED'
    ) => {
      await updateStatusMutation.mutateAsync({ referenceId, status });
    },
    [updateStatusMutation]
  );

  const handleBulkUpdateStatus = useCallback(
    async (
      referenceIds: string[],
      status: 'PENDING' | 'CONTACTED' | 'APPLIED'
    ) => {
      await bulkUpdateMutation.mutateAsync({ referenceIds, status });
    },
    [bulkUpdateMutation]
  );

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);

  const references = referencesData?.data?.references || [];
  const pagination = referencesData?.data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            References Management
          </h1>
          <p className="mt-2 text-gray-600">
            Manage voter references and their verification status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          {pagination && (
            <div className="text-sm text-gray-600">
              {pagination.total} total references
            </div>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <ReferenceSearchBar
          onSearch={handleSearch}
          placeholder="Search by reference name, contact, or voter name..."
          initialValue={searchQuery}
        />
        <ReferenceFilterPanel
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">
            <p className="font-medium">Error loading references</p>
            <p className="text-sm mt-1">
              {error instanceof Error
                ? error.message
                : 'An unexpected error occurred'}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            className="mt-3"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && !referencesData && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* References Table */}
      {!isLoading || referencesData ? (
        <>
          <ReferencesTable
            data={references}
            isLoading={isLoading}
            sorting={sorting}
            onSortingChange={handleSortingChange}
            onUpdateReferenceStatus={handleUpdateReferenceStatus}
            onBulkUpdateStatus={handleBulkUpdateStatus}
          />

          {/* Pagination */}
          {pagination && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              hasNext={pagination.hasNext}
              hasPrev={pagination.hasPrev}
              totalItems={pagination.total}
              itemsPerPage={itemsPerPage}
              className="mt-6"
            />
          )}
        </>
      ) : null}
    </div>
  );
};
