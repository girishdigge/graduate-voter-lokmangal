import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui';
import type { EnrollmentFormData } from '../../lib/validation';
import { enrollmentFormSchema } from '../../lib/validation';
import PersonalInfoSection from './PersonalInfoSection';
import AddressSection from './AddressSection';
import ElectorSection from './ElectorSection';
import EducationSection from './EducationSection';

interface EnrollmentFormProps {
  onSubmit: (data: EnrollmentFormData) => void;
  isLoading?: boolean;
  initialData?: Partial<EnrollmentFormData>;
}

const EnrollmentForm: React.FC<EnrollmentFormProps> = ({
  onSubmit,
  isLoading = false,
  initialData,
}) => {
  const [currentSection, setCurrentSection] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    setValue,
    clearErrors,
    formState: { errors, isValid },
  } = useForm<EnrollmentFormData>({
    resolver: zodResolver(enrollmentFormSchema) as any,
    defaultValues: {
      address: {
        city: 'Pune',
        state: 'Maharashtra',
      },
      elector: {
        isRegisteredElector: false,
      },
      ...initialData,
    },
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  const watchDateOfBirth = watch('personalInfo.dateOfBirth');

  const sections = [
    {
      title: 'Personal Information',
      component: (
        <PersonalInfoSection
          register={register}
          errors={errors}
          watchDateOfBirth={watchDateOfBirth}
        />
      ),
      fields: [
        'personalInfo.fullName',
        'personalInfo.sex',
        'personalInfo.guardianSpouse',
        'personalInfo.qualification',
        'personalInfo.occupation',
        'personalInfo.contact',
        'personalInfo.email',
        'personalInfo.dateOfBirth',
      ] as const,
    },
    {
      title: 'Address Information',
      component: <AddressSection register={register} errors={errors} />,
      fields: [
        'address.houseNumber',
        'address.street',
        'address.area',
        'address.city',
        'address.state',
        'address.pincode',
      ] as const,
    },
    {
      title: 'Elector Information',
      component: (
        <ElectorSection
          register={register}
          errors={errors}
          watch={watch}
          setValue={setValue}
          clearErrors={clearErrors}
        />
      ),
      fields: [
        'elector.isRegisteredElector',
        'elector.assemblyNumber',
        'elector.assemblyName',
        'elector.pollingStationNumber',
        'elector.epicNumber',
        'elector.disabilities',
      ] as const,
    },
    {
      title: 'Education Information',
      component: <EducationSection register={register} errors={errors} />,
      fields: [
        'education.university',
        'education.graduationYear',
        'education.graduationDocumentType',
      ] as const,
    },
  ];

  const handleNext = async () => {
    const currentFields = sections[currentSection].fields;
    const isCurrentSectionValid = await trigger(currentFields);

    if (isCurrentSectionValid) {
      setCurrentSection(prev => Math.min(prev + 1, sections.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentSection(prev => Math.max(prev - 1, 0));
  };

  const onFormSubmit = (data: EnrollmentFormData) => {
    onSubmit(data);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {sections.map((_, index) => (
            <div
              key={index}
              className={`flex items-center ${
                index < sections.length - 1 ? 'flex-1' : ''
              }`}
            >
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  index <= currentSection
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-gray-300 text-gray-500'
                }`}
              >
                {index < currentSection ? (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              {index < sections.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-4 ${
                    index < currentSection ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {sections[currentSection].title}
          </h2>
          <p className="text-sm text-gray-600">
            Step {currentSection + 1} of {sections.length}
          </p>
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit(onFormSubmit as any)} className="space-y-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {sections[currentSection].component}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentSection === 0}
          >
            Previous
          </Button>

          <div className="flex space-x-4">
            {currentSection < sections.length - 1 ? (
              <Button type="button" onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                loading={isLoading}
                disabled={!isValid || isLoading}
              >
                Submit Enrollment
              </Button>
            )}
          </div>
        </div>
      </form>

      {/* Form Summary - Show on last step */}
      {currentSection === sections.length - 1 && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            Ready to Submit
          </h3>
          <p className="text-blue-800 text-sm">
            Please review all the information you've entered. After submission,
            you'll be able to upload your documents and add references.
          </p>
          <div className="mt-4 text-sm text-blue-700">
            <p className="font-medium">Next steps after submission:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>
                Upload required documents (Aadhar, Photo, Degree Certificate)
              </li>
              <li>Add references who can vouch for your application</li>
              <li>Wait for admin verification</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrollmentForm;
