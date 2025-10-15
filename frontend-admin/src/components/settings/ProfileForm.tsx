import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { User, CheckCircle, Mail, UserCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { updateProfile } from '../../lib/managerApi';

const profileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores, and hyphens'
    ),
  email: z.string().email('Please enter a valid email address'),
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export const ProfileForm: React.FC = () => {
  const { user } = useAuth();
  const [successMessage, setSuccessMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || '',
      email: user?.email || '',
      fullName: user?.fullName || '',
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data: any) => {
      // Update the user context with new data
      if (data.success && data.data) {
        // You might want to update the auth context here
        setSuccessMessage('Profile updated successfully!');
        setTimeout(() => setSuccessMessage(''), 5000);
        reset(data.data); // Reset form with new values
      }
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    setSuccessMessage('');
    updateProfileMutation.mutate(data);
  };

  const handleReset = () => {
    reset({
      username: user?.username || '',
      email: user?.email || '',
      fullName: user?.fullName || '',
    });
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <User className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Profile Information
          </h3>
          <p className="text-sm text-gray-600">
            Update your account information and personal details
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <UserCircle className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              {...register('username')}
              placeholder="Enter your username"
              error={errors.username?.message}
              disabled={updateProfileMutation.isPending}
              className="pl-10"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Username must be unique and can only contain letters, numbers,
            underscores, and hyphens
          </p>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              {...register('email')}
              type="email"
              placeholder="Enter your email address"
              error={errors.email?.message}
              disabled={updateProfileMutation.isPending}
              className="pl-10"
            />
          </div>
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <Input
            {...register('fullName')}
            placeholder="Enter your full name"
            error={errors.fullName?.message}
            disabled={updateProfileMutation.isPending}
          />
        </div>

        {/* Current Role (Read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <div className="flex items-center gap-2">
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 capitalize">
              {user?.role}
            </div>
            <span className="text-xs text-gray-500">
              Contact an administrator to change your role
            </span>
          </div>
        </div>

        {/* Error Message */}
        {updateProfileMutation.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">
              {updateProfileMutation.error instanceof Error
                ? updateProfileMutation.error.message
                : 'Failed to update profile'}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleReset}
            disabled={updateProfileMutation.isPending || !isDirty}
          >
            Reset
          </Button>
          <Button
            type="submit"
            disabled={updateProfileMutation.isPending || !isDirty}
            className="flex items-center gap-2"
          >
            {updateProfileMutation.isPending && <LoadingSpinner size="sm" />}
            Update Profile
          </Button>
        </div>
      </form>
    </div>
  );
};
