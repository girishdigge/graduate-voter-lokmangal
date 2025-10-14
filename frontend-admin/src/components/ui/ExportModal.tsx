import React, { useState } from 'react';
import { Download, FileText, Calendar, Filter } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';
import { Checkbox } from './Checkbox';
import { Input } from './Input';
import { ExportInstructions } from './ExportInstructions';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
  totalItems: number;
  filteredItems: number;
  itemType: string; // 'voters' or 'references'
  hasActiveFilters: boolean;
  isLoading?: boolean;
}

export interface ExportOptions {
  exportType: 'all' | 'filtered' | 'current-page';
  includeHeaders: boolean;
  customFilename: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  totalItems,
  filteredItems,
  itemType,
  hasActiveFilters,
  isLoading = false,
}) => {
  const [exportType, setExportType] = useState<
    'all' | 'filtered' | 'current-page'
  >('filtered');
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [customFilename, setCustomFilename] = useState('');
  const [includeDateRange, setIncludeDateRange] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });

  const handleExport = () => {
    const options: ExportOptions = {
      exportType,
      includeHeaders,
      customFilename:
        customFilename ||
        `${itemType}_export_${new Date().toISOString().split('T')[0]}`,
      ...(includeDateRange &&
        dateRange.start &&
        dateRange.end && {
          dateRange,
        }),
    };

    onExport(options);
  };

  const getExportCount = () => {
    switch (exportType) {
      case 'all':
        return totalItems;
      case 'filtered':
        return filteredItems;
      case 'current-page':
        return Math.min(20, filteredItems); // Assuming 20 items per page
      default:
        return filteredItems;
    }
  };

  const resetForm = () => {
    setExportType('filtered');
    setIncludeHeaders(true);
    setCustomFilename('');
    setIncludeDateRange(false);
    setDateRange({ start: '', end: '' });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Export ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`}
      size="md"
    >
      <div className="space-y-6">
        {/* Export Statistics */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-5 w-5 text-gray-400" />
            <h3 className="font-medium text-gray-900">Export Summary</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total {itemType}:</span>
              <span className="ml-2 font-medium">
                {totalItems.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Filtered {itemType}:</span>
              <span className="ml-2 font-medium">
                {filteredItems.toLocaleString()}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-600">Will export:</span>
              <span className="ml-2 font-medium text-blue-600">
                {getExportCount().toLocaleString()} {itemType}
              </span>
            </div>
          </div>
        </div>

        {/* Export Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            What to export:
          </label>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="radio"
                name="exportType"
                value="filtered"
                checked={exportType === 'filtered'}
                onChange={e => setExportType(e.target.value as any)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-3 text-sm text-gray-700">
                Current filtered results ({filteredItems.toLocaleString()}{' '}
                {itemType})
                {hasActiveFilters && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                    <Filter className="h-3 w-3 mr-1" />
                    Filtered
                  </span>
                )}
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="radio"
                name="exportType"
                value="all"
                checked={exportType === 'all'}
                onChange={e => setExportType(e.target.value as any)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-3 text-sm text-gray-700">
                All {itemType} ({totalItems.toLocaleString()} total)
              </span>
            </label>
          </div>
        </div>

        {/* Export Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Export options:
          </label>
          <div className="space-y-3">
            <label className="flex items-center">
              <Checkbox checked={includeHeaders} onChange={setIncludeHeaders} />
              <span className="ml-2 text-sm text-gray-700">
                Include column headers
              </span>
            </label>
          </div>
        </div>

        {/* Custom Filename */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filename (optional):
          </label>
          <Input
            type="text"
            value={customFilename}
            onChange={e => setCustomFilename(e.target.value)}
            placeholder={`${itemType}_export_${new Date().toISOString().split('T')[0]}.csv`}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave empty to use default filename with current date
          </p>
        </div>

        {/* Date Range Filter */}
        <div>
          <div className="flex items-center mb-3">
            <label className="flex items-center">
              <Checkbox
                checked={includeDateRange}
                onChange={setIncludeDateRange}
              />
              <span className="ml-2 text-sm text-gray-700">
                Filter by date range
              </span>
            </label>
          </div>

          {includeDateRange && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From:
                </label>
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={e =>
                    setDateRange(prev => ({ ...prev, start: e.target.value }))
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To:
                </label>
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={e =>
                    setDateRange(prev => ({ ...prev, end: e.target.value }))
                  }
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* Export Instructions */}
        <ExportInstructions />

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isLoading || getExportCount() === 0}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export {getExportCount().toLocaleString()} {itemType}
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
