import React from 'react';
import { CheckCircle, Clock, Calendar, User } from 'lucide-react';

interface UserData {
  id: string;
  fullName: string;
  isVerified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  createdAt: string;
}

interface StatusCardProps {
  userData: UserData;
}

export const StatusCard: React.FC<StatusCardProps> = ({ userData }) => {
  const getStatusConfig = () => {
    if (userData.isVerified) {
      return {
        status: 'Verified',
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        description: 'Your profile has been verified and approved',
      };
    }

    return {
      status: 'Pending Verification',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      description: 'Your profile is under review by our admin team',
    };
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-4">
        <div className={`p-2 rounded-lg ${statusConfig.bgColor} mr-3`}>
          <StatusIcon className={`h-6 w-6 ${statusConfig.color}`} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Application Status
          </h3>
          <p className={`text-sm font-medium ${statusConfig.color}`}>
            {statusConfig.status}
          </p>
        </div>
      </div>

      <div
        className={`p-4 rounded-lg ${statusConfig.bgColor} ${statusConfig.borderColor} border mb-4`}
      >
        <p className={`text-sm ${statusConfig.color}`}>
          {statusConfig.description}
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="h-4 w-4 mr-2" />
          <span>
            Applied on:{' '}
            {new Date(userData.createdAt).toLocaleDateString('en-IN')}
          </span>
        </div>

        {userData.isVerified && userData.verifiedAt && (
          <div className="flex items-center text-sm text-gray-600">
            <CheckCircle className="h-4 w-4 mr-2" />
            <span>
              Verified on:{' '}
              {new Date(userData.verifiedAt).toLocaleDateString('en-IN')}
            </span>
          </div>
        )}

        {userData.isVerified && userData.verifiedBy && (
          <div className="flex items-center text-sm text-gray-600">
            <User className="h-4 w-4 mr-2" />
            <span>Verified by: {userData.verifiedBy}</span>
          </div>
        )}
      </div>

      {!userData.isVerified && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Next Steps:</strong> Make sure you've uploaded all required
            documents and added your references. Our team will review your
            application within 2-3 business days.
          </p>
        </div>
      )}
    </div>
  );
};
