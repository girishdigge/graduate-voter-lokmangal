import React from 'react';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Input, Select } from '../ui';
import type { EnrollmentFormData } from '../../lib/validation';

interface EducationSectionProps {
  register: UseFormRegister<EnrollmentFormData>;
  errors: FieldErrors<EnrollmentFormData>;
}

const EducationSection: React.FC<EducationSectionProps> = ({
  register,
  errors,
}) => {
  const documentTypeOptions = [
    { value: 'DEGREE_CERTIFICATE', label: 'Degree Certificate' },
    { value: 'DIPLOMA', label: 'Diploma Certificate' },
    { value: 'MARKSHEET', label: 'Final Year Marksheet' },
    { value: 'OTHER', label: 'Other Document' },
  ];

  // Generate year options from 1950 to current year
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let year = currentYear; year >= 1950; year--) {
    yearOptions.push({ value: year.toString(), label: year.toString() });
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Education Information
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Please provide your highest education qualification details.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Input
            label="University/Institution *"
            placeholder="Enter university or institution name"
            {...register('education.university')}
            error={errors.education?.university?.message}
          />
        </div>

        <Select
          label="Graduation Year *"
          placeholder="Select graduation year"
          options={yearOptions}
          {...register('education.graduationYear')}
          error={errors.education?.graduationYear?.message}
        />

        <Select
          label="Graduation Document Type *"
          placeholder="Select document type"
          options={documentTypeOptions}
          {...register('education.graduationDocumentType')}
          error={errors.education?.graduationDocumentType?.message}
          helperText="Type of document you will upload as proof"
        />
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-yellow-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Document Upload Required
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                You will need to upload your graduation document in the next
                step. Please ensure you have a clear, scanned copy ready.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EducationSection;
