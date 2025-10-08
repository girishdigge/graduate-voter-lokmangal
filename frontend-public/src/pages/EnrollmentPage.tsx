import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { EnrollmentForm } from '../components/enrollment';
import { useAuth } from '../hooks/useAuth';
import { apiEndpoints } from '../lib/api';
import type { EnrollmentFormData } from '../lib/validation';

const EnrollmentPage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithUserData } = useAuth();

  // Get Aadhar number from navigation state
  const aadharNumber = location.state?.aadharNumber;

  useEffect(() => {
    // Redirect to home if no Aadhar number is provided
    if (!aadharNumber) {
      navigate('/', { replace: true });
    }
  }, [aadharNumber, navigate]);

  // Don't render the form if no Aadhar number
  if (!aadharNumber) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  const handleEnrollmentSubmit = async (data: EnrollmentFormData) => {
    try {
      setIsSubmitting(true);

      // Validate Aadhar number is available
      if (!aadharNumber) {
        throw new Error(
          'Aadhar number not found. Please start from the beginning.'
        );
      }

      // Transform the form data to match the backend API structure
      const enrollmentData = {
        // Required Aadhar number
        aadharNumber: aadharNumber,

        // Personal Information
        fullName: data.personalInfo.fullName,
        sex: data.personalInfo.sex,
        guardianSpouse: data.personalInfo.guardianSpouse || '',
        qualification: data.personalInfo.qualification || '',
        occupation: data.personalInfo.occupation || '',
        contact: data.personalInfo.contact,
        email: data.personalInfo.email || '',
        dateOfBirth: data.personalInfo.dateOfBirth,

        // Address Information
        houseNumber: data.address.houseNumber,
        street: data.address.street,
        area: data.address.area,
        city: data.address.city,
        state: data.address.state,
        pincode: data.address.pincode,

        // Elector Information
        isRegisteredElector: data.elector.isRegisteredElector,
        assemblyNumber: data.elector.assemblyNumber || '',
        assemblyName: data.elector.assemblyName || '',
        pollingStationNumber: data.elector.pollingStationNumber || '',
        epicNumber: data.elector.epicNumber || '',
        disabilities: Array.isArray(data.elector.disabilities)
          ? data.elector.disabilities.filter(d => d && d.trim() !== '') // Clean array, remove empty strings
          : [],

        // Education Information
        university: data.education.university || '',
        graduationYear: data.education.graduationYear, // Already converted to number by validation schema
        graduationDocType: data.education.graduationDocumentType, // Correct field name
      };

      console.log('Submitting enrollment data:', enrollmentData);
      console.log('Disabilities data:', {
        raw: data.elector.disabilities,
        processed: enrollmentData.disabilities,
        isArray: Array.isArray(enrollmentData.disabilities),
        length: enrollmentData.disabilities?.length,
      });

      // Submit enrollment data to backend
      const response = await apiEndpoints.enrollUser(enrollmentData);

      if (response.data.success) {
        const { user, token } = response.data.data;

        // Store authentication data
        localStorage.setItem('userToken', token);
        localStorage.setItem('userData', JSON.stringify(user));

        // Update auth context
        loginWithUserData(user, token);

        // Show success message
        alert(
          'Enrollment submitted successfully! You can now upload your documents and add references.'
        );

        // Navigate to dashboard for document upload and references
        navigate('/dashboard');
      } else {
        throw new Error(response.data.error?.message || 'Enrollment failed');
      }
    } catch (error: any) {
      console.error('Enrollment submission error:', error);

      let errorMessage = 'Failed to submit enrollment. Please try again.';

      if (error.response?.data?.error?.details) {
        // Show validation errors
        const details = error.response.data.error.details;
        const errorList = details
          .map((err: any) => `${err.field}: ${err.message}`)
          .join('\n');
        errorMessage = `Validation errors:\n${errorList}`;
      } else if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
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

          <EnrollmentForm
            onSubmit={handleEnrollmentSubmit}
            isLoading={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
};

export default EnrollmentPage;
