import React from 'react';
import type {
  UseFormRegister,
  FieldErrors,
  UseFormWatch,
  UseFormSetValue,
} from 'react-hook-form';
import { Input } from '../ui';
import type { EnrollmentFormData } from '../../lib/validation';

interface ElectorSectionProps {
  register: UseFormRegister<EnrollmentFormData>;
  errors: FieldErrors<EnrollmentFormData>;
  watch: UseFormWatch<EnrollmentFormData>;
  setValue: UseFormSetValue<EnrollmentFormData>;
}

const ElectorSection: React.FC<ElectorSectionProps> = ({
  register,
  errors,
  watch,
  setValue,
}) => {
  const isRegisteredElector = watch('elector.isRegisteredElector');
  const selectedDisabilities = watch('elector.disabilities') || [];

  const disabilityOptions = [
    { value: 'VISUAL_IMPAIRMENT', label: 'Visual Impairment' },
    {
      value: 'SPEECH_AND_HEARING_DISABILITY',
      label: 'Speech and Hearing Disability',
    },
    { value: 'LOCOMOTOR_DISABILITY', label: 'Locomotor Disability' },
    { value: 'OTHER', label: 'Other' },
  ];

  const handleDisabilityChange = (value: string, checked: boolean) => {
    const currentDisabilities = selectedDisabilities || [];
    if (checked) {
      setValue('elector.disabilities', [...currentDisabilities, value]);
    } else {
      setValue(
        'elector.disabilities',
        currentDisabilities.filter(d => d !== value)
      );
    }
  };

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
              label="EPIC Number *"
              placeholder="Enter your Voter ID (EPIC) number"
              {...register('elector.epicNumber')}
              error={errors.elector?.epicNumber?.message}
              helperText="Enter the alphanumeric code on your Voter ID card"
            />

            <div className="md:col-span-2"></div>
          </div>
        )}

        {/* Disability Information */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">
              Disability, If Any:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {disabilityOptions.map(option => (
                <div key={option.value} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id={`disability-${option.value}`}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={selectedDisabilities.includes(option.value)}
                    onChange={e =>
                      handleDisabilityChange(option.value, e.target.checked)
                    }
                  />
                  <label
                    htmlFor={`disability-${option.value}`}
                    className="text-sm text-gray-700"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

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
