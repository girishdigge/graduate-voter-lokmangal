import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type SortingState } from '@tanstack/react-table';
import { Users, Download } from 'lucide-react';
import { SearchBar } from '../components/voters/SearchBar';
import { FilterPanel } from '../components/voters/FilterPanel';
import { VotersTable } from '../components/voters/VotersTable';
import { VoterDetailModal } from '../components/voters/VoterDetailModal';
import { VoterEditModal } from '../components/voters/VoterEditModal';
import { AddReferenceModal } from '../components/references/AddReferenceModal';
import { Pagination, Button, LoadingSpinner } from '../components/ui';

import { voterApi } from '../lib/voterApi';

import type {
  Voter,
  VoterFilters,
  VoterSearchParams,
  VoterUpdateData,
} from '../types/voter';

export const VotersPage: React.FC = () => {
  const queryClient = useQueryClient();

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<VoterFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'created_at', desc: true },
  ]);
  const [selectedVoter, setSelectedVoter] = useState<Voter | null>(null);
  const [editingVoter, setEditingVoter] = useState<Voter | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddReferenceModal, setShowAddReferenceModal] = useState(false);
  const [referenceVoter, setReferenceVoter] = useState<Voter | null>(null);

  const itemsPerPage = 20;

  // Build search parameters
  const searchParams: VoterSearchParams = {
    q: searchQuery,
    ...filters,
    page: currentPage,
    limit: itemsPerPage,
    sort_by: sorting[0]?.id as any,
    sort_order: sorting[0]?.desc ? 'desc' : 'asc',
  };

  // Fetch voters data
  const {
    data: votersData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['voters', searchParams],
    queryFn: () => voterApi.getVoters(searchParams),
    placeholderData: previousData => previousData,
    retry: 1,
  });

  // Fetch voter details for modal
  const { data: voterDetailsData, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['voter-details', selectedVoter?.id],
    queryFn: async () => {
      if (!selectedVoter) return null;
      return voterApi.getVoterDetails(selectedVoter.id);
    },
    enabled: !!selectedVoter && showDetailModal,
  });

  // Fetch voter details for edit modal
  const { data: editVoterDetailsData, isLoading: isLoadingEditDetails } =
    useQuery({
      queryKey: ['voter-edit-details', editingVoter?.id],
      queryFn: async () => {
        if (!editingVoter) return null;
        return voterApi.getVoterDetails(editingVoter.id);
      },
      enabled: !!editingVoter && showEditModal,
    });

  // Verify voter mutation
  const verifyMutation = useMutation({
    mutationFn: ({
      userId,
      isVerified,
    }: {
      userId: string;
      isVerified: boolean;
    }) => voterApi.verifyVoter(userId, isVerified),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voters'] });
      queryClient.invalidateQueries({ queryKey: ['voter-details'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: error => {
      console.error('Verify voter mutation error:', error);
    },
  });

  // Update voter mutation
  const updateMutation = useMutation({
    mutationFn: ({
      userId,
      updateData,
    }: {
      userId: string;
      updateData: VoterUpdateData;
    }) => voterApi.updateVoter(userId, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voters'] });
      queryClient.invalidateQueries({ queryKey: ['voter-details'] });
    },
    onError: error => {
      console.error('Update voter mutation error:', error);
    },
  });

  // Event handlers
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const handleFiltersChange = useCallback((newFilters: VoterFilters) => {
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

  const handleViewDetails = useCallback((voter: Voter) => {
    console.log('Selected voter data:', voter);
    setSelectedVoter(voter);
    setShowDetailModal(true);
  }, []);

  const handleEditVoter = useCallback((voter: Voter) => {
    setEditingVoter(voter);
    setShowEditModal(true);
  }, []);

  const handleVerifyVoter = useCallback(
    async (userId: string, isVerified: boolean) => {
      await verifyMutation.mutateAsync({ userId, isVerified });
    },
    [verifyMutation]
  );

  const handleUpdateVoter = useCallback(
    async (userId: string, updateData: VoterUpdateData) => {
      await updateMutation.mutateAsync({ userId, updateData });
    },
    [updateMutation]
  );

  const handleAddReferences = useCallback((voter: Voter) => {
    setReferenceVoter(voter);
    setShowAddReferenceModal(true);
  }, []);

  const handleCloseDetailModal = useCallback(() => {
    setShowDetailModal(false);
    setSelectedVoter(null);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setShowEditModal(false);
    setEditingVoter(null);
  }, []);

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);

  const voters = votersData?.data?.voters || [];
  const pagination = votersData?.data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6" />
            Voters Management
          </h1>
          <p className="mt-2 text-gray-600">
            Manage and verify voter registrations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          {pagination && (
            <div className="text-sm text-gray-600">
              {pagination.total} total voters
            </div>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <SearchBar
          onSearch={handleSearch}
          placeholder="Search by name, Aadhar number, or contact..."
          initialValue={searchQuery}
        />
        <FilterPanel
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">
            <p className="font-medium">Error loading voters</p>
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
      {isLoading && !votersData && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Voters Table */}
      {!isLoading || votersData ? (
        <>
          <VotersTable
            data={voters}
            isLoading={isLoading}
            sorting={sorting}
            onSortingChange={handleSortingChange}
            onViewDetails={handleViewDetails}
            onEditVoter={handleEditVoter}
            onVerifyVoter={handleVerifyVoter}
            onAddReferences={handleAddReferences}
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

      {/* Voter Detail Modal */}
      <VoterDetailModal
        isOpen={showDetailModal}
        onClose={handleCloseDetailModal}
        voter={voterDetailsData?.data?.user || selectedVoter}
        isLoading={isLoadingDetails}
        onVerify={handleVerifyVoter}
        onEdit={handleEditVoter}
      />

      {/* Voter Edit Modal */}
      <VoterEditModal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        voter={editVoterDetailsData?.data?.user || editingVoter}
        onSave={handleUpdateVoter}
        isLoading={updateMutation.isPending || isLoadingEditDetails}
      />

      {/* Add Reference Modal */}
      {referenceVoter && (
        <AddReferenceModal
          isOpen={showAddReferenceModal}
          onClose={() => {
            setShowAddReferenceModal(false);
            setReferenceVoter(null);
          }}
          userId={referenceVoter.id}
          userName={referenceVoter.fullName}
        />
      )}
    </div>
  );
};
