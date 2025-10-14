import { useState, useEffect } from 'react';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { apiEndpoints } from '../../lib/api';
import { Users, Clock, CheckCircle } from 'lucide-react';

interface ReferredContact {
  id: string;
  referenceName: string;
  referenceContact: string;
  status: 'PENDING' | 'CONTACTED' | 'APPLIED';
  whatsappSent: boolean;
  whatsappSentAt?: string;
  statusUpdatedAt?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    fullName: string;
    contact: string;
    aadharNumber: string;
  };
}

interface ReferredContactsListProps {
  userId: string;
  className?: string;
}

export const ReferredContactsList: React.FC<ReferredContactsListProps> = ({
  userId,
  className,
}) => {
  const [referredContacts, setReferredContacts] = useState<ReferredContact[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReferredContacts();
  }, [userId]);

  const loadReferredContacts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiEndpoints.getReferredContacts(userId);
      setReferredContacts(response.data.data.referredContacts || []);
    } catch (error: any) {
      console.error('Failed to load referred contacts:', error);
      setError(
        error.response?.data?.error?.message ||
          'Failed to load referred contacts. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: ReferredContact['status']) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'CONTACTED':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'APPLIED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: ReferredContact['status']) => {
    switch (status) {
      case 'PENDING':
        return 'Pending Response';
      case 'CONTACTED':
        return 'Contacted';
      case 'APPLIED':
        return 'Applied';
      default:
        return 'Unknown';
    }
  };

  const getStatusDescription = (status: ReferredContact['status']) => {
    switch (status) {
      case 'PENDING':
        return 'Reference verification pending';
      case 'CONTACTED':
        return 'Reference has been contacted';
      case 'APPLIED':
        return 'Application completed with this reference';
      default:
        return '';
    }
  };

  const getStatusColor = (status: ReferredContact['status']) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CONTACTED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'APPLIED':
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

  const getReferredContactsStats = () => {
    const total = referredContacts.length;
    const pending = referredContacts.filter(
      ref => ref.status === 'PENDING'
    ).length;
    const contacted = referredContacts.filter(
      ref => ref.status === 'CONTACTED'
    ).length;
    const applied = referredContacts.filter(
      ref => ref.status === 'APPLIED'
    ).length;

    return { total, pending, contacted, applied };
  };

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center mb-4">
          <Users className="h-5 w-5 text-green-600 mr-2" />
          <h3 className="text-md font-semibold text-gray-900">
            Referred by Me
          </h3>
        </div>
        <div className="flex justify-center py-4">
          <LoadingSpinner size="md" text="Loading referred contacts..." />
        </div>
      </div>
    );
  }

  const stats = getReferredContactsStats();

  return (
    <div className={`${className}`}>
      <div className="flex items-center mb-4">
        <Users className="h-5 w-5 text-green-600 mr-2" />
        <h3 className="text-md font-semibold text-gray-900">Referred by Me</h3>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Compact Statistics */}
      {referredContacts.length > 0 && (
        <div className="flex items-center gap-4 mb-4 text-sm">
          <span className="text-gray-600">
            <span className="font-medium text-gray-900">{stats.total}</span>{' '}
            Total
          </span>
          <span className="text-yellow-600">
            <span className="font-medium">{stats.pending}</span> Pending
          </span>
          <span className="text-blue-600">
            <span className="font-medium">{stats.contacted}</span> Contacted
          </span>
          <span className="text-green-600">
            <span className="font-medium">{stats.applied}</span> Applied
          </span>
        </div>
      )}

      {/* Compact Referred Contacts List */}
      {referredContacts.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
          <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">
            No contacts have been referred by you yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {referredContacts.map(contact => (
            <div
              key={contact.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="flex-shrink-0">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900 truncate">
                        {contact.referenceName}
                      </h4>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          contact.status
                        )}`}
                      >
                        {getStatusIcon(contact.status)}
                        <span className="ml-1">
                          {getStatusText(contact.status)}
                        </span>
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      📞 {contact.referenceContact}
                    </p>
                    <div className="flex items-center mt-1 text-xs text-gray-500">
                      {contact.whatsappSent ? (
                        <span className="flex items-center text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          WhatsApp sent
                        </span>
                      ) : (
                        <span className="flex items-center text-yellow-600">
                          <Clock className="h-3 w-3 mr-1" />
                          Notification pending
                        </span>
                      )}
                      <span className="ml-3">
                        Added {formatDate(contact.createdAt).split(',')[0]}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
