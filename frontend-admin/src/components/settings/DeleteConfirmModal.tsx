import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import type { Manager } from '../../types/manager';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  manager: Manager;
  isLoading: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  manager,
  isLoading,
}) => {
  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Deactivate Manager"
      size="sm"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
          <AlertTriangle className="h-5 w-5 text-red-600" />
        </div>
        <div>
          <p className="text-sm text-gray-600">This action cannot be undone</p>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-sm text-gray-700 mb-4">
          Are you sure you want to deactivate this manager account? This will:
        </p>

        <ul className="text-sm text-gray-600 space-y-2 mb-4">
          <li className="flex items-start gap-2">
            <span className="text-red-500 mt-1">•</span>
            <span>Prevent the manager from logging into the system</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500 mt-1">•</span>
            <span>Preserve all audit logs and historical data</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500 mt-1">•</span>
            <span>Allow reactivation by an admin if needed</span>
          </li>
        </ul>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Manager Details
          </h4>
          <div className="space-y-1 text-sm text-gray-600">
            <div>
              <strong>Name:</strong> {manager.fullName}
            </div>
            <div>
              <strong>Username:</strong> @{manager.username}
            </div>
            <div>
              <strong>Email:</strong> {manager.email}
            </div>
            <div>
              <strong>Role:</strong> {manager.role}
            </div>
            <div>
              <strong>Voters Verified:</strong>{' '}
              {manager._count?.verifiedUsers || 0}
            </div>
            <div>
              <strong>Total Actions:</strong> {manager._count?.auditLogs || 0}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={handleClose}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={onConfirm}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          {isLoading && <LoadingSpinner size="sm" />}
          Deactivate Manager
        </Button>
      </div>
    </Modal>
  );
};
