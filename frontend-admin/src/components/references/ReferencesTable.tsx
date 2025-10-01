import React, { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table';
import {
  ChevronUp,
  ChevronDown,
  Phone,
  User,
  MessageSquare,
  MoreHorizontal,
} from 'lucide-react';
import { Button, Checkbox } from '../ui';
import { StatusDropdown } from './StatusDropdown';
import type { Reference } from '../../types/reference';

interface ReferencesTableProps {
  data: Reference[];
  isLoading?: boolean;
  sorting: SortingState;
  onSortingChange: (sorting: SortingState) => void;
  onUpdateReferenceStatus: (
    referenceId: string,
    status: 'PENDING' | 'CONTACTED' | 'APPLIED'
  ) => Promise<void>;
  onBulkUpdateStatus?: (
    referenceIds: string[],
    status: 'PENDING' | 'CONTACTED' | 'APPLIED'
  ) => Promise<void>;
}

const columnHelper = createColumnHelper<Reference>();

export const ReferencesTable: React.FC<ReferencesTableProps> = ({
  data,
  isLoading = false,
  sorting,
  onSortingChange,
  onUpdateReferenceStatus,
  onBulkUpdateStatus,
}) => {
  const [selectedReferences, setSelectedReferences] = useState<string[]>([]);
  const [bulkActionOpen, setBulkActionOpen] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedReferences(data.map(ref => ref.id));
    } else {
      setSelectedReferences([]);
    }
  };

  const handleSelectReference = (referenceId: string, checked: boolean) => {
    if (checked) {
      setSelectedReferences(prev => [...prev, referenceId]);
    } else {
      setSelectedReferences(prev => prev.filter(id => id !== referenceId));
    }
  };

  const handleBulkStatusUpdate = async (
    status: 'PENDING' | 'CONTACTED' | 'APPLIED'
  ) => {
    if (onBulkUpdateStatus && selectedReferences.length > 0) {
      await onBulkUpdateStatus(selectedReferences, status);
      setSelectedReferences([]);
      setBulkActionOpen(false);
    }
  };

  const columns = useMemo(
    () => [
      // Selection column
      columnHelper.display({
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllRowsSelected()}
            indeterminate={table.getIsSomeRowsSelected()}
            onChange={checked => handleSelectAll(checked)}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedReferences.includes(row.original.id)}
            onChange={checked =>
              handleSelectReference(row.original.id, checked)
            }
          />
        ),
      }),

      // Reference Information
      columnHelper.accessor('referenceName', {
        header: 'Reference Details',
        cell: info => (
          <div>
            <div className="font-medium text-gray-900 flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              {info.getValue()}
            </div>
            <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
              <Phone className="h-3 w-3" />
              {info.row.original.referenceContact}
            </div>
          </div>
        ),
      }),

      // Voter Information
      columnHelper.accessor('user.fullName', {
        header: 'Voter',
        cell: info => (
          <div>
            <div className="font-medium text-gray-900">{info.getValue()}</div>
            {info.row.original.user.contact && (
              <div className="text-sm text-gray-500">
                {info.row.original.user.contact}
              </div>
            )}
          </div>
        ),
      }),

      // Status
      columnHelper.accessor('status', {
        header: 'Status',
        cell: info => (
          <StatusDropdown
            currentStatus={info.getValue()}
            onStatusChange={status =>
              onUpdateReferenceStatus(info.row.original.id, status)
            }
            size="sm"
          />
        ),
      }),

      // WhatsApp Status
      columnHelper.accessor('whatsappSent', {
        header: 'WhatsApp',
        cell: info => (
          <div className="flex items-center gap-2">
            {info.getValue() ? (
              <div className="flex items-center gap-1 text-green-600">
                <MessageSquare className="h-4 w-4" />
                <span className="text-xs">Sent</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-gray-400">
                <MessageSquare className="h-4 w-4" />
                <span className="text-xs">Not sent</span>
              </div>
            )}
            {info.row.original.whatsappSentAt && (
              <div className="text-xs text-gray-500">
                {new Date(info.row.original.whatsappSentAt).toLocaleDateString(
                  'en-IN'
                )}
              </div>
            )}
          </div>
        ),
      }),

      // Created Date
      columnHelper.accessor('createdAt', {
        header: 'Added',
        cell: info => (
          <div className="text-sm text-gray-600">
            {new Date(info.getValue()).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </div>
        ),
      }),

      // Last Updated
      columnHelper.accessor('statusUpdatedAt', {
        header: 'Last Updated',
        cell: info => {
          const updatedAt = info.getValue();
          return (
            <div className="text-sm text-gray-600">
              {updatedAt
                ? new Date(updatedAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : '-'}
            </div>
          );
        },
      }),
    ],
    [selectedReferences, onUpdateReferenceStatus]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    onSortingChange: updaterOrValue => {
      const newSorting =
        typeof updaterOrValue === 'function'
          ? updaterOrValue(sorting)
          : updaterOrValue;
      onSortingChange(newSorting);
    },
    manualSorting: true,
  });

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-8 text-center">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-8 text-center text-gray-500">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium mb-2">No references found</p>
          <p>No references match your current search criteria.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Bulk Actions Bar */}
      {selectedReferences.length > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-blue-900">
                {selectedReferences.length} reference
                {selectedReferences.length !== 1 ? 's' : ''} selected
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedReferences([])}
                className="text-blue-700 hover:text-blue-900"
              >
                Clear selection
              </Button>
            </div>

            {onBulkUpdateStatus && (
              <div className="relative">
                <Button
                  size="sm"
                  onClick={() => setBulkActionOpen(!bulkActionOpen)}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  Bulk Actions
                  <MoreHorizontal className="h-4 w-4 ml-1" />
                </Button>

                {bulkActionOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setBulkActionOpen(false)}
                    />
                    <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                      <div className="py-1">
                        <button
                          onClick={() => handleBulkStatusUpdate('PENDING')}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Mark as Pending
                        </button>
                        <button
                          onClick={() => handleBulkStatusUpdate('CONTACTED')}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Mark as Contacted
                        </button>
                        <button
                          onClick={() => handleBulkStatusUpdate('APPLIED')}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Mark as Applied
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={`flex items-center gap-2 ${
                          header.column.getCanSort()
                            ? 'cursor-pointer select-none'
                            : ''
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
                          <div className="flex flex-col">
                            <ChevronUp
                              className={`h-3 w-3 ${
                                header.column.getIsSorted() === 'asc'
                                  ? 'text-blue-600'
                                  : 'text-gray-400'
                              }`}
                            />
                            <ChevronDown
                              className={`h-3 w-3 -mt-1 ${
                                header.column.getIsSorted() === 'desc'
                                  ? 'text-blue-600'
                                  : 'text-gray-400'
                              }`}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map(row => (
              <tr
                key={row.id}
                className={`hover:bg-gray-50 ${
                  selectedReferences.includes(row.original.id)
                    ? 'bg-blue-50'
                    : ''
                }`}
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
