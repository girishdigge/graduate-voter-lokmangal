import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import {
  Users,
  Phone,
  MessageCircle,
  Clock,
  CheckCircle,
  Trash2,
  Plus,
  AlertCircle,
} from 'lucide-react';

export interface Reference {
  id: string;
  name: string;
  contact: string;
  status: 'pending' | 'contacted' | 'applied';
  whatsappSent: boolean;
  whatsappSentAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface ReferenceListProps {
  references: Reference[];
  onAddReference: () => void;
  onDeleteReference: (referenceId: string) => void;
  onResendWhatsApp: (referenceId: string) => void;
  isLoading?: boolean;
  className?: string;
}

export const ReferenceList: React.FC<ReferenceListProps> = ({
  references,
  onAddReference,
  onDeleteReference,
  onResendWhatsApp,
  isLoading = false,
  className,
}) => {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const getStatusIcon = (status: Reference['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'contacted':
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'applied':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: Reference['status']) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'contacted':
        return 'Contacted';
      case 'applied':
        return 'Applied';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: Reference['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'contacted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'applied':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleDelete = async (referenceId: string) => {
    try {
      await onDeleteReference(referenceId);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete reference:', error);
    }
  };

  const handleResendWhatsApp = async (referenceId: string) => {
    setResendingId(referenceId);
    try {
      await onResendWhatsApp(referenceId);
    } catch (error) {
      console.error('Failed to resend WhatsApp:', error);
    } finally {
      setResendingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">References</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg h-20"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">References</h3>
          <p className="text-sm text-gray-600">
            People who can vouch for your application
          </p>
        </div>
        <Button
          onClick={onAddReference}
          variant="outline"
          size="sm"
          className="flex items-center"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Reference
        </Button>
      </div>

      {references.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            No References Added
          </h4>
          <p className="text-gray-600 mb-4">
            Add people who can vouch for your voter registration application.
          </p>
          <Button onClick={onAddReference} variant="primary">
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Reference
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {references.map(reference => (
            <div
              key={reference.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium text-gray-900">
                      {reference.name}
                    </h4>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        reference.status
                      )}`}
                    >
                      {getStatusIcon(reference.status)}
                      <span className="ml-1">
                        {getStatusText(reference.status)}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <Phone className="h-4 w-4 mr-1" />
                    <span className="font-mono">{reference.contact}</span>
                  </div>

                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>Added: {formatDate(reference.createdAt)}</span>
                    {reference.whatsappSent && reference.whatsappSentAt && (
                      <span className="flex items-center">
                        <MessageCircle className="h-3 w-3 mr-1 text-green-500" />
                        WhatsApp sent: {formatDate(reference.whatsappSentAt)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {/* Resend WhatsApp Button */}
                  {reference.whatsappSent && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResendWhatsApp(reference.id)}
                      loading={resendingId === reference.id}
                      disabled={resendingId !== null}
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  )}

                  {/* Delete Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConfirm(reference.id)}
                    className="text-red-600 hover:text-red-700 hover:border-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* WhatsApp Status */}
              {!reference.whatsappSent && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                  <div className="flex items-center text-yellow-800">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    WhatsApp notification pending
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Reference"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this reference? This action cannot
            be undone.
          </p>

          {deleteConfirm && (
            <div className="bg-gray-50 rounded-md p-3">
              <div className="font-medium text-gray-900">
                {references.find(r => r.id === deleteConfirm)?.name}
              </div>
              <div className="text-sm text-gray-600 font-mono">
                {references.find(r => r.id === deleteConfirm)?.contact}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Delete Reference
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
