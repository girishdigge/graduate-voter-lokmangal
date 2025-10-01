import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Modal } from '../ui/Modal';
import { apiEndpoints } from '../../lib/api';
import {
  FileText,
  Download,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  Image,
  FileImage,
} from 'lucide-react';

interface Document {
  id: string;
  documentType: 'AADHAR' | 'DEGREE_CERTIFICATE' | 'PHOTO';
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  isActive: boolean;
  downloadUrl?: string;
}

interface DocumentsListProps {
  userId: string;
  className?: string;
}

export const DocumentsList: React.FC<DocumentsListProps> = ({
  userId,
  className,
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, [userId]);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load documents for each type
      const documentTypes = ['AADHAR', 'DEGREE_CERTIFICATE', 'PHOTO'];
      const documentPromises = documentTypes.map(async type => {
        try {
          const response = await apiEndpoints.getDocument(userId, type);
          return response.data.document;
        } catch (error: any) {
          // If document doesn't exist, return null
          if (error.response?.status === 404) {
            return null;
          }
          throw error;
        }
      });

      const results = await Promise.all(documentPromises);
      const validDocuments = results.filter(doc => doc !== null);
      setDocuments(validDocuments);
    } catch (error: any) {
      console.error('Failed to load documents:', error);
      setError(
        error.response?.data?.error?.message ||
          'Failed to load documents. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      setDownloadingId(document.id);
      setError(null);

      // Get secure download URL
      const response = await apiEndpoints.getDocument(
        userId,
        document.documentType
      );
      const downloadUrl = response.data.document.downloadUrl;

      if (downloadUrl) {
        // Create a temporary link and trigger download
        const link = window.document.createElement('a');
        link.href = downloadUrl;
        link.download = document.fileName;
        link.target = '_blank';
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
      } else {
        throw new Error('Download URL not available');
      }
    } catch (error: any) {
      console.error('Failed to download document:', error);
      setError(
        error.response?.data?.error?.message ||
          'Failed to download document. Please try again.'
      );
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePreview = async (document: Document) => {
    try {
      setIsLoadingPreview(true);
      setPreviewDocument(document);
      setError(null);

      // Get secure preview URL
      const response = await apiEndpoints.getDocument(
        userId,
        document.documentType
      );
      const previewUrl = response.data.document.downloadUrl;
      setPreviewUrl(previewUrl);
    } catch (error: any) {
      console.error('Failed to load preview:', error);
      setError(
        error.response?.data?.error?.message ||
          'Failed to load document preview. Please try again.'
      );
      setPreviewDocument(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const closePreview = () => {
    setPreviewDocument(null);
    setPreviewUrl(null);
  };

  const getDocumentIcon = (documentType: string, mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <FileImage className="h-8 w-8 text-blue-600" />;
    }

    switch (documentType) {
      case 'PHOTO':
        return <Image className="h-8 w-8 text-green-600" />;
      case 'AADHAR':
        return <FileText className="h-8 w-8 text-orange-600" />;
      case 'DEGREE_CERTIFICATE':
        return <FileText className="h-8 w-8 text-purple-600" />;
      default:
        return <FileText className="h-8 w-8 text-gray-600" />;
    }
  };

  const getDocumentTypeLabel = (documentType: string) => {
    switch (documentType) {
      case 'AADHAR':
        return 'Aadhar Card';
      case 'DEGREE_CERTIFICATE':
        return 'Degree Certificate';
      case 'PHOTO':
        return 'Personal Photo';
      default:
        return documentType;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getRequiredDocuments = () => {
    return [
      { type: 'AADHAR', label: 'Aadhar Card', required: true },
      { type: 'PHOTO', label: 'Personal Photo', required: true },
      {
        type: 'DEGREE_CERTIFICATE',
        label: 'Degree Certificate',
        required: true,
      },
    ];
  };

  const getDocumentStatus = (documentType: string) => {
    const document = documents.find(doc => doc.documentType === documentType);
    if (document) {
      return { status: 'uploaded', document };
    }
    return { status: 'missing', document: null };
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="flex items-center mb-6">
          <FileText className="h-5 w-5 text-blue-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
        </div>
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" text="Loading documents..." />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center mb-6">
        <FileText className="h-5 w-5 text-blue-600 mr-2" />
        <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setError(null)}
            className="mt-2"
          >
            Dismiss
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {getRequiredDocuments().map(({ type, label, required }) => {
          const { status, document } = getDocumentStatus(type);

          return (
            <div
              key={type}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {document ? (
                    getDocumentIcon(document.documentType, document.mimeType)
                  ) : (
                    <FileText className="h-8 w-8 text-gray-400" />
                  )}

                  <div>
                    <h3 className="font-medium text-gray-900">{label}</h3>
                    {document ? (
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>{document.fileName}</p>
                        <div className="flex items-center space-x-4">
                          <span>{formatFileSize(document.fileSize)}</span>
                          <span>
                            Uploaded:{' '}
                            {new Date(document.uploadedAt).toLocaleDateString(
                              'en-IN'
                            )}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        {required
                          ? 'Required document not uploaded'
                          : 'Optional document'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Status Indicator */}
                  <div className="flex items-center">
                    {status === 'uploaded' ? (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-5 w-5 mr-1" />
                        <span className="text-sm font-medium">Uploaded</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-yellow-600">
                        <Clock className="h-5 w-5 mr-1" />
                        <span className="text-sm font-medium">Missing</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {document && (
                    <div className="flex items-center space-x-2 ml-4">
                      {/* Preview Button - only for images */}
                      {document.mimeType.startsWith('image/') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreview(document)}
                          disabled={isLoadingPreview}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}

                      {/* Download Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(document)}
                        loading={downloadingId === document.id}
                        disabled={downloadingId !== null}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Missing Document Warning */}
              {status === 'missing' && required && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-center text-yellow-800">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <span className="text-sm">
                      This document is required for verification. Please upload
                      it during enrollment.
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">
              Document Status: {documents.length} of{' '}
              {getRequiredDocuments().length} uploaded
            </p>
            <p className="text-xs text-gray-600 mt-1">
              All required documents must be uploaded for verification
            </p>
          </div>

          {documents.length < getRequiredDocuments().length && (
            <div className="flex items-center text-yellow-600">
              <AlertCircle className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">Incomplete</span>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={previewDocument !== null}
        onClose={closePreview}
        title={
          previewDocument
            ? getDocumentTypeLabel(previewDocument.documentType)
            : ''
        }
        size="lg"
      >
        {isLoadingPreview ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" text="Loading preview..." />
          </div>
        ) : previewUrl && previewDocument ? (
          <div className="space-y-4">
            <div className="text-center">
              <img
                src={previewUrl}
                alt={previewDocument.fileName}
                className="max-w-full max-h-96 mx-auto rounded-lg shadow-sm"
                onError={() => {
                  setError('Failed to load image preview');
                  closePreview();
                }}
              />
            </div>

            <div className="flex justify-center space-x-3">
              <Button
                variant="outline"
                onClick={() => handleDownload(previewDocument)}
                loading={downloadingId === previewDocument.id}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Failed to load document preview</p>
          </div>
        )}
      </Modal>
    </div>
  );
};
