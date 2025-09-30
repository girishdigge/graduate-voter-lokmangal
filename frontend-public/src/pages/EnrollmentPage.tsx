import React from 'react';
import { EnrollmentForm } from '../components/enrollment';
import type { EnrollmentFormData } from '../lib/validation';

const EnrollmentPage: React.FC = () => {
  const handleEnrollmentSubmit = async (data: EnrollmentFormData) => {
    try {
      // TODO: Implement API call to submit enrollment data
      console.log('Enrollment data:', data);

      // For now, just log the data and show success message
      alert(
        'Enrollment form submitted successfully! This will be connected to the API in the next tasks.'
      );

      // Navigate to dashboard or next step
      // navigate('/dashboard');
    } catch (error) {
      console.error('Enrollment submission error:', error);
      alert('Failed to submit enrollment. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Voter Enrollment Form
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Please fill out all required information to complete your voter
              registration. All fields marked with * are mandatory.
            </p>
          </div>

          <EnrollmentForm onSubmit={handleEnrollmentSubmit} isLoading={false} />
        </div>
      </div>
    </div>
  );
};

export default EnrollmentPage;
