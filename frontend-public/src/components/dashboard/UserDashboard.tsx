import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { UserProfile } from './UserProfile';
import { DocumentsList } from './DocumentsList';
import { ReferencesList } from './ReferencesList';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { apiEndpoints } from '../../lib/api';
import { Edit3, Save, X } from 'lucide-react';

interface UserData {
  id: string;
  aadharNumber: string;
  fullName: string;
  sex: 'MALE' | 'FEMALE' | 'OTHER';
  guardianSpouse: string;
  qualification: string;
  occupation: string;
  contact: string;
  email?: string;
  dateOfBirth: string;
  age: number;
  houseNumber: string;
  street: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  isRegisteredElector: boolean;
  assemblyNumber?: string;
  assemblyName?: string;
  pollingStationNumber?: string;
  electorDob?: string;
  epicNumber?: string;
  university: string;
  graduationYear: string;
  graduationDocumentType: string;
  isVerified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserDashboardProps {
  className?: string;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ className }) => {
  const { user, updateUser } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadUserData();
    }
  }, [user?.id]);

  const loadUserData = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await apiEndpoints.getUserProfile(user.id);
      setUserData(response.data.user);
    } catch (error: any) {
      console.error('Failed to load user data:', error);
      setError(
        error.response?.data?.error?.message ||
          'Failed to load profile data. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
    setSuccessMessage(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setError(null);
    setSuccessMessage(null);
    // Reload data to reset any unsaved changes
    loadUserData();
  };

  const handleSave = async (updatedData: Partial<UserData>) => {
    if (!user?.id || !userData) return;

    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      const response = await apiEndpoints.updateUserProfile(
        user.id,
        updatedData
      );
      const updatedUserData = response.data.user;

      setUserData(updatedUserData);
      setIsEditing(false);
      setSuccessMessage('Profile updated successfully!');

      // Update auth context with basic user info
      updateUser({
        fullName: updatedUserData.fullName,
        contact: updatedUserData.contact,
        email: updatedUserData.email,
      });

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      setError(
        error.response?.data?.error?.message ||
          'Failed to update profile. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDataChange = (updatedData: Partial<UserData>) => {
    if (userData) {
      setUserData({ ...userData, ...updatedData });
    }
  };

  if (isLoading) {
    return (
      <div className={`flex justify-center py-12 ${className}`}>
        <LoadingSpinner size="lg" text="Loading your profile..." />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800 mb-4">
            {error || 'Failed to load profile data.'}
          </p>
          <Button onClick={loadUserData} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Edit Toggle */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              My Profile
            </h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div
                  className={`w-3 h-3 rounded-full mr-2 ${
                    userData.isVerified ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                />
                <span className="text-sm font-medium text-gray-700">
                  {userData.isVerified ? 'Verified' : 'Pending Verification'}
                </span>
              </div>
              {userData.verifiedAt && (
                <span className="text-sm text-gray-500">
                  Verified on{' '}
                  {new Date(userData.verifiedAt).toLocaleDateString('en-IN')}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <Button
                onClick={handleEdit}
                variant="outline"
                className="flex items-center"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  onClick={handleCancelEdit}
                  variant="outline"
                  disabled={isSaving}
                  className="flex items-center"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={() => handleSave(userData)}
                  loading={isSaving}
                  className="flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800">{successMessage}</p>
          </div>
        )}
      </div>

      {/* User Profile Section */}
      <UserProfile
        userData={userData}
        isEditing={isEditing}
        onChange={handleDataChange}
        disabled={isSaving}
      />

      {/* Documents Section */}
      <DocumentsList userId={userData.id} />

      {/* References Section */}
      <ReferencesList userId={userData.id} />
    </div>
  );
};
