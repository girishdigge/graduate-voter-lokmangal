import React, { useState } from 'react';
import {
  X,
  Edit3,
  Save,
  User,
  MapPin,
  Phone,
  GraduationCap,
  Vote,
  Shield,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { apiEndpoints } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

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
  epicNumber?: string;
  disabilities?: string;
  university: string;
  graduationYear: string;
  graduationDocumentType: string;
  isVerified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: UserData;
  onUpdate: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  userData,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState(userData);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { updateUser } = useAuth();

  if (!isOpen) return null;

  const handleEdit = () => {
    setIsEditing(true);
    setEditData(userData);
    setError(null);
    setSuccessMessage(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(userData);
    setError(null);
    setSuccessMessage(null);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      // Transform data to match backend expectations - only include updatable fields
      const transformedData: any = {};

      // Only include fields that have values or are required
      if (editData.fullName) transformedData.fullName = editData.fullName;
      if (editData.sex) transformedData.sex = editData.sex;
      if (editData.guardianSpouse)
        transformedData.guardianSpouse = editData.guardianSpouse;
      if (editData.qualification)
        transformedData.qualification = editData.qualification;
      if (editData.occupation) transformedData.occupation = editData.occupation;
      if (editData.contact) transformedData.contact = editData.contact;
      if (editData.email) transformedData.email = editData.email;
      if (editData.dateOfBirth)
        transformedData.dateOfBirth = editData.dateOfBirth;
      if (editData.houseNumber)
        transformedData.houseNumber = editData.houseNumber;
      if (editData.street) transformedData.street = editData.street;
      if (editData.area) transformedData.area = editData.area;
      if (editData.city) transformedData.city = editData.city;
      if (editData.state) transformedData.state = editData.state;
      if (editData.pincode) transformedData.pincode = editData.pincode;

      // Boolean field
      transformedData.isRegisteredElector = Boolean(
        editData.isRegisteredElector
      );

      // Electoral fields (only if registered elector)
      if (editData.isRegisteredElector) {
        if (editData.assemblyNumber)
          transformedData.assemblyNumber = editData.assemblyNumber;
        if (editData.assemblyName)
          transformedData.assemblyName = editData.assemblyName;
        if (editData.pollingStationNumber)
          transformedData.pollingStationNumber = editData.pollingStationNumber;
        if (editData.epicNumber)
          transformedData.epicNumber = editData.epicNumber;
      }

      // Disabilities array
      if (editData.disabilities) {
        transformedData.disabilities = editData.disabilities
          .split(', ')
          .map(d => d.trim())
          .filter(d => d);
      } else {
        transformedData.disabilities = [];
      }

      // Education fields
      if (editData.university) transformedData.university = editData.university;
      if (editData.graduationYear) {
        transformedData.graduationYear = parseInt(
          editData.graduationYear.toString()
        );
      }
      if (editData.graduationDocumentType) {
        transformedData.graduationDocType = editData.graduationDocumentType;
      }

      console.log('Sending transformed data:', transformedData);
      console.log('Original edit data:', editData);

      const response = await apiEndpoints.updateUserById(
        editData.id,
        transformedData as unknown as Record<string, unknown>
      );

      if (response.data.success) {
        const updatedUserData = response.data.data.user;
        setSuccessMessage('Profile updated successfully!');
        setIsEditing(false);

        // Update auth context
        updateUser({
          fullName: updatedUserData.fullName,
          contact: updatedUserData.contact,
          email: updatedUserData.email,
        });

        // Refresh parent component
        onUpdate();

        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      console.error('Error response:', error.response?.data);
      console.error('Edit data:', editData);

      let errorMessage = 'Failed to update profile. Please try again.';

      if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      } else if (error.response?.data?.error?.details) {
        const details = error.response.data.error.details;
        if (Array.isArray(details)) {
          errorMessage = `Validation errors: ${details
            .map(d => `${d.field}: ${d.message}`)
            .join(', ')}`;
        }
      } else if (error.response?.status === 500) {
        errorMessage =
          'Server error occurred. Please try again later or contact support.';
      }

      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    let processedValue: any = value;

    if (field === 'isRegisteredElector') {
      processedValue = value === 'true';
    } else if (field === 'graduationYear') {
      processedValue = value ? parseInt(value as string) : null;
    }

    setEditData(prev => ({
      ...prev,
      [field]: processedValue,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-50 rounded-lg mr-3">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Profile Details
              </h2>
              <p className="text-sm text-gray-600">
                Complete profile information
              </p>
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
                Edit
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  loading={isSaving}
                  className="flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            )}
            <Button onClick={onClose} variant="ghost" className="p-2">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">{successMessage}</p>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Personal Information */}
          <div>
            <div className="flex items-center mb-4">
              <User className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">
                Personal Information
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.fullName}
                    onChange={e =>
                      handleInputChange('fullName', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{userData.fullName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sex
                </label>
                {isEditing ? (
                  <select
                    value={editData.sex}
                    onChange={e => handleInputChange('sex', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                ) : (
                  <p className="text-gray-900">{userData.sex}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Guardian/Spouse
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.guardianSpouse}
                    onChange={e =>
                      handleInputChange('guardianSpouse', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{userData.guardianSpouse}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={
                      editData.dateOfBirth
                        ? editData.dateOfBirth.split('T')[0]
                        : ''
                    }
                    onChange={e =>
                      handleInputChange('dateOfBirth', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">
                    {userData.dateOfBirth
                      ? `${new Date(userData.dateOfBirth).toLocaleDateString('en-IN')} (Age: ${userData.age || 'N/A'})`
                      : 'Not provided'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Occupation
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.occupation}
                    onChange={e =>
                      handleInputChange('occupation', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{userData.occupation}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Qualification
                </label>
                {isEditing ? (
                  <select
                    value={editData.qualification}
                    onChange={e =>
                      handleInputChange('qualification', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Qualification</option>
                    <option value="GRADUATE">Graduate</option>
                    <option value="POST_GRADUATE">Post Graduate</option>
                    <option value="DIPLOMA">Diploma</option>
                    <option value="DOCTORATE">Doctorate</option>
                    <option value="OTHER">Other</option>
                  </select>
                ) : (
                  <p className="text-gray-900">{userData.qualification}</p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <div className="flex items-center mb-4">
              <Phone className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">
                Contact Information
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editData.contact}
                    onChange={e => handleInputChange('contact', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{userData.contact}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editData.email || ''}
                    onChange={e => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">
                    {userData.email || 'Not provided'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div>
            <div className="flex items-center mb-4">
              <MapPin className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">
                Address Information
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  House Number
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.houseNumber}
                    onChange={e =>
                      handleInputChange('houseNumber', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{userData.houseNumber}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.street}
                    onChange={e => handleInputChange('street', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{userData.street}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Area
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.area}
                    onChange={e => handleInputChange('area', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{userData.area}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.city}
                    onChange={e => handleInputChange('city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{userData.city}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.state}
                    onChange={e => handleInputChange('state', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{userData.state}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pincode
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.pincode}
                    onChange={e => handleInputChange('pincode', e.target.value)}
                    pattern="[0-9]{6}"
                    maxLength={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{userData.pincode}</p>
                )}
              </div>
            </div>
          </div>

          {/* Electoral Information */}
          <div>
            <div className="flex items-center mb-4">
              <Vote className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">
                Electoral Information
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Registered Elector
                </label>
                {isEditing ? (
                  <select
                    value={editData.isRegisteredElector ? 'true' : 'false'}
                    onChange={e =>
                      handleInputChange(
                        'isRegisteredElector',
                        e.target.value === 'true' ? 'true' : 'false'
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                ) : (
                  <p className="text-gray-900">
                    {userData.isRegisteredElector ? 'Yes' : 'No'}
                  </p>
                )}
              </div>
              {(isEditing
                ? editData.isRegisteredElector
                : userData.isRegisteredElector) && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assembly Number
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.assemblyNumber || ''}
                        onChange={e =>
                          handleInputChange('assemblyNumber', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {userData.assemblyNumber || 'Not provided'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assembly Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.assemblyName || ''}
                        onChange={e =>
                          handleInputChange('assemblyName', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {userData.assemblyName || 'Not provided'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Polling Station
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.pollingStationNumber || ''}
                        onChange={e =>
                          handleInputChange(
                            'pollingStationNumber',
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {userData.pollingStationNumber || 'Not provided'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      EPIC Number
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.epicNumber || ''}
                        onChange={e =>
                          handleInputChange('epicNumber', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {userData.epicNumber || 'Not provided'}
                      </p>
                    )}
                  </div>
                </>
              )}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Disabilities (if any)
                </label>
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {[
                        'VISUAL_IMPAIRMENT',
                        'SPEECH_AND_HEARING_DISABILITY',
                        'LOCOMOTOR_DISABILITY',
                        'Other',
                      ].map(disability => {
                        const selectedDisabilities = editData.disabilities
                          ? (() => {
                              try {
                                // Try to parse as JSON first (database format)
                                return JSON.parse(editData.disabilities);
                              } catch {
                                // Fallback to comma-separated string
                                return editData.disabilities.split(', ');
                              }
                            })()
                          : [];
                        return (
                          <label
                            key={disability}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="checkbox"
                              checked={selectedDisabilities.includes(
                                disability
                              )}
                              onChange={e => {
                                const currentDisabilities =
                                  editData.disabilities
                                    ? (() => {
                                        try {
                                          // Try to parse as JSON first (database format)
                                          return JSON.parse(
                                            editData.disabilities
                                          );
                                        } catch {
                                          // Fallback to comma-separated string
                                          return editData.disabilities
                                            .split(', ')
                                            .filter(d => d.trim());
                                        }
                                      })()
                                    : [];
                                let newDisabilities;
                                if (e.target.checked) {
                                  newDisabilities = [
                                    ...currentDisabilities,
                                    disability,
                                  ];
                                } else {
                                  newDisabilities = currentDisabilities.filter(
                                    (d: string) => d !== disability
                                  );
                                }
                                handleInputChange(
                                  'disabilities',
                                  newDisabilities.join(', ')
                                );
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">
                              {disability}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    {editData.disabilities?.includes('Other') && (
                      <input
                        type="text"
                        placeholder="Please specify other disability"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        onChange={e => {
                          const currentDisabilities = editData.disabilities
                            ? (() => {
                                try {
                                  // Try to parse as JSON first (database format)
                                  return JSON.parse(
                                    editData.disabilities
                                  ).filter(
                                    (d: string) => d.trim() && d !== 'Other'
                                  );
                                } catch {
                                  // Fallback to comma-separated string
                                  return editData.disabilities
                                    .split(', ')
                                    .filter(
                                      (d: string) => d.trim() && d !== 'Other'
                                    );
                                }
                              })()
                            : [];
                          const otherText = e.target.value.trim();
                          const newDisabilities = otherText
                            ? [...currentDisabilities, 'Other', otherText]
                            : [...currentDisabilities, 'Other'];
                          handleInputChange(
                            'disabilities',
                            newDisabilities.join(', ')
                          );
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <p className="text-gray-900">
                    {userData.disabilities || 'None'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Education Information */}
          <div>
            <div className="flex items-center mb-4">
              <GraduationCap className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">
                Education Information
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  University
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.university}
                    onChange={e =>
                      handleInputChange('university', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{userData.university}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Graduation Year
                </label>
                {isEditing ? (
                  <select
                    value={editData.graduationYear}
                    onChange={e =>
                      handleInputChange('graduationYear', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select graduation year</option>
                    {Array.from(
                      { length: new Date().getFullYear() - 1949 },
                      (_, i) => {
                        const year = new Date().getFullYear() - i;
                        return (
                          <option key={year} value={year.toString()}>
                            {year}
                          </option>
                        );
                      }
                    )}
                  </select>
                ) : (
                  <p className="text-gray-900">{userData.graduationYear}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Type
                </label>
                {isEditing ? (
                  <select
                    value={editData.graduationDocumentType}
                    onChange={e =>
                      handleInputChange(
                        'graduationDocumentType',
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Document Type</option>
                    <option value="DEGREE_CERTIFICATE">
                      Degree Certificate
                    </option>
                    <option value="DIPLOMA">Diploma</option>
                    <option value="MARKSHEET">Marksheet</option>
                    <option value="OTHER">Other</option>
                  </select>
                ) : (
                  <p className="text-gray-900">
                    {userData.graduationDocumentType?.replace('_', ' ') ||
                      'Not provided'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* System Information */}
          <div>
            <div className="flex items-center mb-4">
              <Shield className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">
                System Information
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Aadhar Number
                </label>
                <p className="text-gray-900">
                  {userData.aadharNumber
                    ? `${userData.aadharNumber}`
                    : 'Not provided'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Registration Date
                </label>
                <p className="text-gray-900">
                  {userData.createdAt
                    ? new Date(userData.createdAt).toLocaleDateString('en-IN')
                    : 'Not available'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Verification Status
                </label>
                <p
                  className={`font-medium ${userData.isVerified ? 'text-green-600' : 'text-yellow-600'}`}
                >
                  {userData.isVerified ? 'Verified' : 'Pending Verification'}
                </p>
              </div>
              {userData.verifiedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Verified Date
                  </label>
                  <p className="text-gray-900">
                    {userData.verifiedAt
                      ? new Date(userData.verifiedAt).toLocaleDateString(
                          'en-IN'
                        )
                      : 'Not available'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
