import React, { useState, useEffect } from 'react';
import { X, Download, Printer, Edit3, FileText, Image } from 'lucide-react';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
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

interface DocumentPreviewModalProps {
  document: Document;
  onClose: () => void;
  onUpdate: () => void;
  onDownload: () => void;
  onPrint: () => void;
  userId: string;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  document,
  onClose,
  onUpdate,
  onDownload,
  onPrint,
  userId,
}) => {
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDocumentPreview();
    return () => {
      if (documentUrl) {
        URL.revokeObjectURL(documentUrl);
      }
    };
  }, [document.id]);

  const loadDocumentPreview = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiEndpoints.getDocument(
        userId,
        document.documentType
      );
      const blob = new Blob([response.data], { type: document.mimeType });
      const url = URL.createObjectURL(blob);
      setDocumentUrl(url);
    } catch (error) {
      console.error('Failed to load document preview:', error);
      setError('Failed to load document preview');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = () => {
    const input = window.document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf';
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Check file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
          alert('File size must be less than 2MB');
          return;
        }

        try {
          setIsUpdating(true);
          await apiEndpoints.uploadDocument(
            userId,
            document.documentType,
            file
          );
          alert('Document updated successfully!');
          onUpdate();
        } catch (error: any) {
          console.error('Update failed:', error);
          alert(
            error.response?.data?.error?.message ||
              'Failed to update document. Please try again.'
          );
        } finally {
          setIsUpdating(false);
        }
      }
    };
    input.click();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'REJECTED':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const isImage = document.mimeType.startsWith('image/');
  const isPDF = document.mimeType === 'application/pdf';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-50 rounded-lg mr-3">
              {isImage ? (
                <Image className="h-6 w-6 text-blue-600" />
              ) : (
                <FileText className="h-6 w-6 text-blue-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {document.fileName}
              </h2>
              <div className="flex items-center space-x-4 mt-1">
                <span className="text-sm text-gray-600">
                  {formatFileSize(document.fileSize)}
                </span>
                <span className="text-sm text-gray-600">
                  Uploaded{' '}
                  {new Date(document.uploadedAt).toLocaleDateString('en-IN')}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(document.status)}`}
                >
                  {document.status}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={onDownload}
              variant="outline"
              size="sm"
              className="flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              onClick={onPrint}
              variant="outline"
              size="sm"
              className="flex items-center"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button
              onClick={handleUpdate}
              loading={isUpdating}
              variant="outline"
              size="sm"
              className="flex items-center"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Update
            </Button>
            <Button onClick={onClose} variant="ghost" className="p-2">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Status Message */}
        {document.status === 'REJECTED' && document.rejectionReason && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="text-sm font-medium text-red-900 mb-1">
              Document Rejected
            </h4>
            <p className="text-sm text-red-800">{document.rejectionReason}</p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" text="Loading document..." />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">{error}</p>
                <Button
                  onClick={loadDocumentPreview}
                  variant="outline"
                  className="mt-4"
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : documentUrl ? (
            <div className="flex justify-center">
              {isImage ? (
                <img
                  src={documentUrl}
                  alt={document.fileName}
                  className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg"
                />
              ) : isPDF ? (
                <iframe
                  src={documentUrl}
                  className="w-full h-[60vh] border border-gray-300 rounded-lg"
                  title={document.fileName}
                />
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    Preview not available for this file type
                  </p>
                  <Button onClick={onDownload} className="flex items-center">
                    <Download className="h-4 w-4 mr-2" />
                    Download to View
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <p>Document Type: {document.documentType.replace('_', ' ')}</p>
              <p>MIME Type: {document.mimeType}</p>
            </div>
            <div className="flex space-x-3">
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
