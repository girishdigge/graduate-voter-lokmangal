import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import {
  StatusCard,
  ProfileCard,
  DocumentsCard,
  ReferencesCard,
} from '../components/dashboard';
import { apiEndpoints } from '../lib/api';
import { LogOut, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface UserData {
  id: string;
  aadharNumber: string;
  fullName: string;
  sex: 'MALE' | 'FEMALE' | 'OTHER';
  guardianSpouse: string;
  qualification: string;
  occupation: string;
  contact: string;
  email?: string;
  dateOfBirth: string;
  age: number;
  houseNumber: string;
  street: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  isRegisteredElector: boolean;
  assemblyNumber?: string;
  assemblyName?: string;
  pollingStationNumber?: string;
  epicNumber?: string;
  disabilities?: string;
  university: string;
  graduationYear: string;
  graduationDocumentType: string;
  isVerified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  createdAt: string;
  updatedAt: string;
}

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadUserData();
    }
  }, [user?.id]);

  const loadUserData = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await apiEndpoints.getUserProfile();
      setUserData(response.data.data.user);
    } catch (error: any) {
      console.error('Failed to load user data:', error);
      setError(
        error.response?.data?.error?.message ||
          'Failed to load profile data. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusInfo = () => {
    if (!userData)
      return { status: 'loading', message: 'Loading...', icon: Clock };

    if (userData.isVerified) {
      return {
        status: 'verified',
        message: 'Your profile has been verified',
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
      };
    }

    return {
      status: 'pending',
      message: 'Profile verification pending',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your dashboard..." />
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Unable to Load Dashboard
            </h2>
            <p className="text-gray-600 mb-6">
              {error || 'Failed to load your profile data.'}
            </p>
            <div className="space-y-3">
              <Button onClick={loadUserData} className="w-full">
                Try Again
              </Button>
              <Button variant="outline" onClick={logout} className="w-full">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome back, {userData.fullName}
                </h1>
                <p className="text-gray-600">
                  Manage your voter registration and profile information
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div
                  className={`flex items-center px-3 py-2 rounded-lg ${statusInfo.bgColor} ${statusInfo.borderColor} border`}
                >
                  <statusInfo.icon
                    className={`h-5 w-5 ${statusInfo.color} mr-2`}
                  />
                  <span className={`text-sm font-medium ${statusInfo.color}`}>
                    {statusInfo.message}
                  </span>
                </div>
                <Button
                  variant="outline"
                  onClick={logout}
                  className="flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Profile & Status */}
            <div className="lg:col-span-1 space-y-6">
              <StatusCard userData={userData} />
              <ProfileCard userData={userData} onUpdate={loadUserData} />
            </div>

            {/* Right Column - Documents & References */}
            <div className="lg:col-span-2 space-y-6">
              <DocumentsCard userId={userData.id} />
              <ReferencesCard userId={userData.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
