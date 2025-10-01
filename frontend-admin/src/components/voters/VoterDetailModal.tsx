import React from 'react';
import {
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  FileText,
  Users,
} from 'lucide-react';
import { Modal, Badge, LoadingSpinner } from '../ui';
import { VerifyButton } from './VerifyButton';
import type { Voter } from '../../types/voter';

interface VoterDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  voter: Voter | null;
  isLoading?: boolean;
  onVerify: (userId: string, isVerified: boolean) => Promise<void>;
  onEdit: (voter: Voter) => void;
}

export const VoterDetailModal: React.FC<VoterDetailModalProps> = ({
  isOpen,
  onClose,
  voter,
  isLoading = false,
  onVerify,
  onEdit,
}) => {
  if (!voter && !isLoading) return null;

  const handleVerify = async (isVerified: boolean) => {
    if (voter) {
      await onVerify(voter.id, isVerified);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={voter ? `Voter Details - ${voter.fullName}` : 'Loading...'}
      size="xl"
    >
      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      ) : voter ? (
        <div className="space-y-6">
          {/* Header with verification status and actions */}
          <div className="flex items-center justify-between pb-4 border-b">
            <div className="flex items-center gap-3">
              <Badge
                variant={voter.isVerified ? 'success' : 'warning'}
                size="md"
              >
                {voter.isVerified ? 'Verified' : 'Unverified'}
              </Badge>
              {voter.verifiedByAdmin && (
                <span className="text-sm text-gray-600">
                  by {voter.verifiedByAdmin.fullName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit(voter)}
                className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Edit
              </button>
              <VerifyButton
                isVerified={voter.isVerified}
                onVerify={handleVerify}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Full Name
                  </label>
                  <p className="text-gray-900">{voter.fullName}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Sex
                    </label>
                    <p className="text-gray-900">{voter.sex}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Age
                    </label>
                    <p className="text-gray-900">{voter.age} years</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Date of Birth
                  </label>
                  <p className="text-gray-900 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(voter.dateOfBirth)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Aadhar Number
                  </label>
                  <p className="text-gray-900 font-mono">
                    {voter.aadharNumber}
                  </p>
                </div>
                {voter.guardianSpouse && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Guardian/Spouse
                    </label>
                    <p className="text-gray-900">{voter.guardianSpouse}</p>
                  </div>
                )}
                {voter.qualification && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Qualification
                    </label>
                    <p className="text-gray-900">{voter.qualification}</p>
                  </div>
                )}
                {voter.occupation && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Occupation
                    </label>
                    <p className="text-gray-900">{voter.occupation}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contact Information
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Contact Number
                  </label>
                  <p className="text-gray-900 flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {voter.contact}
                  </p>
                </div>
                {voter.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Email
                    </label>
                    <p className="text-gray-900 flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {voter.email}
                    </p>
                  </div>
                )}
              </div>

              {/* Address Information */}
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mt-6">
                <MapPin className="h-5 w-5" />
                Address
              </h3>
              <div className="space-y-2">
                <p className="text-gray-900">
                  {voter.houseNumber}, {voter.street}
                </p>
                <p className="text-gray-900">{voter.area}</p>
                <p className="text-gray-900">
                  {voter.city}, {voter.state} - {voter.pincode}
                </p>
              </div>
            </div>
          </div>

          {/* Elector Information */}
          {voter.isRegisteredElector && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5" />
                Elector Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {voter.assemblyNumber && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Assembly Number
                    </label>
                    <p className="text-gray-900">{voter.assemblyNumber}</p>
                  </div>
                )}
                {voter.assemblyName && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Assembly Name
                    </label>
                    <p className="text-gray-900">{voter.assemblyName}</p>
                  </div>
                )}
                {voter.pollingStationNumber && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Polling Station
                    </label>
                    <p className="text-gray-900">
                      {voter.pollingStationNumber}
                    </p>
                  </div>
                )}
                {voter.epicNumber && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      EPIC Number
                    </label>
                    <p className="text-gray-900 font-mono">
                      {voter.epicNumber}
                    </p>
                  </div>
                )}
                {voter.disabilities && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Disabilities
                    </label>
                    <p className="text-gray-900">
                      {(() => {
                        try {
                          const disabilityList = JSON.parse(voter.disabilities);
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
                          return voter.disabilities;
                        }
                      })()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Education Information */}
          {(voter.university ||
            voter.graduationYear ||
            voter.graduationDocType) && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Education
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {voter.university && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      University
                    </label>
                    <p className="text-gray-900">{voter.university}</p>
                  </div>
                )}
                {voter.graduationYear && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Graduation Year
                    </label>
                    <p className="text-gray-900">{voter.graduationYear}</p>
                  </div>
                )}
                {voter.graduationDocType && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Document Type
                    </label>
                    <p className="text-gray-900">{voter.graduationDocType}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* References */}
          {voter.references && voter.references.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Users className="h-5 w-5" />
                References ({voter.references.length})
              </h3>
              <div className="space-y-3">
                {voter.references.map(reference => (
                  <div
                    key={reference.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {reference.referenceName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {reference.referenceContact}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          reference.status === 'APPLIED'
                            ? 'success'
                            : reference.status === 'CONTACTED'
                              ? 'info'
                              : 'warning'
                        }
                        size="sm"
                      >
                        {reference.status}
                      </Badge>
                      {reference.whatsappSent && (
                        <Badge variant="info" size="sm">
                          WhatsApp Sent
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="border-t pt-6 text-sm text-gray-500">
            <div className="flex justify-between">
              <span>Created: {formatDate(voter.createdAt)}</span>
              <span>Updated: {formatDate(voter.updatedAt)}</span>
            </div>
            {voter.verifiedAt && (
              <div className="mt-1">
                <span>Verified: {formatDate(voter.verifiedAt)}</span>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  );
};
