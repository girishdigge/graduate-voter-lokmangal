import React from 'react';

const EnrollmentPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Voter Enrollment Form
            </h1>
            <p className="text-gray-600 mb-8">
              Please fill out all required information to complete your voter
              registration.
            </p>

            {/* Placeholder for enrollment form - will be implemented in task 16 */}
            <div className="text-center py-12 text-gray-500">
              <p>Enrollment form will be implemented in the next task</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnrollmentPage;
