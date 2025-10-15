import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Eye,
  Download,
  Printer,
  Edit3,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { DocumentPreviewModal } from '../dashboard';
import { apiEndpoints } from '../../lib/api';

interface Document {
  id: string;
  documentType: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
}

interface DocumentsCardProps {
  userId: string;
}

const DOCUMENT_TYPES = [
  {
    type: 'AADHAR',
    label: 'Aadhar Card',
    description: 'Government issued Aadhar card',
    required: true,
  },
  {
    type: 'PHOTO',
    label: 'Passport Photo',
    description: 'Recent passport size photograph',
    required: true,
  },
  {
    type: 'DEGREE_CERTIFICATE',
    label: 'Degree Certificate',
    description: 'Graduation degree certificate',
    required: true,
  },
];

export const DocumentsCard: React.FC<DocumentsCardProps> = ({ userId }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize CSRF token
    apiEndpoints.initializeCSRF().catch(console.error);
    loadDocuments();
  }, [userId]);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiEndpoints.getAllUserDocuments(userId);
      if (response.data.success) {
        setDocuments(response.data.data.documents || []);
      }
    } catch (error: any) {
      console.error('Failed to load documents:', error);
      let errorMessage = 'Failed to load documents. Please try again.';
      if (error.response?.status === 404) {
        errorMessage = 'No documents found for this user.';
        setDocuments([]);
      } else if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      }
      setError(errorMessage);
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (documentType: string, file: File) => {
    try {
      console.log('documentType:', documentType, 'file:', file);

      setUploadingType(documentType);
      setError(null);

      const response = await apiEndpoints.uploadDocument(
        userId,
        documentType,
        file
      );

      if (response.data.success) {
        await loadDocuments(); // Reload documents
        alert('Document uploaded successfully!');
      }
    } catch (error: any) {
      console.error('Upload failed:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      setError(
        error.response?.data?.error?.message ||
          'Failed to upload document. Please try again.'
      );
    } finally {
      setUploadingType(null);
    }
  };

  const handleFileSelect = (documentType: string) => {
    const input = window.document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf';
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Check file size (max 5MB)
        if (file.size > 2 * 1024 * 1024) {
          alert('File size must be less than 2MB');
          return;
        }
        handleFileUpload(documentType, file);
      }
    };
    input.click();
  };

  const getDocumentStatus = (documentType: string) => {
    const doc = documents.find(d => d.documentType === documentType);
    if (!doc)
      return { status: 'missing', icon: Upload, color: 'text-gray-400' };

    switch (doc.status) {
      case 'APPROVED':
        return {
          status: 'approved',
          icon: CheckCircle,
          color: 'text-green-600',
        };
      case 'REJECTED':
        return { status: 'rejected', icon: AlertCircle, color: 'text-red-600' };
      default:
        return { status: 'pending', icon: Clock, color: 'text-yellow-600' };
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = async (document: Document) => {
    try {
      // Get the signed URL from the API
      const response = await apiEndpoints.getDocument(
        userId,
        document.documentType
      );

      // The API returns { success: true, data: { document: { downloadUrl: "..." } } }
      const downloadUrl = response.data.data?.document?.downloadUrl;

      if (!downloadUrl) {
        throw new Error('Download URL not found in response');
      }

      // Use the signed URL directly for download (avoids CORS issues)
      const a = window.document.createElement('a');
      a.href = downloadUrl;
      a.download = document.fileName;
      a.target = '_blank'; // Open in new tab as fallback
      a.click();
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download document. Please try again.');
    }
  };

  const handlePrint = async (document: Document) => {
    try {
      // Get the signed URL from the API
      const response = await apiEndpoints.getDocument(
        userId,
        document.documentType
      );

      // The API returns { success: true, data: { document: { downloadUrl: "..." } } }
      const downloadUrl = response.data.data?.document?.downloadUrl;

      if (!downloadUrl) {
        throw new Error('Download URL not found in response');
      }

      // Open the signed URL in a new window for printing
      const printWindow = window.open(downloadUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      } else {
        alert('Please allow pop-ups to print documents');
      }
    } catch (error) {
      console.error('Print failed:', error);
      alert('Failed to print document. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" text="Loading documents..." />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-6">
          <div className="p-2 bg-green-50 rounded-lg mr-3">
            <FileText className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
            <p className="text-sm text-gray-600">
              Upload and manage your documents
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {DOCUMENT_TYPES.map(docType => {
            const document = documents.find(
              d => d.documentType === docType.type
            );
            const statusInfo = getDocumentStatus(docType.type);
            const StatusIcon = statusInfo.icon;
            const isUploading = uploadingType === docType.type;

            return (
              <div
                key={docType.type}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <div className="p-2 bg-gray-50 rounded-lg mr-3">
                      <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h4 className="text-sm font-medium text-gray-900">
                          {docType.label}
                        </h4>
                        {docType.required && (
                          <span className="ml-2 text-xs text-red-500">
                            *Required
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {docType.description}
                      </p>
                      {document && (
                        <div className="mt-1 flex items-center text-xs text-gray-500">
                          <span>{document.fileName}</span>
                          <span className="mx-2">•</span>
                          <span>{formatFileSize(document.fileSize)}</span>
                          <span className="mx-2">•</span>
                          <span>
                            Uploaded{' '}
                            {new Date(document.uploadedAt).toLocaleDateString(
                              'en-IN'
                            )}
                          </span>
                        </div>
                      )}
                      {document?.status === 'REJECTED' &&
                        document.rejectionReason && (
                          <p className="mt-1 text-xs text-red-600">
                            Rejected: {document.rejectionReason}
                          </p>
                        )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {document ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewDocument(document)}
                          className="p-2"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(document)}
                          className="p-2"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePrint(document)}
                          className="p-2"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFileSelect(docType.type)}
                          disabled={isUploading}
                          className="flex items-center"
                        >
                          <Edit3 className="h-4 w-4 mr-1" />
                          Update
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => handleFileSelect(docType.type)}
                        disabled={isUploading}
                        loading={isUploading}
                        size="sm"
                        className="flex items-center"
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Upload
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Upload Instructions */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            Upload Guidelines
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Supported formats: JPG, PNG, PDF</li>
            <li>• Maximum file size: 2MB per document</li>
            <li>• Ensure documents are clear and readable</li>
            <li>• Required documents must be uploaded for verification</li>
          </ul>
        </div>
      </div>

      {/* Document Preview Modal */}
      {previewDocument && (
        <DocumentPreviewModal
          document={previewDocument}
          onClose={() => setPreviewDocument(null)}
          onUpdate={() => {
            loadDocuments();
            setPreviewDocument(null);
          }}
          onDownload={() => handleDownload(previewDocument)}
          onPrint={() => handlePrint(previewDocument)}
          userId={userId}
        />
      )}
    </>
  );
};
