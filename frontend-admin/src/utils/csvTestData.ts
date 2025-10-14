// Test data to verify CSV formatting
export const testVoterData = [
  {
    fullName: 'John Doe',
    contact: '9876543210',
    aadharNumber: '123456789012',
    dateOfBirth: '1990-01-15',
    age: 34,
    sex: 'MALE',
    houseNumber: '123',
    street: 'Main Street',
    area: 'Downtown',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    assemblyNumber: '123',
    pollingStationNumber: '45',
    isVerified: true,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
  {
    fullName: 'Jane Smith',
    contact: '8765432109',
    aadharNumber: '987654321098',
    dateOfBirth: '1985-05-20',
    age: 39,
    sex: 'FEMALE',
    houseNumber: '456',
    street: 'Park Avenue',
    area: 'Uptown',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110001',
    assemblyNumber: '67',
    pollingStationNumber: '89',
    isVerified: false,
    createdAt: '2024-01-16T14:20:00Z',
    updatedAt: '2024-01-16T14:20:00Z',
  },
];

export const testReferenceData = [
  {
    id: '1',
    referenceName: 'Reference Person 1',
    referenceContact: '9123456789',
    status: 'PENDING' as const,
    whatsappSent: true,
    whatsappSentAt: '2024-01-15T10:30:00Z',
    statusUpdatedAt: null,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    user: {
      fullName: 'John Doe',
      contact: '9876543210',
      aadharNumber: '123456789012',
    },
  },
  {
    id: '2',
    referenceName: 'Reference Person 2',
    referenceContact: '8987654321',
    status: 'CONTACTED' as const,
    whatsappSent: false,
    whatsappSentAt: null,
    statusUpdatedAt: '2024-01-16T12:00:00Z',
    createdAt: '2024-01-16T11:30:00Z',
    updatedAt: '2024-01-16T12:00:00Z',
    user: {
      fullName: 'Jane Smith',
      contact: '8765432109',
      aadharNumber: '987654321098',
    },
  },
];

// Function to test CSV export formatting
export const testCsvExport = () => {
  console.log('Testing CSV Export Formatting...');

  // Test the formatting functions
  const testNumbers = [
    '9876543210', // 10 digit phone
    '123456789012', // 12 digit Aadhar
    '400001', // 6 digit pincode
    '12345678901234', // Very long number
  ];

  testNumbers.forEach(num => {
    console.log(`Original: ${num}`);
    console.log(`Formatted: '${num}`);
    console.log(`Excel Formula: "=""${num}"""`);
    console.log('---');
  });
};
