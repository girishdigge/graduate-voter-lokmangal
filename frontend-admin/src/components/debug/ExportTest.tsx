import React from 'react';
import { Button } from '../ui';
import { exportVotersToCSV, exportReferencesToCSV } from '../../lib/csvExport';
import type { Voter } from '../../types/voter';
import type { Reference } from '../../types/reference';

export const ExportTest: React.FC = () => {
  const testVoter: Voter = {
    id: '1',
    fullName: 'abc',
    sex: 'MALE',
    guardianSpouse: '',
    dateOfBirth: '1994-01-01',
    age: 30,
    occupation: '',
    qualification: '',
    contact: '9999999999',
    email: '',
    houseNumber: '',
    street: '',
    area: '',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '',
    isRegisteredElector: false,
    assemblyNumber: '234',
    assemblyName: '',
    pollingStationNumber: '432',
    epicNumber: '',
    disabilities: '',
    university: '',
    graduationYear: undefined,
    graduationDocType: '',
    aadharNumber: '111111111111',
    isVerified: true,
    verifiedBy: 'admin-id',
    verifiedAt: '2025-10-12T05:26:00.000Z',
    createdAt: '2025-10-08T04:45:00.000Z',
    updatedAt: '2025-10-12T05:26:00.000Z',
    verifiedByAdmin: {
      id: 'admin-id',
      fullName: 'System Administrator',
    },
  };

  const testReference: Reference = {
    id: '1',
    referenceName: 'Test Reference',
    referenceContact: '9876543210',
    status: 'PENDING',
    whatsappSent: false,
    whatsappSentAt: undefined,
    statusUpdatedAt: undefined,
    createdAt: '2025-10-08T04:45:00.000Z',
    updatedAt: '2025-10-12T05:26:00.000Z',
    userId: '1',
    user: {
      id: '1',
      fullName: 'abc',
      contact: '9999999999',
      aadharNumber: '111111111111',
    },
  };

  const handleTestVoterExport = () => {
    exportVotersToCSV([testVoter], 'test_voter_export.csv');
  };

  const handleTestReferenceExport = () => {
    exportReferencesToCSV([testReference], 'test_reference_export.csv');
  };

  return (
    <div className="p-4 border border-gray-300 rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">CSV Export Test</h3>

      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Test Data:</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <strong>Voter:</strong> abc, MALE, 30, 9999999999, Pune,
              Maharashtra, Assembly: 234, Polling: 432, Aadhar: 111111111111
            </p>
            <p>
              <strong>Status:</strong> Verified on 12/10/2025, 05:26 pm by
              System Administrator
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleTestVoterExport}
            className="flex items-center gap-2"
          >
            Test Voter Export
          </Button>
          <Button
            onClick={handleTestReferenceExport}
            className="flex items-center gap-2"
          >
            Test Reference Export
          </Button>
        </div>

        <div className="text-xs text-gray-500">
          <p>
            This will download CSV files with the test data to verify the export
            format.
          </p>
        </div>
      </div>
    </div>
  );
};
