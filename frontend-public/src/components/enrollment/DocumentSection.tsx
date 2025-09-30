import React from 'react';
import { DocumentUpload } from '../documents/DocumentUpload';
import { DOCUMENT_TYPES } from '../../lib/documentUtils';

interface DocumentSectionProps {
  userId: string;
  onDocumentUpload?: (documentType: string, documentData: any) => void;
  existingDocuments?: Record<string, any>;
}

export const DocumentSection: React.FC<DocumentSectionProps> = ({
  userId,
  onDocumentUpload,
  existingDocuments = {},
}) => {
  const handleUploadSuccess = (documentType: string) => (documentData: any) => {
    onDocumentUpload?.(documentType, documentData);
  };

  const handleUploadError = (error: string) => {
    console.error('Document upload error:', error);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Upload Documents
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Please upload the required documents. All documents must be clear and
          readable.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Aadhar Card */}
        <DocumentUpload
          documentType={DOCUMENT_TYPES.AADHAR}
          userId={userId}
          existingDocument={existingDocuments[DOCUMENT_TYPES.AADHAR]}
          onUploadSuccess={handleUploadSuccess(DOCUMENT_TYPES.AADHAR)}
          onUploadError={handleUploadError}
        />

        {/* Personal Photo */}
        <DocumentUpload
          documentType={DOCUMENT_TYPES.PHOTO}
          userId={userId}
          existingDocument={existingDocuments[DOCUMENT_TYPES.PHOTO]}
          onUploadSuccess={handleUploadSuccess(DOCUMENT_TYPES.PHOTO)}
          onUploadError={handleUploadError}
        />

        {/* Degree Certificate */}
        <DocumentUpload
          documentType={DOCUMENT_TYPES.DEGREE}
          userId={userId}
          existingDocument={existingDocuments[DOCUMENT_TYPES.DEGREE]}
          onUploadSuccess={handleUploadSuccess(DOCUMENT_TYPES.DEGREE)}
          onUploadError={handleUploadError}
        />
      </div>
    </div>
  );
};
