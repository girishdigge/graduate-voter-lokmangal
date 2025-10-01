import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Checkbox } from '../ui/Checkbox';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { updateManager } from '../../lib/managerApi';
import type { Manager } from '../../types/manager';

const updateManagerSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters'),
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters'),
  isActive: z.boolean(),
});

type UpdateManagerFormData = z.infer<typeof updateManagerSchema>;

interface EditManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  manager: Manager;
}

export const EditManagerModal: React.FC<EditManagerModalProps> = ({
  isOpen,
  onClose,
  manager,
}) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
    setValue,
  } = useForm<UpdateManagerFormData>({
    resolver: zodResolver(updateManagerSchema),
    defaultValues: {
      email: manager.email,
      fullName: manager.fullName,
      isActive: manager.isActive,
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      managerId,
      data,
    }: {
      managerId: string;
      data: UpdateManagerFormData;
    }) => updateManager(managerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managers'] });
      onClose();
    },
  });

  const onSubmit = (data: UpdateManagerFormData) => {
    updateMutation.mutate({ managerId: manager.id, data });
  };

  const handleClose = () => {
    if (!updateMutation.isPending) {
      reset();
      onClose();
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      reset({
        email: manager.email,
        fullName: manager.fullName,
        isActive: manager.isActive,
      });
    }
  }, [isOpen, manager, reset]);

  const isActive = watch('isActive');

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Edit Manager - @${manager.username}`}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Manager Info (Read-only) */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-700">Username:</span>
            <span className="text-sm text-gray-900">@{manager.username}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-700">Role:</span>
            <span className="text-sm text-gray-900">{manager.role}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-700">Created:</span>
            <span className="text-sm text-gray-900">
              {new Date(manager.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-700">
              Last Login:
            </span>
            <span className="text-sm text-gray-900">
              {manager.lastLoginAt
                ? new Date(manager.lastLoginAt).toLocaleDateString()
                : 'Never'}
            </span>
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <Input
            {...register('email')}
            type="email"
            placeholder="Enter email address"
            error={errors.email?.message}
            disabled={updateMutation.isPending}
          />
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <Input
            {...register('fullName')}
            placeholder="Enter full name"
            error={errors.fullName?.message}
            disabled={updateMutation.isPending}
          />
        </div>

        {/* Active Status */}
        <div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={isActive}
              onChange={checked => setValue('isActive', checked)}
              disabled={updateMutation.isPending}
            />
            <label
              htmlFor="isActive"
              className="text-sm font-medium text-gray-700"
            >
              Account is active
            </label>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Inactive accounts cannot log in to the system
          </p>
        </div>

        {/* Activity Stats */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            Activity Summary
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Voters Verified:</span>
              <span className="ml-2 font-medium text-blue-900">
                {manager._count?.verifiedUsers || 0}
              </span>
            </div>
            <div>
              <span className="text-blue-700">Total Actions:</span>
              <span className="ml-2 font-medium text-blue-900">
                {manager._count?.auditLogs || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {updateMutation.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">
              {updateMutation.error instanceof Error
                ? updateMutation.error.message
                : 'Failed to update manager'}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={updateMutation.isPending || !isDirty}
            className="flex items-center gap-2"
          >
            {updateMutation.isPending && <LoadingSpinner size="sm" />}
            Update Manager
          </Button>
        </div>
      </form>
    </Modal>
  );
};
