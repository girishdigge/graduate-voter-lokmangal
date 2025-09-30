import React from 'react';
import type {
  UseFormRegister,
  FieldErrors,
  UseFormWatch,
} from 'react-hook-form';
import { Input } from '../ui';
import type { EnrollmentFormData } from '../../lib/validation';

interface ElectorSectionProps {
  register: UseFormRegister<EnrollmentFormData>;
  errors: FieldErrors<EnrollmentFormData>;
  watch: UseFormWatch<EnrollmentFormData>;
}

const ElectorSection: React.FC<ElectorSectionProps> = ({
  register,
  errors,
  watch,
}) => {
  const isRegisteredElector = watch('elector.isRegisteredElector');

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Elector Information
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Please provide your voter registration details if you are already
          registered.
        </p>
      </div>

      <div className="space-y-6">
        {/* Registered Elector Checkbox */}
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="isRegisteredElector"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            {...register('elector.isRegisteredElector')}
          />
          <label
            htmlFor="isRegisteredElector"
            className="text-sm font-medium text-gray-700"
          >
            I am already a registered elector
          </label>
        </div>

        {/* Conditional Fields - Only show if registered elector */}
        {isRegisteredElector && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="md:col-span-2">
              <p className="text-sm text-blue-800 mb-4">
                Please provide your existing voter registration details:
              </p>
            </div>

            <Input
              label="Assembly Number *"
              placeholder="Enter assembly constituency number"
              {...register('elector.assemblyNumber')}
              error={errors.elector?.assemblyNumber?.message}
            />

            <Input
              label="Assembly Name *"
              placeholder="Enter assembly constituency name"
              {...register('elector.assemblyName')}
              error={errors.elector?.assemblyName?.message}
            />

            <Input
              label="Polling Station Number *"
              placeholder="Enter polling station number"
              {...register('elector.pollingStationNumber')}
              error={errors.elector?.pollingStationNumber?.message}
            />

            <Input
              label="Date of Birth (as per voter list) *"
              type="date"
              {...register('elector.electorDob')}
              error={errors.elector?.electorDob?.message}
              helperText="Date of birth as mentioned in your voter ID card"
            />

            <div className="md:col-span-2">
              <Input
                label="EPIC Number *"
                placeholder="Enter your Voter ID (EPIC) number"
                {...register('elector.epicNumber')}
                error={errors.elector?.epicNumber?.message}
                helperText="Enter the alphanumeric code on your Voter ID card"
              />
            </div>
          </div>
        )}

        {/* Error message for conditional validation */}
        {errors.elector?.isRegisteredElector && (
          <p className="text-sm text-red-600">
            {errors.elector.isRegisteredElector.message}
          </p>
        )}
      </div>
    </div>
  );
};

export default ElectorSection;
