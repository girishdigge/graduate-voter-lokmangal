import React, { useState } from 'react';
import { User, Eye, MapPin, Phone, Mail, GraduationCap } from 'lucide-react';
import { Button } from '../ui/Button';
import { ProfileModal } from '../dashboard';

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

interface ProfileCardProps {
  userData: UserData;
  onUpdate: () => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  userData,
  onUpdate,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getFullAddress = () => {
    return `${userData.houseNumber}, ${userData.street}, ${userData.area}, ${userData.city}, ${userData.state} - ${userData.pincode}`;
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <div className="p-2 bg-blue-50 rounded-lg mr-3">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Profile</h3>
            <p className="text-sm text-gray-600">Personal information</p>
          </div>
        </div>

        {/* Profile Preview */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center">
            <User className="h-4 w-4 text-gray-400 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {userData.fullName}
              </p>
              <p className="text-xs text-gray-500">
                {userData.sex} • Age {userData.age}
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <MapPin className="h-4 w-4 text-gray-400 mr-3 mt-0.5" />
            <div>
              <p className="text-sm text-gray-900">{getFullAddress()}</p>
            </div>
          </div>

          <div className="flex items-center">
            <Phone className="h-4 w-4 text-gray-400 mr-3" />
            <p className="text-sm text-gray-900">{userData.contact}</p>
          </div>

          {userData.email && (
            <div className="flex items-center">
              <Mail className="h-4 w-4 text-gray-400 mr-3" />
              <p className="text-sm text-gray-900">{userData.email}</p>
            </div>
          )}

          <div className="flex items-center">
            <GraduationCap className="h-4 w-4 text-gray-400 mr-3" />
            <div>
              <p className="text-sm text-gray-900">{userData.qualification}</p>
              <p className="text-xs text-gray-500">
                {userData.university} • {userData.graduationYear}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => setIsModalOpen(true)}
            className="flex-1 flex items-center justify-center"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {userData.isRegisteredElector ? 'Yes' : 'No'}
              </p>
              <p className="text-xs text-gray-500">Registered Elector</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {userData.isVerified ? 'Yes' : 'No'}
              </p>
              <p className="text-xs text-gray-500">Verified</p>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userData={userData}
        onUpdate={onUpdate}
      />
    </>
  );
};
