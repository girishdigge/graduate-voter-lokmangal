import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type SortingState } from '@tanstack/react-table';
import { MessageSquare, Download, UserPlus } from 'lucide-react';
import { ReferenceSearchBar } from '../components/references/ReferenceSearchBar';
import { ReferenceFilterPanel } from '../components/references/ReferenceFilterPanel';
import { ReferencesTable } from '../components/references/ReferencesTable';
import { AddReferenceModal } from '../components/references/AddReferenceModal';
import {
  EnhancedPagination,
  TableSummary,
  QuickNavigation,
  KeyboardShortcuts,
  ExportModal,
  Toast,
  useToast,
  Button,
  LoadingSpinner,
} from '../components/ui';
import { referenceApi } from '../lib/referenceApi';
import type {
  ReferenceFilters,
  ReferenceSearchParams,
} from '../types/reference';
import { usePaginationKeyboard } from '../hooks/usePaginationKeyboard';
import { exportReferencesToCSV } from '../lib/csvExport';
import type { ExportOptions } from '../components/ui/ExportModal';

export const ReferencesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast, showToast, hideToast } = useToast();

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ReferenceFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'created_at', desc: true },
  ]);
  const [isAddReferenceModalOpen, setIsAddReferenceModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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

  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing page size
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

  // Check if filters or search are active
  const hasActiveFilters = Object.values(filters).some(
    value => value !== undefined
  );
  const hasActiveSearch = searchQuery.trim().length > 0;

  const handleExport = useCallback(
    async (options: ExportOptions) => {
      setIsExporting(true);
      try {
        let dataToExport = references;

        // If exporting all data, fetch all references
        if (options.exportType === 'all') {
          const allReferencesResponse = await referenceApi.getReferences({
            ...searchParams,
            page: 1,
            limit: pagination?.total || 1000, // Get all data
          });
          dataToExport = allReferencesResponse.data.references;
        }

        // Apply date range filter if specified
        if (options.dateRange) {
          const startDate = new Date(options.dateRange.start);
          const endDate = new Date(options.dateRange.end);
          dataToExport = dataToExport.filter(ref => {
            const createdDate = new Date(ref.createdAt);
            return createdDate >= startDate && createdDate <= endDate;
          });
        }

        // Export to CSV
        exportReferencesToCSV(dataToExport, options.customFilename);

        setIsExportModalOpen(false);
        showToast(
          `Successfully exported ${dataToExport.length} references to CSV`,
          'success'
        );
      } catch (error) {
        console.error('Export failed:', error);
        showToast('Export failed. Please try again.', 'error');
      } finally {
        setIsExporting(false);
      }
    },
    [references, searchParams, pagination?.total, referenceApi]
  );

  // Enable keyboard navigation for pagination
  usePaginationKeyboard({
    currentPage,
    totalPages: pagination?.totalPages || 1,
    onPageChange: handlePageChange,
    hasNext: pagination?.hasNext || false,
    hasPrev: pagination?.hasPrev || false,
    enabled: !isLoading && !!pagination,
  });

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
          {/* <KeyboardShortcuts /> */}
          <Button
            variant="secondary"
            className="flex items-center gap-2"
            onClick={() => setIsExportModalOpen(true)}
            disabled={!pagination || pagination.total === 0}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <div className="flex items-center gap-4">
            {pagination && (
              <div className="text-sm text-gray-600">
                {pagination.total} total references
              </div>
            )}
            {pagination && pagination.totalPages > 1 && (
              <QuickNavigation
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                hasNext={pagination.hasNext}
                hasPrev={pagination.hasPrev}
              />
            )}
          </div>
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

      {/* Table Summary */}
      {pagination && (
        <TableSummary
          totalItems={pagination.total}
          filteredItems={pagination.total}
          currentPage={pagination.page}
          itemsPerPage={itemsPerPage}
          hasActiveFilters={hasActiveFilters}
          hasActiveSearch={hasActiveSearch}
          itemType="references"
        />
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

          {/* Enhanced Pagination */}
          {pagination && (
            <EnhancedPagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              hasNext={pagination.hasNext}
              hasPrev={pagination.hasPrev}
              totalItems={pagination.total}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={handleItemsPerPageChange}
              pageSizeOptions={[10, 20, 50, 100]}
              showPageSizeSelector={true}
              showJumpToPage={true}
              className="mt-6"
            />
          )}
        </>
      ) : null}

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
        totalItems={pagination?.total || 0}
        filteredItems={pagination?.total || 0}
        itemType="references"
        hasActiveFilters={hasActiveFilters}
        isLoading={isExporting}
      />

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
};
