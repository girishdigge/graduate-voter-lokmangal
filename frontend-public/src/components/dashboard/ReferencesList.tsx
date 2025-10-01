import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { apiEndpoints } from '../../lib/api';
import {
  Users,
  Phone,
  MessageCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  UserCheck,
  Calendar,
} from 'lucide-react';

interface Reference {
  id: string;
  name: string;
  contact: string;
  status: 'pending' | 'contacted' | 'applied';
  whatsappSent: boolean;
  whatsappSentAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface ReferencesListProps {
  userId: string;
  className?: string;
}

export const ReferencesList: React.FC<ReferencesListProps> = ({
  userId,
  className,
}) => {
  const [references, setReferences] = useState<Reference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReferences();
  }, [userId]);

  const loadReferences = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiEndpoints.getReferences(userId);
      setReferences(response.data.references || []);
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
        return 'Pending Response';
      case 'contacted':
        return 'Contacted';
      case 'applied':
        return 'Applied';
      default:
        return 'Unknown';
    }
  };

  const getStatusDescription = (status: Reference['status']) => {
    switch (status) {
      case 'pending':
        return 'Waiting for reference to respond';
      case 'contacted':
        return 'Reference has been contacted';
      case 'applied':
        return 'Reference has applied on your behalf';
      default:
        return '';
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getReferencesStats = () => {
    const total = references.length;
    const pending = references.filter(ref => ref.status === 'pending').length;
    const contacted = references.filter(
      ref => ref.status === 'contacted'
    ).length;
    const applied = references.filter(ref => ref.status === 'applied').length;
    const whatsappSent = references.filter(ref => ref.whatsappSent).length;

    return { total, pending, contacted, applied, whatsappSent };
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="flex items-center mb-6">
          <Users className="h-5 w-5 text-blue-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">References</h2>
        </div>
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" text="Loading references..." />
        </div>
      </div>
    );
  }

  const stats = getReferencesStats();

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center">
            <Users className="h-5 w-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">References</h2>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            People who can vouch for your voter registration
          </p>
        </div>
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

      {/* Statistics Cards */}
      {references.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {stats.total}
            </div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-800">
              {stats.pending}
            </div>
            <div className="text-sm text-yellow-600">Pending</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-800">
              {stats.contacted}
            </div>
            <div className="text-sm text-blue-600">Contacted</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-800">
              {stats.applied}
            </div>
            <div className="text-sm text-green-600">Applied</div>
          </div>
        </div>
      )}

      {/* References List */}
      {references.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No References Added
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            References are people who can vouch for your voter registration
            application. They will receive WhatsApp notifications about your
            application.
          </p>
          <div className="text-sm text-gray-500">
            <p>You can add references during the enrollment process.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {references.map(reference => (
            <div
              key={reference.id}
              className="border border-gray-200 rounded-lg p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Reference Header */}
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="flex-shrink-0">
                      <UserCheck className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {reference.name}
                      </h3>
                      <div className="flex items-center text-gray-600 mt-1">
                        <Phone className="h-4 w-4 mr-1" />
                        <span className="font-mono text-sm">
                          {reference.contact}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-3">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                        reference.status
                      )}`}
                    >
                      {getStatusIcon(reference.status)}
                      <span className="ml-2">
                        {getStatusText(reference.status)}
                      </span>
                    </span>
                    <p className="text-sm text-gray-600 mt-1">
                      {getStatusDescription(reference.status)}
                    </p>
                  </div>

                  {/* WhatsApp Status */}
                  <div className="mb-3">
                    {reference.whatsappSent && reference.whatsappSentAt ? (
                      <div className="flex items-center text-green-600 text-sm">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        <span>
                          WhatsApp sent on{' '}
                          {formatDate(reference.whatsappSentAt)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center text-yellow-600 text-sm">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        <span>WhatsApp notification pending</span>
                      </div>
                    )}
                  </div>

                  {/* Timeline */}
                  <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>Added: {formatDate(reference.createdAt)}</span>
                    </div>
                    {reference.updatedAt !== reference.createdAt && (
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>
                          Last updated: {formatDate(reference.updatedAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Progress Indicator */}
                <div className="flex-shrink-0 ml-4">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="flex items-center space-x-1">
                      {/* Progress dots */}
                      <div
                        className={`w-3 h-3 rounded-full ${
                          reference.status === 'pending' ||
                          reference.status === 'contacted' ||
                          reference.status === 'applied'
                            ? 'bg-yellow-500'
                            : 'bg-gray-300'
                        }`}
                      />
                      <div
                        className={`w-3 h-3 rounded-full ${
                          reference.status === 'contacted' ||
                          reference.status === 'applied'
                            ? 'bg-blue-500'
                            : 'bg-gray-300'
                        }`}
                      />
                      <div
                        className={`w-3 h-3 rounded-full ${
                          reference.status === 'applied'
                            ? 'bg-green-500'
                            : 'bg-gray-300'
                        }`}
                      />
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                      Progress
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              {reference.status === 'pending' && !reference.whatsappSent && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-start">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mr-2 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium">Action Required</p>
                      <p>
                        WhatsApp notification will be sent to this reference
                        shortly.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {reference.status === 'applied' && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                    <div className="text-sm text-green-800">
                      <p className="font-medium">Reference Applied</p>
                      <p>
                        This reference has successfully applied on your behalf.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary Footer */}
      {references.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                Reference Status Summary
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {stats.whatsappSent} of {stats.total} references have been
                notified via WhatsApp
              </p>
            </div>

            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {stats.applied} Applied
              </div>
              <div className="text-xs text-gray-600">
                out of {stats.total} references
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Reference Progress</span>
              <span>
                {Math.round((stats.applied / Math.max(stats.total, 1)) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(stats.applied / Math.max(stats.total, 1)) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
