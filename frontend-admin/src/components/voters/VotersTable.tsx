import React, { useMemo } from 'react';
// @ts-ignore - TypeScript module resolution issue with @tanstack/react-table
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import {
  ChevronUp,
  ChevronDown,
  Eye,
  Edit,
  Phone,
  Mail,
  UserPlus,
} from 'lucide-react';
import { Badge, Button } from '../ui';
import { VerifyButton } from './VerifyButton';
import type { Voter } from '../../types/voter';

// Define SortingState type locally to avoid import issues
type SortingState = Array<{
  id: string;
  desc: boolean;
}>;

interface VotersTableProps {
  data: Voter[];
  isLoading?: boolean;
  sorting: SortingState;
  onSortingChange: (sorting: SortingState) => void;
  onViewDetails: (voter: Voter) => void;
  onEditVoter: (voter: Voter) => void;
  onVerifyVoter: (userId: string, isVerified: boolean) => Promise<void>;
  onAddReferences: (voter: Voter) => void;
}

const columnHelper = createColumnHelper<Voter>();

export const VotersTable: React.FC<VotersTableProps> = ({
  data,
  isLoading = false,
  sorting,
  onSortingChange,
  onViewDetails,
  onEditVoter,
  onVerifyVoter,
  onAddReferences,
}) => {
  const columns = useMemo(
    () => [
      columnHelper.accessor('fullName', {
        id: 'full_name',
        header: 'Name',
        cell: info => (
          <div>
            <div className="font-medium text-gray-900">{info.getValue()}</div>
            <div className="text-sm text-gray-500">
              {info.row.original.aadharNumber}
            </div>
          </div>
        ),
      }),
      columnHelper.accessor('contact', {
        header: 'Contact',
        cell: info => (
          <div>
            <div className="flex items-center gap-1 text-gray-900">
              <Phone className="h-3 w-3" />
              {info.getValue()}
            </div>
            {info.row.original.email && (
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Mail className="h-3 w-3" />
                {info.row.original.email}
              </div>
            )}
          </div>
        ),
      }),
      columnHelper.accessor('age', {
        header: 'Age',
        cell: info => (
          <div>
            <div className="text-gray-900">{info.getValue()} years</div>
            <div className="text-sm text-gray-500">{info.row.original.sex}</div>
          </div>
        ),
      }),

      columnHelper.accessor('isVerified', {
        header: 'Status',
        cell: info => (
          <Badge variant={info.getValue() ? 'success' : 'warning'} size="sm">
            {info.getValue() ? 'Verified' : 'Unverified'}
          </Badge>
        ),
      }),
      columnHelper.accessor('createdAt', {
        id: 'created_at',
        header: 'Enrolled',
        cell: info => (
          <div className="text-sm text-gray-600">
            {new Date(info.getValue()).toLocaleDateString('en-IN')}
          </div>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: info => (
          <div className="flex items-center gap-1 min-w-[120px]">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onViewDetails(info.row.original)}
              className="p-2 mr-1 bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300"
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onEditVoter(info.row.original)}
              className="p-2 mr-1 bg-green-100 hover:bg-green-200 text-green-700 border border-green-300"
              title="Edit Voter"
            >
              <Edit className="h-4 w-4" />
            </Button>

            <VerifyButton
              isVerified={info.row.original.isVerified}
              onVerify={isVerified =>
                onVerifyVoter(info.row.original.id, isVerified)
              }
              size="sm"
            />
          </div>
        ),
      }),
    ],
    [onViewDetails, onEditVoter, onVerifyVoter, onAddReferences]
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
          <p>No voters found matching your criteria.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
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
              <tr key={row.id} className="hover:bg-gray-50">
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
