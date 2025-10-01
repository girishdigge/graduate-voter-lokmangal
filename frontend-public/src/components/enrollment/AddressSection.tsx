import React from 'react';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Input } from '../ui';
import type { EnrollmentFormData } from '../../lib/validation';

interface AddressSectionProps {
  register: UseFormRegister<EnrollmentFormData>;
  errors: FieldErrors<EnrollmentFormData>;
}

const AddressSection: React.FC<AddressSectionProps> = ({
  register,
  errors,
}) => {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Address Information
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Please provide your current residential address details.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="House Number *"
          placeholder="Enter house/flat number"
          {...register('address.houseNumber')}
          error={errors.address?.houseNumber?.message}
        />

        <Input
          label="Street *"
          placeholder="Enter street name"
          {...register('address.street')}
          error={errors.address?.street?.message}
        />

        <Input
          label="Area/Locality *"
          placeholder="Enter area or locality"
          {...register('address.area')}
          error={errors.address?.area?.message}
        />

        <Input
          label="City *"
          placeholder="City"
          defaultValue="Pune"
          {...register('address.city')}
          error={errors.address?.city?.message}
          helperText="Default city is set to PUNE"
        />

        <Input
          label="State *"
          placeholder="Enter state"
          defaultValue="Maharashtra"
          {...register('address.state')}
          error={errors.address?.state?.message}
        />

        <Input
          label="Pincode *"
          placeholder="Enter 6-digit pincode"
          maxLength={6}
          {...register('address.pincode')}
          error={errors.address?.pincode?.message}
        />
      </div>
    </div>
  );
};

export default AddressSection;
