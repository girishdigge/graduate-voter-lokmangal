import React, { useState } from 'react';
import { Settings, Users, Lock, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ManagersTable, PasswordChangeForm } from '../components/settings';

type SettingsTab = 'password' | 'managers';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('password');

  // This page should only be accessible to admins and managers
  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
        <p className="text-gray-600">
          You don't have permission to access this page.
        </p>
      </div>
    );
  }

  const tabs = [
    {
      id: 'password' as SettingsTab,
      name: 'Password',
      icon: Lock,
      description: 'Change your account password',
      roles: ['admin', 'manager'],
    },
    {
      id: 'managers' as SettingsTab,
      name: 'User Management',
      icon: Users,
      description: 'Manage administrator and manager accounts',
      roles: ['admin'], // Only admins can manage users
    },
  ];

  const availableTabs = tabs.filter(tab => tab.roles.includes(user.role));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
          <Settings className="h-5 w-5 text-gray-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">
            Manage your account settings and system configuration
          </p>
        </div>
      </div>

      {/* Role Badge */}
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-blue-600" />
        <span className="text-sm text-gray-600">
          Logged in as{' '}
          <span className="font-medium capitalize">{user.role}</span>
        </span>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {availableTabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'password' && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Password Settings
              </h2>
              <p className="text-sm text-gray-600">
                Update your account password to keep your account secure
              </p>
            </div>
            <PasswordChangeForm />
          </div>
        )}

        {activeTab === 'managers' && user.role === 'admin' && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                User Management
              </h2>
              <p className="text-sm text-gray-600">
                Create and manage administrator and manager accounts
              </p>
            </div>
            <ManagersTable />
          </div>
        )}
      </div>
    </div>
  );
};
