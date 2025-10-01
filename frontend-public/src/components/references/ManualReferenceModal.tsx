import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { referenceSchema, type ReferenceFormData } from '../../lib/validation';

interface Contact {
  name: string;
  tel: string;
}

interface ManualReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (contact: Contact) => void;
}

export const ManualReferenceModal: React.FC<ManualReferenceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ReferenceFormData>({
    resolver: zodResolver(referenceSchema),
  });

  const handleFormSubmit = (data: ReferenceFormData) => {
    onSubmit({
      name: data.name,
      tel: data.contact,
    });
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Reference Manually"
      size="md"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="text-sm text-gray-600 mb-4">
          Enter the contact details of someone who can vouch for your
          application. They will receive a WhatsApp notification about your
          voter registration.
        </div>

        <Input
          label="Full Name"
          placeholder="Enter reference's full name"
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="Contact Number"
          placeholder="Enter 10-digit mobile number"
          type="tel"
          maxLength={10}
          error={errors.contact?.message}
          {...register('contact')}
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            Add Reference
          </Button>
        </div>
      </form>
    </Modal>
  );
};
