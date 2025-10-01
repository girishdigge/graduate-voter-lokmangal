#!/usr/bin/env node

/**
 * Simple test script to verify the new user dashboard endpoints
 * This tests the implementation of task 8: User Dashboard and Profile Management
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api';

// Test data
const testUser = {
  aadharNumber: '123456789012',
  fullName: 'Test User Dashboard',
  sex: 'MALE',
  guardianSpouse: 'Test Guardian',
  qualification: 'Graduate',
  occupation: 'Software Engineer',
  contact: '9876543210',
  email: 'testuser@example.com',
  dateOfBirth: '1990-01-01',
  houseNumber: '123',
  street: 'Test Street',
  area: 'Test Area',
  city: 'PUNE',
  state: 'Maharashtra',
  pincode: '411001',
  isRegisteredElector: false,
  university: 'Test University',
  graduationYear: 2012,
  graduationDocType: 'DEGREE_CERTIFICATE',
};

let userToken = null;
let userId = null;

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    console.error('Request failed:', error.message);
    return { status: 500, data: { error: error.message } };
  }
}

async function testUserEnrollment() {
  console.log('\n🔧 Testing user enrollment...');

  const result = await makeRequest(`${BASE_URL}/users/enroll`, {
    method: 'POST',
    body: JSON.stringify(testUser),
  });

  if (result.status === 201 && result.data.success) {
    userToken = result.data.data.token;
    userId = result.data.data.user.id;
    console.log('✅ User enrollment successful');
    console.log(`   User ID: ${userId}`);
    console.log(`   Token: ${userToken.substring(0, 20)}...`);
    return true;
  } else {
    console.log('❌ User enrollment failed:', result.data);
    return false;
  }
}

async function testGetUserById() {
  console.log('\n🔧 Testing GET /api/users/:userId...');

  const result = await makeRequest(`${BASE_URL}/users/${userId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${userToken}`,
    },
  });

  if (result.status === 200 && result.data.success) {
    console.log('✅ GET user by ID successful');
    console.log(`   User: ${result.data.data.user.fullName}`);
    console.log(`   Verified: ${result.data.data.user.isVerified}`);
    return true;
  } else {
    console.log('❌ GET user by ID failed:', result.data);
    return false;
  }
}

async function testUpdateUserById() {
  console.log('\n🔧 Testing PUT /api/users/:userId...');

  const updateData = {
    occupation: 'Senior Software Engineer',
    email: 'updated.testuser@example.com',
  };

  const result = await makeRequest(`${BASE_URL}/users/${userId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${userToken}`,
    },
    body: JSON.stringify(updateData),
  });

  if (result.status === 200 && result.data.success) {
    console.log('✅ PUT user by ID successful');
    console.log(`   Updated occupation: ${result.data.data.user.occupation}`);
    console.log(`   Updated email: ${result.data.data.user.email}`);
    return true;
  } else {
    console.log('❌ PUT user by ID failed:', result.data);
    return false;
  }
}

async function testGetUserDocuments() {
  console.log('\n🔧 Testing GET /api/users/:userId/documents...');

  const result = await makeRequest(`${BASE_URL}/users/${userId}/documents`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${userToken}`,
    },
  });

  if (result.status === 200 && result.data.success) {
    console.log('✅ GET user documents successful');
    console.log(`   Document count: ${result.data.data.count}`);
    return true;
  } else {
    console.log('❌ GET user documents failed:', result.data);
    return false;
  }
}

async function testRefreshToken() {
  console.log('\n🔧 Testing POST /api/users/:userId/refresh-token...');

  const result = await makeRequest(
    `${BASE_URL}/users/${userId}/refresh-token`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    }
  );

  if (result.status === 200 && result.data.success) {
    console.log('✅ Token refresh successful');
    console.log(`   Token refreshed: ${result.data.data.tokenRefreshed}`);
    console.log(`   Message: ${result.data.data.message}`);
    return true;
  } else {
    console.log('❌ Token refresh failed:', result.data);
    return false;
  }
}

async function testAccessControl() {
  console.log('\n🔧 Testing access control (should fail)...');

  // Try to access another user's profile (should fail)
  const fakeUserId = 'fake-user-id-12345';
  const result = await makeRequest(`${BASE_URL}/users/${fakeUserId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${userToken}`,
    },
  });

  if (result.status === 403) {
    console.log('✅ Access control working correctly (403 Forbidden)');
    return true;
  } else {
    console.log(
      '❌ Access control failed - should have returned 403:',
      result.data
    );
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting User Dashboard API Tests');
  console.log('=====================================');

  const tests = [
    { name: 'User Enrollment', fn: testUserEnrollment },
    { name: 'Get User by ID', fn: testGetUserById },
    { name: 'Update User by ID', fn: testUpdateUserById },
    { name: 'Get User Documents', fn: testGetUserDocuments },
    { name: 'Refresh Token', fn: testRefreshToken },
    { name: 'Access Control', fn: testAccessControl },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} threw error:`, error.message);
      failed++;
    }
  }

  console.log('\n📊 Test Results');
  console.log('================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(
    `📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`
  );

  if (failed === 0) {
    console.log(
      '\n🎉 All tests passed! Task 8 implementation is working correctly.'
    );
  } else {
    console.log('\n⚠️  Some tests failed. Please check the implementation.');
  }
}

// Check if server is running
async function checkServer() {
  console.log('🔍 Checking if server is running...');
  const result = await makeRequest(`${BASE_URL}`);

  if (result.status === 200) {
    console.log('✅ Server is running');
    return true;
  } else {
    console.log('❌ Server is not running. Please start with: npm run dev');
    return false;
  }
}

// Main execution
async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await runTests();
  }
}

main().catch(console.error);
