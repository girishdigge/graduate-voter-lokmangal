import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit, Trash2, UserPlus, Search } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Pagination } from '../ui/Pagination';
import { AddManagerModal } from './AddManagerModal';
import { EditManagerModal } from './EditManagerModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { getManagers, deactivateManager } from '../../lib/managerApi';
import type { Manager, ManagerFilters } from '../../types/manager';

export const ManagersTable: React.FC = () => {
  const [filters, setFilters] = useState<ManagerFilters>({
    page: 1,
    limit: 20,
    search: '',
    role: undefined,
    isActive: undefined,
    sort_by: 'createdAt',
    sort_order: 'desc',
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingManager, setEditingManager] = useState<Manager | null>(null);
  const [deletingManager, setDeletingManager] = useState<Manager | null>(null);

  const queryClient = useQueryClient();

  // Fetch managers
  const {
    data: managersData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['managers', filters],
    queryFn: () => getManagers(filters),
    placeholderData: previousData => previousData,
  });

  // Deactivate manager mutation
  const deactivateMutation = useMutation({
    mutationFn: deactivateManager,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managers'] });
      setDeletingManager(null);
    },
  });

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search, page: 1 }));
  };

  const handleFilterChange = (key: keyof ManagerFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleEdit = (manager: Manager) => {
    setEditingManager(manager);
  };

  const handleDelete = (manager: Manager) => {
    setDeletingManager(manager);
  };

  const handleDeactivate = () => {
    if (deletingManager) {
      deactivateMutation.mutate(deletingManager.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading managers</p>
      </div>
    );
  }

  const managers = managersData?.data || [];
  const pagination = managersData?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Manager Accounts
          </h2>
          <p className="text-sm text-gray-600">
            Manage administrator and manager accounts
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Add Manager
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by name, username, or email..."
              value={filters.search}
              onChange={e => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select
            value={filters.role || ''}
            onChange={e =>
              handleFilterChange('role', e.target.value || undefined)
            }
            options={[
              { value: '', label: 'All Roles' },
              { value: 'ADMIN', label: 'Admin' },
              { value: 'MANAGER', label: 'Manager' },
            ]}
          />

          <Select
            value={filters.isActive?.toString() || ''}
            onChange={e =>
              handleFilterChange(
                'isActive',
                e.target.value === '' ? undefined : e.target.value === 'true'
              )
            }
            options={[
              { value: '', label: 'All Status' },
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' },
            ]}
          />

          <Select
            value={`${filters.sort_by}-${filters.sort_order}`}
            onChange={e => {
              const [sort_by, sort_order] = e.target.value.split('-');
              setFilters(prev => ({
                ...prev,
                sort_by,
                sort_order: sort_order as 'asc' | 'desc',
              }));
            }}
            options={[
              { value: 'createdAt-desc', label: 'Newest First' },
              { value: 'createdAt-asc', label: 'Oldest First' },
              { value: 'fullName-asc', label: 'Name A-Z' },
              { value: 'fullName-desc', label: 'Name Z-A' },
              { value: 'lastLoginAt-desc', label: 'Last Login' },
            ]}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Manager
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {managers.map(manager => (
                <tr key={manager.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {manager.fullName}
                      </div>
                      <div className="text-sm text-gray-500">
                        @{manager.username}
                      </div>
                      <div className="text-sm text-gray-500">
                        {manager.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      variant={manager.role === 'ADMIN' ? 'success' : 'default'}
                    >
                      {manager.role}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={manager.isActive ? 'success' : 'danger'}>
                      {manager.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {manager.lastLoginAt
                      ? new Date(manager.lastLoginAt).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="text-xs">
                      <div>Verified: {manager._count?.verifiedUsers || 0}</div>
                      <div>Actions: {manager._count?.auditLogs || 0}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(manager)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {manager.isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(manager)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {managers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No managers found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
          hasNext={pagination.page < pagination.totalPages}
          hasPrev={pagination.page > 1}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
        />
      )}

      {/* Modals */}
      {showAddModal && (
        <AddManagerModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {editingManager && (
        <EditManagerModal
          isOpen={!!editingManager}
          onClose={() => setEditingManager(null)}
          manager={editingManager}
        />
      )}

      {deletingManager && (
        <DeleteConfirmModal
          isOpen={!!deletingManager}
          onClose={() => setDeletingManager(null)}
          onConfirm={handleDeactivate}
          manager={deletingManager}
          isLoading={deactivateMutation.isPending}
        />
      )}
    </div>
  );
};
