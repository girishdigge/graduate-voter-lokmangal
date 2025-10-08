import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Phone,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { AddReferenceModal } from '../dashboard';
import { apiEndpoints } from '../../lib/api';

interface Reference {
  id: string;
  referenceName: string;
  referenceContact: string;
  status: 'PENDING' | 'CONTACTED' | 'APPLIED';
  whatsappSent: boolean;
  whatsappSentAt?: string;
  statusUpdatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface ReferencesCardProps {
  userId: string;
}

export const ReferencesCard: React.FC<ReferencesCardProps> = ({ userId }) => {
  const [references, setReferences] = useState<Reference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReferences();
  }, [userId]);

  const loadReferences = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiEndpoints.getReferences(userId);
      if (response.data.success) {
        setReferences(response.data.references || []);
      }
    } catch (error: any) {
      console.error('Failed to load references:', error);
      setError(
        error.response?.data?.error?.message ||
          'Failed to load references. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddReferences = async (
    newReferences: Array<{ name: string; contact: string }>
  ) => {
    try {
      const formattedReferences = newReferences.map(ref => ({
        referenceName: ref.name,
        referenceContact: ref.contact,
      }));

      const response = await apiEndpoints.addReferences(
        userId,
        formattedReferences
      );

      if (response.data.success) {
        await loadReferences(); // Reload references
        setIsAddModalOpen(false);
        alert('References added successfully!');
      }
    } catch (error: any) {
      console.error('Failed to add references:', error);
      throw new Error(
        error.response?.data?.error?.message ||
          'Failed to add references. Please try again.'
      );
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'CONTACTED':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          label: 'Contacted',
        };
      case 'APPLIED':
        return {
          icon: CheckCircle,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          label: 'Applied',
        };
      default:
        return {
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          label: 'Pending',
        };
    }
  };

  const formatPhoneNumber = (phone: string) => {
    // Format phone number for display (e.g., +91 98765 43210)
    if (phone.length === 10) {
      return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
    }
    return phone;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" text="Loading references..." />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-50 rounded-lg mr-3">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                References
              </h3>
              <p className="text-sm text-gray-600">
                People who can vouch for your application
              </p>
            </div>
          </div>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Reference
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {references.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              No References Added
            </h4>
            <p className="text-gray-600 mb-6">
              Add references who can vouch for your voter registration
              application. They will receive a WhatsApp notification.
            </p>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Reference
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {references.map(reference => {
              const statusInfo = getStatusInfo(reference.status);
              const StatusIcon = statusInfo.icon;

              return (
                <div
                  key={reference.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <div
                        className={`p-2 ${statusInfo.bgColor} rounded-lg mr-3`}
                      >
                        <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900">
                            {reference.referenceName}
                          </h4>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}
                          >
                            {statusInfo.label}
                          </span>
                        </div>
                        <div className="flex items-center mt-1 text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-1" />
                          <span>
                            {formatPhoneNumber(reference.referenceContact)}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                          <span>
                            Added{' '}
                            {new Date(reference.createdAt).toLocaleDateString(
                              'en-IN'
                            )}
                          </span>
                          {reference.whatsappSent &&
                            reference.whatsappSentAt && (
                              <span>
                                WhatsApp sent{' '}
                                {new Date(
                                  reference.whatsappSentAt
                                ).toLocaleDateString('en-IN')}
                              </span>
                            )}
                          {reference.statusUpdatedAt && (
                            <span>
                              Status updated{' '}
                              {new Date(
                                reference.statusUpdatedAt
                              ).toLocaleDateString('en-IN')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Status */}
                  <div className="mt-3 flex items-center">
                    {reference.whatsappSent ? (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        <span className="text-xs">
                          WhatsApp notification sent
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center text-yellow-600">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        <span className="text-xs">
                          WhatsApp notification pending
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Reference Guidelines */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            Reference Guidelines
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              • Add people who know you personally and can vouch for your
              identity
            </li>
            <li>
              • References will receive WhatsApp notifications about your
              application
            </li>
            <li>
              • Provide accurate contact numbers for successful verification
            </li>
            <li>• You can add up to 10 references for your application</li>
          </ul>
        </div>

        {/* Summary Stats */}
        {references.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {references.length}
                </p>
                <p className="text-xs text-gray-500">Total References</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {references.filter(r => r.whatsappSent).length}
                </p>
                <p className="text-xs text-gray-500">WhatsApp Sent</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {references.filter(r => r.status === 'CONTACTED').length}
                </p>
                <p className="text-xs text-gray-500">Contacted</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Reference Modal */}
      <AddReferenceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddReferences}
        maxReferences={10 - references.length}
      />
    </>
  );
};
