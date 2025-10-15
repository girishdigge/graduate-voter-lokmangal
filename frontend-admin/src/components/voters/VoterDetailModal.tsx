import React, { useState, useEffect } from 'react';
import {
  MapPin,
  User,
  Phone,
  Mail,
  FileText,
  Users,
  GraduationCap,
  Vote,
  Shield,
  Edit,
  Download,
} from 'lucide-react';
import { Modal, Badge, LoadingSpinner, Button } from '../ui';
import { VerifyButton } from './VerifyButton';
import { voterApi } from '../../lib/voterApi';
import type { Voter, VoterDocument } from '../../types/voter';

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
  // All hooks must be at the top, before any conditional logic
  const [documents, setDocuments] = useState<VoterDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);

  // Temporarily disable automatic document fetching to prevent logout issue
  // TODO: Fix authentication issue with document API
  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setDocuments([]);
      setDocumentsLoading(false);
    }
  }, [isOpen]);

  const handleVerify = async (isVerified: boolean) => {
    if (voter) {
      await onVerify(voter.id, isVerified);
    }
  };

  const handleDownloadDocument = (downloadUrl: string, fileName: string) => {
    if (!downloadUrl) {
      alert('Download URL not available for this document.');
      return;
    }

    // Create download link using the signed URL
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    link.target = '_blank'; // Open in new tab as fallback
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not provided';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatDisabilities = (disabilities: string | null) => {
    if (!disabilities) return 'None';
    try {
      const disabilityList = JSON.parse(disabilities);
      const disabilityLabels = {
        VISUAL_IMPAIRMENT: 'Visual Impairment',
        SPEECH_AND_HEARING_DISABILITY: 'Speech and Hearing Disability',
        LOCOMOTOR_DISABILITY: 'Locomotor Disability',
        OTHER: 'Other',
      };
      return disabilityList
        .map(
          (d: string) =>
            disabilityLabels[d as keyof typeof disabilityLabels] || d
        )
        .join(', ');
    } catch {
      return disabilities;
    }
  };

  const formatDocumentType = (documentType: string) => {
    const typeLabels = {
      AADHAR: 'Aadhar Card',
      DEGREE_CERTIFICATE: 'Degree Certificate',
      PHOTO: 'Photo',
    };
    return (
      typeLabels[documentType as keyof typeof typeLabels] ||
      documentType.replace('_', ' ')
    );
  };

  // Conditional logic after all hooks
  console.log('VoterDetailModal received voter data:', voter);
  console.log('VoterDetailModal isLoading:', isLoading);

  // Don't render if modal is not open
  if (!isOpen) return null;

  // Don't render if no voter data and not loading
  if (!voter && !isLoading) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Profile Details" size="xl">
      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      ) : voter && voter.id ? (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {voter.fullName || 'Loading...'}
              </h2>
              <p className="text-sm text-gray-600">
                Complete profile information
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => onEdit(voter)}
                variant="secondary"
                size="sm"
                className="flex items-center gap-1"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <VerifyButton
                isVerified={voter.isVerified}
                onVerify={handleVerify}
              />
            </div>
          </div>

          <div className="space-y-8">
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
                  <p className="text-gray-900">{voter.fullName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sex
                  </label>
                  <p className="text-gray-900">{voter.sex}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Guardian/Spouse
                  </label>
                  <p className="text-gray-900">
                    {voter.guardianSpouse || 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <p className="text-gray-900">
                    {voter.dateOfBirth
                      ? `${formatDate(voter.dateOfBirth)} (Age: ${voter.age})`
                      : 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Occupation
                  </label>
                  <p className="text-gray-900">
                    {voter.occupation || 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Qualification
                  </label>
                  <p className="text-gray-900">
                    {voter.qualification || 'Not provided'}
                  </p>
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
                  <p className="text-gray-900 flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {voter.contact}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <p className="text-gray-900 flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {voter.email || 'Not provided'}
                  </p>
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
                  <p className="text-gray-900">{voter.houseNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street
                  </label>
                  <p className="text-gray-900">{voter.street}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Area
                  </label>
                  <p className="text-gray-900">{voter.area}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <p className="text-gray-900">{voter.city}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <p className="text-gray-900">{voter.state}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pincode
                  </label>
                  <p className="text-gray-900">{voter.pincode}</p>
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
                  <p className="text-gray-900">
                    {voter.isRegisteredElector ? 'Yes' : 'No'}
                  </p>
                </div>
                {voter.assemblyNumber && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assembly Number
                    </label>
                    <p className="text-gray-900">{voter.assemblyNumber}</p>
                  </div>
                )}
                {voter.assemblyName && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assembly Name
                    </label>
                    <p className="text-gray-900">{voter.assemblyName}</p>
                  </div>
                )}
                {voter.pollingStationNumber && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Polling Station
                    </label>
                    <p className="text-gray-900">
                      {voter.pollingStationNumber}
                    </p>
                  </div>
                )}
                {voter.epicNumber && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      EPIC Number
                    </label>
                    <p className="text-gray-900 font-mono">
                      {voter.epicNumber}
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Disabilities (if any)
                  </label>
                  <p className="text-gray-900">
                    {formatDisabilities(voter.disabilities)}
                  </p>
                </div>
              </div>
            </div>

            {/* Education Information */}
            {(voter.university ||
              voter.graduationYear ||
              voter.graduationDocType) && (
              <div>
                <div className="flex items-center mb-4">
                  <GraduationCap className="h-5 w-5 text-gray-400 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Education Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      University
                    </label>
                    <p className="text-gray-900">
                      {voter.university || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Graduation Year
                    </label>
                    <p className="text-gray-900">
                      {voter.graduationYear || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Document Type
                    </label>
                    <p className="text-gray-900">
                      {voter.graduationDocType || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>
            )}

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
                  <p className="text-gray-900 font-mono">
                    {voter.aadharNumber}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Registration Date
                  </label>
                  <p className="text-gray-900">{formatDate(voter.createdAt)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Verification Status
                  </label>
                  <Badge
                    variant={voter.isVerified ? 'success' : 'warning'}
                    size="sm"
                  >
                    {voter.isVerified ? 'Verified' : 'Pending Verification'}
                  </Badge>
                </div>
                {voter.verifiedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Verified Date
                    </label>
                    <p className="text-gray-900">
                      {formatDate(voter.verifiedAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* References */}
            {voter.references && voter.references.length > 0 && (
              <div>
                <div className="flex items-center mb-4">
                  <Users className="h-5 w-5 text-gray-400 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    References ({voter.references.length})
                  </h3>
                </div>
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

            {/* Documents */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-gray-400 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Uploaded Documents
                  </h3>
                </div>
                <Button
                  onClick={async () => {
                    if (!voter?.id) return;
                    setDocumentsLoading(true);
                    try {
                      const response = await voterApi.getUserDocuments(
                        voter.id
                      );
                      setDocuments(response.data.documents || []);
                    } catch (error) {
                      console.error('Error fetching documents:', error);
                      alert(
                        'Failed to load documents. Please check your permissions.'
                      );
                      setDocuments([]);
                    } finally {
                      setDocumentsLoading(false);
                    }
                  }}
                  variant="secondary"
                  size="sm"
                  disabled={documentsLoading}
                  className="flex items-center gap-1"
                >
                  {documentsLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  Load Documents
                </Button>
              </div>
              {documentsLoading ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner size="sm" />
                </div>
              ) : documents.length > 0 ? (
                <div className="space-y-3">
                  {documents.map(document => (
                    <div
                      key={document.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <FileText className="h-8 w-8 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {formatDocumentType(document.documentType)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {document.fileName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(document.fileSize / 1024).toFixed(1)} KB •
                            Uploaded{' '}
                            {new Date(document.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="info" size="sm">
                          {document.mimeType.split('/')[1].toUpperCase()}
                        </Badge>
                        <Button
                          onClick={() =>
                            handleDownloadDocument(
                              document.downloadUrl || '',
                              document.fileName
                            )
                          }
                          variant="secondary"
                          size="sm"
                          disabled={!document.downloadUrl}
                          className="flex items-center gap-1"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p>Click "Load Documents" to view uploaded documents</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center py-8">
          <div className="text-center">
            <p className="text-gray-500">No voter data available</p>
          </div>
        </div>
      )}
    </Modal>
  );
};
