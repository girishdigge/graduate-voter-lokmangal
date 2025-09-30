import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Welcome, {user?.fullName}
                </h1>
                <p className="text-gray-600 mt-2">
                  Manage your voter registration and profile information
                </p>
              </div>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>

          {/* Status Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex items-center">
              <div
                className={`w-4 h-4 rounded-full mr-3 ${
                  user?.isVerified ? 'bg-green-500' : 'bg-yellow-500'
                }`}
              />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Registration Status
                </h2>
                <p className="text-gray-600">
                  {user?.isVerified ? 'Verified' : 'Pending Verification'}
                </p>
              </div>
            </div>
          </div>

          {/* Placeholder for dashboard content - will be implemented in task 19 */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center py-12 text-gray-500">
              <p>Dashboard content will be implemented in a future task</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
