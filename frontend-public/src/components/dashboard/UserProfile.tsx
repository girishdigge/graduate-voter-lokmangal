import React from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { User, MapPin, GraduationCap, Vote } from 'lucide-react';

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

interface UserProfileProps {
  userData: UserData;
  isEditing: boolean;
  onChange: (data: Partial<UserData>) => void;
  disabled?: boolean;
  className?: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  userData,
  isEditing,
  onChange,
  disabled = false,
  className,
}) => {
  const handleInputChange = (
    field: keyof UserData,
    value: string | boolean
  ) => {
    onChange({ [field]: value });
  };

  const formatDisplayValue = (value: string | undefined) => {
    return value || 'Not provided';
  };

  const qualificationOptions = [
    { value: 'GRADUATE', label: 'Graduate' },
    { value: 'POST_GRADUATE', label: 'Post Graduate' },
    { value: 'PROFESSIONAL', label: 'Professional' },
    { value: 'OTHER', label: 'Other' },
  ];

  const sexOptions = [
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
    { value: 'OTHER', label: 'Other' },
  ];

  const documentTypeOptions = [
    { value: 'DEGREE_CERTIFICATE', label: 'Degree Certificate' },
    { value: 'DIPLOMA', label: 'Diploma' },
    { value: 'MARKSHEET', label: 'Marksheet' },
    { value: 'OTHER', label: 'Other' },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Personal Information */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-6">
          <User className="h-5 w-5 text-blue-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">
            Personal Information
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Aadhar Number - Always read-only */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Aadhar Number
            </label>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md font-mono text-gray-900">
              {userData.aadharNumber}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Aadhar number cannot be changed
            </p>
          </div>

          {/* Full Name */}
          {isEditing ? (
            <Input
              label="Full Name"
              value={userData.fullName}
              onChange={e => handleInputChange('fullName', e.target.value)}
              disabled={disabled}
              required
            />
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                {userData.fullName}
              </div>
            </div>
          )}

          {/* Sex */}
          {isEditing ? (
            <Select
              label="Sex"
              value={userData.sex}
              onChange={e => handleInputChange('sex', e.target.value)}
              options={sexOptions}
              disabled={disabled}
              required
            />
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sex
              </label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                {sexOptions.find(opt => opt.value === userData.sex)?.label ||
                  userData.sex}
              </div>
            </div>
          )}

          {/* Guardian/Spouse */}
          {isEditing ? (
            <Input
              label="Guardian/Spouse Name"
              value={userData.guardianSpouse}
              onChange={e =>
                handleInputChange('guardianSpouse', e.target.value)
              }
              disabled={disabled}
              required
            />
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Guardian/Spouse Name
              </label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                {userData.guardianSpouse}
              </div>
            </div>
          )}

          {/* Date of Birth */}
          {isEditing ? (
            <Input
              label="Date of Birth"
              type="date"
              value={userData.dateOfBirth}
              onChange={e => handleInputChange('dateOfBirth', e.target.value)}
              disabled={disabled}
              required
            />
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth
              </label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                {new Date(userData.dateOfBirth).toLocaleDateString('en-IN')}{' '}
                (Age: {userData.age})
              </div>
            </div>
          )}

          {/* Qualification */}
          {isEditing ? (
            <Select
              label="Qualification"
              value={userData.qualification}
              onChange={e => handleInputChange('qualification', e.target.value)}
              options={qualificationOptions}
              disabled={disabled}
              required
            />
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Qualification
              </label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                {qualificationOptions.find(
                  opt => opt.value === userData.qualification
                )?.label || userData.qualification}
              </div>
            </div>
          )}

          {/* Occupation */}
          {isEditing ? (
            <Input
              label="Occupation"
              value={userData.occupation}
              onChange={e => handleInputChange('occupation', e.target.value)}
              disabled={disabled}
              required
            />
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Occupation
              </label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                {userData.occupation}
              </div>
            </div>
          )}

          {/* Contact */}
          {isEditing ? (
            <Input
              label="Contact Number"
              value={userData.contact}
              onChange={e => handleInputChange('contact', e.target.value)}
              disabled={disabled}
              pattern="[0-9]{10}"
              maxLength={10}
              required
            />
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number
              </label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md font-mono">
                {userData.contact}
              </div>
            </div>
          )}

          {/* Email */}
          {isEditing ? (
            <Input
              label="Email (Optional)"
              type="email"
              value={userData.email || ''}
              onChange={e => handleInputChange('email', e.target.value)}
              disabled={disabled}
            />
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                {formatDisplayValue(userData.email)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Address Information */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-6">
          <MapPin className="h-5 w-5 text-blue-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">
            Address Information
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* House Number */}
          {isEditing ? (
            <Input
              label="House Number"
              value={userData.houseNumber}
              onChange={e => handleInputChange('houseNumber', e.target.value)}
              disabled={disabled}
              required
            />
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                House Number
              </label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                {userData.houseNumber}
              </div>
            </div>
          )}

          {/* Street */}
          {isEditing ? (
            <Input
              label="Street"
              value={userData.street}
              onChange={e => handleInputChange('street', e.target.value)}
              disabled={disabled}
              required
            />
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street
              </label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                {userData.street}
              </div>
            </div>
          )}

          {/* Area */}
          {isEditing ? (
            <Input
              label="Area"
              value={userData.area}
              onChange={e => handleInputChange('area', e.target.value)}
              disabled={disabled}
              required
            />
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Area
              </label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                {userData.area}
              </div>
            </div>
          )}

          {/* City */}
          {isEditing ? (
            <Input
              label="City"
              value={userData.city}
              onChange={e => handleInputChange('city', e.target.value)}
              disabled={disabled}
              required
            />
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                {userData.city}
              </div>
            </div>
          )}

          {/* State */}
          {isEditing ? (
            <Input
              label="State"
              value={userData.state}
              onChange={e => handleInputChange('state', e.target.value)}
              disabled={disabled}
              required
            />
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                {userData.state}
              </div>
            </div>
          )}

          {/* Pincode */}
          {isEditing ? (
            <Input
              label="Pincode"
              value={userData.pincode}
              onChange={e => handleInputChange('pincode', e.target.value)}
              disabled={disabled}
              pattern="[0-9]{6}"
              maxLength={6}
              required
            />
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pincode
              </label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md font-mono">
                {userData.pincode}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Elector Information */}
      {userData.isRegisteredElector && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center mb-6">
            <Vote className="h-5 w-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">
              Elector Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Assembly Number */}
            {isEditing ? (
              <Input
                label="Assembly Number"
                value={userData.assemblyNumber || ''}
                onChange={e =>
                  handleInputChange('assemblyNumber', e.target.value)
                }
                disabled={disabled}
                required
              />
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assembly Number
                </label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                  {formatDisplayValue(userData.assemblyNumber)}
                </div>
              </div>
            )}

            {/* Assembly Name */}
            {isEditing ? (
              <Input
                label="Assembly Name"
                value={userData.assemblyName || ''}
                onChange={e =>
                  handleInputChange('assemblyName', e.target.value)
                }
                disabled={disabled}
                required
              />
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assembly Name
                </label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                  {formatDisplayValue(userData.assemblyName)}
                </div>
              </div>
            )}

            {/* Polling Station Number */}
            {isEditing ? (
              <Input
                label="Polling Station Number"
                value={userData.pollingStationNumber || ''}
                onChange={e =>
                  handleInputChange('pollingStationNumber', e.target.value)
                }
                disabled={disabled}
                required
              />
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Polling Station Number
                </label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                  {formatDisplayValue(userData.pollingStationNumber)}
                </div>
              </div>
            )}

            {/* Disabilities */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Disability, If Any
              </label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                {userData.disabilities
                  ? (() => {
                      try {
                        const disabilityList = JSON.parse(
                          userData.disabilities
                        );
                        const disabilityLabels = {
                          VISUAL_IMPAIRMENT: 'Visual Impairment',
                          SPEECH_AND_HEARING_DISABILITY:
                            'Speech and Hearing Disability',
                          LOCOMOTOR_DISABILITY: 'Locomotor Disability',
                          OTHER: 'Other',
                        };
                        return disabilityList
                          .map(
                            (d: string) =>
                              disabilityLabels[
                                d as keyof typeof disabilityLabels
                              ] || d
                          )
                          .join(', ');
                      } catch {
                        return userData.disabilities;
                      }
                    })()
                  : 'None'}
              </div>
            </div>

            {/* EPIC Number */}
            {isEditing ? (
              <Input
                label="EPIC Number"
                value={userData.epicNumber || ''}
                onChange={e => handleInputChange('epicNumber', e.target.value)}
                disabled={disabled}
                required
              />
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  EPIC Number
                </label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md font-mono">
                  {formatDisplayValue(userData.epicNumber)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Education Information */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-6">
          <GraduationCap className="h-5 w-5 text-blue-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">
            Education Information
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* University */}
          {isEditing ? (
            <Input
              label="University"
              value={userData.university}
              onChange={e => handleInputChange('university', e.target.value)}
              disabled={disabled}
              required
            />
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                University
              </label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                {userData.university}
              </div>
            </div>
          )}

          {/* Graduation Year */}
          {isEditing ? (
            <Input
              label="Graduation Year"
              value={userData.graduationYear}
              onChange={e =>
                handleInputChange('graduationYear', e.target.value)
              }
              disabled={disabled}
              pattern="[0-9]{4}"
              maxLength={4}
              required
            />
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Graduation Year
              </label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                {userData.graduationYear}
              </div>
            </div>
          )}

          {/* Graduation Document Type */}
          {isEditing ? (
            <Select
              label="Graduation Document Type"
              value={userData.graduationDocumentType}
              onChange={e =>
                handleInputChange('graduationDocumentType', e.target.value)
              }
              options={documentTypeOptions}
              disabled={disabled}
              required
            />
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Graduation Document Type
              </label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                {documentTypeOptions.find(
                  opt => opt.value === userData.graduationDocumentType
                )?.label || userData.graduationDocumentType}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
