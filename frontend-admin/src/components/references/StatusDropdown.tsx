import React, { useState } from 'react';
import {
  ChevronDown,
  Check,
  Clock,
  MessageCircle,
  CheckCircle,
} from 'lucide-react';
import { Button } from '../ui';

interface StatusDropdownProps {
  currentStatus: 'PENDING' | 'CONTACTED' | 'APPLIED';
  onStatusChange: (
    status: 'PENDING' | 'CONTACTED' | 'APPLIED'
  ) => Promise<void>;
  isLoading?: boolean;
  size?: 'sm' | 'md';
  disabled?: boolean;
}

const statusConfig = {
  PENDING: {
    label: 'Pending',
    icon: Clock,
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    hoverColor: 'hover:bg-yellow-100',
  },
  CONTACTED: {
    label: 'Contacted',
    icon: MessageCircle,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    hoverColor: 'hover:bg-blue-100',
  },
  APPLIED: {
    label: 'Applied',
    icon: CheckCircle,
    color: 'text-green-600 bg-green-50 border-green-200',
    hoverColor: 'hover:bg-green-100',
  },
};

const statusOptions: Array<'PENDING' | 'CONTACTED' | 'APPLIED'> = [
  'PENDING',
  'CONTACTED',
  'APPLIED',
];

export const StatusDropdown: React.FC<StatusDropdownProps> = ({
  currentStatus,
  onStatusChange,
  isLoading = false,
  size = 'md',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const currentConfig = statusConfig[currentStatus];
  const CurrentIcon = currentConfig.icon;

  const handleStatusChange = async (
    newStatus: 'PENDING' | 'CONTACTED' | 'APPLIED'
  ) => {
    if (newStatus === currentStatus || disabled || isLoading) return;

    setUpdatingStatus(newStatus);
    setIsOpen(false);

    try {
      await onStatusChange(newStatus);
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const buttonSize = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm';
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size={size}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isLoading || updatingStatus !== null}
        className={`
          ${buttonSize} ${currentConfig.color} ${currentConfig.hoverColor}
          border font-medium rounded-lg transition-colors
          ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <div className="flex items-center gap-1.5">
          {updatingStatus ? (
            <div
              className={`${iconSize} animate-spin rounded-full border-2 border-current border-t-transparent`}
            />
          ) : (
            <CurrentIcon className={iconSize} />
          )}
          <span>{currentConfig.label}</span>
          <ChevronDown
            className={`${iconSize} transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </Button>

      {isOpen && !disabled && !isLoading && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="py-1">
              {statusOptions.map(status => {
                const config = statusConfig[status];
                const Icon = config.icon;
                const isSelected = status === currentStatus;
                const isUpdating = updatingStatus === status;

                return (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    disabled={isSelected || isUpdating}
                    className={`
                      w-full px-3 py-2 text-left text-sm flex items-center gap-2
                      ${
                        isSelected
                          ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                          : 'text-gray-700 hover:bg-gray-50 cursor-pointer'
                      }
                      ${isUpdating ? 'opacity-50' : ''}
                    `}
                  >
                    {isUpdating ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                    <span>{config.label}</span>
                    {isSelected && <Check className="h-3 w-3 ml-auto" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
