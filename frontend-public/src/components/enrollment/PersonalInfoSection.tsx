import React from 'react';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Input, Select } from '../ui';
import type { EnrollmentFormData } from '../../lib/validation';
import { calculateAge } from '../../lib/utils';

interface PersonalInfoSectionProps {
  register: UseFormRegister<EnrollmentFormData>;
  errors: FieldErrors<EnrollmentFormData>;
  watchDateOfBirth: string;
}

const PersonalInfoSection: React.FC<PersonalInfoSectionProps> = ({
  register,
  errors,
  watchDateOfBirth,
}) => {
  const age = watchDateOfBirth ? calculateAge(watchDateOfBirth) : 0;

  const qualificationOptions = [
    { value: 'GRADUATE', label: 'Graduate' },
    { value: 'POST_GRADUATE', label: 'Post Graduate' },
    { value: 'PROFESSIONAL', label: 'Professional Degree' },
    { value: 'OTHER', label: 'Other' },
  ];

  const sexOptions = [
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
    { value: 'OTHER', label: 'Other' },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Personal Information
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Please provide your personal details as they appear on your official
          documents.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Full Name *"
          placeholder="Enter your full name"
          {...register('personalInfo.fullName')}
          error={errors.personalInfo?.fullName?.message}
        />

        <Select
          label="Sex *"
          placeholder="Select your sex"
          options={sexOptions}
          {...register('personalInfo.sex')}
          error={errors.personalInfo?.sex?.message}
        />

        <Input
          label="Guardian/Spouse Name *"
          placeholder="Enter guardian or spouse name"
          {...register('personalInfo.guardianSpouse')}
          error={errors.personalInfo?.guardianSpouse?.message}
        />

        <Select
          label="Qualification *"
          placeholder="Select your qualification"
          options={qualificationOptions}
          {...register('personalInfo.qualification')}
          error={errors.personalInfo?.qualification?.message}
        />

        <Input
          label="Occupation *"
          placeholder="Enter your occupation"
          {...register('personalInfo.occupation')}
          error={errors.personalInfo?.occupation?.message}
        />

        <Input
          label="Contact Number *"
          type="tel"
          placeholder="Enter 10-digit mobile number"
          maxLength={10}
          {...register('personalInfo.contact')}
          error={errors.personalInfo?.contact?.message}
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="Enter your email address (optional)"
          {...register('personalInfo.email')}
          error={errors.personalInfo?.email?.message}
        />

        <div className="space-y-2">
          <Input
            label="Date of Birth *"
            type="date"
            {...register('personalInfo.dateOfBirth')}
            error={errors.personalInfo?.dateOfBirth?.message}
          />
          {age > 0 && (
            <p className="text-sm text-blue-600">
              Age: {age} years
              {age < 18 && (
                <span className="text-red-600 ml-2">
                  (Must be 18+ to register as voter)
                </span>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoSection;
