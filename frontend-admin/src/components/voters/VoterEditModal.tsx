import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, Input, Select, Button } from '../ui';
import type { Voter, VoterUpdateData } from '../../types/voter';

const voterUpdateSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  sex: z.enum(['MALE', 'FEMALE', 'OTHER']),
  guardianSpouse: z.string().optional(),
  qualification: z.string().optional(),
  occupation: z.string().optional(),
  contact: z.string().min(10, 'Contact number must be at least 10 digits'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  houseNumber: z.string().min(1, 'House number is required'),
  street: z.string().min(1, 'Street is required'),
  area: z.string().min(1, 'Area is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().min(6, 'Pincode must be at least 6 digits'),
  assemblyNumber: z.string().optional(),
  assemblyName: z.string().optional(),
  pollingStationNumber: z.string().optional(),
  epicNumber: z.string().optional(),
  university: z.string().optional(),
  graduationYear: z.number().optional(),
  graduationDocType: z.string().optional(),
});

interface VoterEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  voter: Voter | null;
  onSave: (userId: string, updateData: VoterUpdateData) => Promise<void>;
  isLoading?: boolean;
}

export const VoterEditModal: React.FC<VoterEditModalProps> = ({
  isOpen,
  onClose,
  voter,
  onSave,
  isLoading = false,
}) => {
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VoterUpdateData>({
    resolver: zodResolver(voterUpdateSchema),
  });

  useEffect(() => {
    if (voter) {
      reset({
        fullName: voter.fullName,
        sex: voter.sex,
        guardianSpouse: voter.guardianSpouse || '',
        qualification: voter.qualification || '',
        occupation: voter.occupation || '',
        contact: voter.contact,
        email: voter.email || '',
        houseNumber: voter.houseNumber,
        street: voter.street,
        area: voter.area,
        city: voter.city,
        state: voter.state,
        pincode: voter.pincode,
        assemblyNumber: voter.assemblyNumber || '',
        assemblyName: voter.assemblyName || '',
        pollingStationNumber: voter.pollingStationNumber || '',
        epicNumber: voter.epicNumber || '',
        university: voter.university || '',
        graduationYear: voter.graduationYear || undefined,
        graduationDocType: voter.graduationDocType || '',
      });
    }
  }, [voter, reset]);

  const onSubmit = async (data: VoterUpdateData) => {
    if (!voter) return;

    setIsSaving(true);
    try {
      // Clean up empty strings and convert them to undefined
      const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
        if (value === '') {
          acc[key as keyof VoterUpdateData] = undefined;
        } else {
          acc[key as keyof VoterUpdateData] = value;
        }
        return acc;
      }, {} as VoterUpdateData);

      await onSave(voter.id, cleanData);
      onClose();
    } catch (error) {
      console.error('Error updating voter:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const sexOptions = [
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
    { value: 'OTHER', label: 'Other' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={voter ? `Edit Voter - ${voter.fullName}` : 'Edit Voter'}
      size="xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name *"
              {...register('fullName')}
              error={errors.fullName?.message}
            />
            <Select
              label="Sex *"
              {...register('sex')}
              options={sexOptions}
              error={errors.sex?.message}
            />
            <Input
              label="Guardian/Spouse"
              {...register('guardianSpouse')}
              error={errors.guardianSpouse?.message}
            />
            <Input
              label="Qualification"
              {...register('qualification')}
              error={errors.qualification?.message}
            />
            <Input
              label="Occupation"
              {...register('occupation')}
              error={errors.occupation?.message}
            />
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Contact Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Contact Number *"
              {...register('contact')}
              error={errors.contact?.message}
            />
            <Input
              label="Email"
              type="email"
              {...register('email')}
              error={errors.email?.message}
            />
          </div>
        </div>

        {/* Address Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="House Number *"
              {...register('houseNumber')}
              error={errors.houseNumber?.message}
            />
            <Input
              label="Street *"
              {...register('street')}
              error={errors.street?.message}
            />
            <Input
              label="Area *"
              {...register('area')}
              error={errors.area?.message}
            />
            <Input
              label="City *"
              {...register('city')}
              error={errors.city?.message}
            />
            <Input
              label="State *"
              {...register('state')}
              error={errors.state?.message}
            />
            <Input
              label="Pincode *"
              {...register('pincode')}
              error={errors.pincode?.message}
            />
          </div>
        </div>

        {/* Elector Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Elector Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Assembly Number"
              {...register('assemblyNumber')}
              error={errors.assemblyNumber?.message}
            />
            <Input
              label="Assembly Name"
              {...register('assemblyName')}
              error={errors.assemblyName?.message}
            />
            <Input
              label="Polling Station Number"
              {...register('pollingStationNumber')}
              error={errors.pollingStationNumber?.message}
            />
            <Input
              label="EPIC Number"
              {...register('epicNumber')}
              error={errors.epicNumber?.message}
            />
          </div>
        </div>

        {/* Education Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Education
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="University"
              {...register('university')}
              error={errors.university?.message}
            />
            <Input
              label="Graduation Year"
              type="number"
              {...register('graduationYear', { valueAsNumber: true })}
              error={errors.graduationYear?.message}
            />
            <Input
              label="Graduation Document Type"
              {...register('graduationDocType')}
              error={errors.graduationDocType?.message}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving} disabled={isLoading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
