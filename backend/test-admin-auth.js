/**
 * Test script for Admin Authentication System
 * Tests the admin login, profile, password change, and logout endpoints
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api';

// Test configuration
const TEST_ADMIN = {
  username: 'admin',
  password: 'Admin@123',
  newPassword: 'NewAdmin@123',
};

let authToken = '';

/**
 * Helper function to make API requests
 */
async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  const data = await response.json();

  return {
    status: response.status,
    data,
    ok: response.ok,
  };
}

/**
 * Test admin login
 */
async function testAdminLogin() {
  console.log('\n🔐 Testing Admin Login...');

  try {
    const result = await makeRequest('/admin/login', {
      method: 'POST',
      body: JSON.stringify({
        username: TEST_ADMIN.username,
        password: TEST_ADMIN.password,
      }),
    });

    if (result.ok && result.data.success) {
      authToken = result.data.data.token;
      console.log('✅ Admin login successful');
      console.log(
        `   Admin: ${result.data.data.admin.fullName} (${result.data.data.admin.role})`
      );
      console.log(`   Token: ${authToken.substring(0, 20)}...`);
      return true;
    } else {
      console.log('❌ Admin login failed');
      console.log(`   Status: ${result.status}`);
      console.log(`   Error: ${result.data.error?.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Admin login error:', error.message);
    return false;
  }
}

/**
 * Test admin profile retrieval
 */
async function testAdminProfile() {
  console.log('\n👤 Testing Admin Profile...');

  try {
    const result = await makeRequest('/admin/profile', {
      method: 'GET',
    });

    if (result.ok && result.data.success) {
      console.log('✅ Admin profile retrieved successfully');
      console.log(`   Username: ${result.data.data.admin.username}`);
      console.log(`   Email: ${result.data.data.admin.email}`);
      console.log(`   Role: ${result.data.data.admin.role}`);
      return true;
    } else {
      console.log('❌ Admin profile retrieval failed');
      console.log(`   Status: ${result.status}`);
      console.log(`   Error: ${result.data.error?.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Admin profile error:', error.message);
    return false;
  }
}

/**
 * Test session validation
 */
async function testSessionValidation() {
  console.log('\n🔍 Testing Session Validation...');

  try {
    const result = await makeRequest('/admin/validate-session', {
      method: 'POST',
    });

    if (result.ok && result.data.success) {
      console.log('✅ Session validation successful');
      console.log(`   Valid: ${result.data.data.valid}`);
      return true;
    } else {
      console.log('❌ Session validation failed');
      console.log(`   Status: ${result.status}`);
      console.log(`   Error: ${result.data.error?.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Session validation error:', error.message);
    return false;
  }
}

/**
 * Test password change
 */
async function testPasswordChange() {
  console.log('\n🔑 Testing Password Change...');

  try {
    const result = await makeRequest('/admin/password', {
      method: 'PUT',
      body: JSON.stringify({
        currentPassword: TEST_ADMIN.password,
        newPassword: TEST_ADMIN.newPassword,
      }),
    });

    if (result.ok && result.data.success) {
      console.log('✅ Password change successful');

      // Test login with new password
      console.log('   Testing login with new password...');
      const loginResult = await makeRequest('/admin/login', {
        method: 'POST',
        body: JSON.stringify({
          username: TEST_ADMIN.username,
          password: TEST_ADMIN.newPassword,
        }),
      });

      if (loginResult.ok) {
        authToken = loginResult.data.data.token;
        console.log('   ✅ Login with new password successful');

        // Change password back
        await makeRequest('/admin/password', {
          method: 'PUT',
          body: JSON.stringify({
            currentPassword: TEST_ADMIN.newPassword,
            newPassword: TEST_ADMIN.password,
          }),
        });
        console.log('   ✅ Password changed back to original');

        return true;
      } else {
        console.log('   ❌ Login with new password failed');
        return false;
      }
    } else {
      console.log('❌ Password change failed');
      console.log(`   Status: ${result.status}`);
      console.log(`   Error: ${result.data.error?.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Password change error:', error.message);
    return false;
  }
}

/**
 * Test admin logout
 */
async function testAdminLogout() {
  console.log('\n🚪 Testing Admin Logout...');

  try {
    const result = await makeRequest('/admin/logout', {
      method: 'POST',
    });

    if (result.ok && result.data.success) {
      console.log('✅ Admin logout successful');
      authToken = ''; // Clear token
      return true;
    } else {
      console.log('❌ Admin logout failed');
      console.log(`   Status: ${result.status}`);
      console.log(`   Error: ${result.data.error?.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Admin logout error:', error.message);
    return false;
  }
}

/**
 * Test authentication without token
 */
async function testUnauthorizedAccess() {
  console.log('\n🚫 Testing Unauthorized Access...');

  try {
    const result = await makeRequest('/admin/profile', {
      method: 'GET',
    });

    if (!result.ok && result.status === 401) {
      console.log('✅ Unauthorized access properly blocked');
      console.log(`   Status: ${result.status}`);
      console.log(`   Error: ${result.data.error?.message || 'Unknown error'}`);
      return true;
    } else {
      console.log('❌ Unauthorized access not properly blocked');
      console.log(`   Status: ${result.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Unauthorized access test error:', error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🧪 Starting Admin Authentication System Tests');
  console.log('='.repeat(50));

  const tests = [
    { name: 'Admin Login', fn: testAdminLogin },
    { name: 'Admin Profile', fn: testAdminProfile },
    { name: 'Session Validation', fn: testSessionValidation },
    { name: 'Password Change', fn: testPasswordChange },
    { name: 'Admin Logout', fn: testAdminLogout },
    { name: 'Unauthorized Access', fn: testUnauthorizedAccess },
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
      console.log(`❌ ${test.name} threw an error:`, error.message);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Results:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(
    `   📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`
  );

  if (failed === 0) {
    console.log(
      '\n🎉 All tests passed! Admin Authentication System is working correctly.'
    );
  } else {
    console.log('\n⚠️  Some tests failed. Please check the implementation.');
  }
}

// Check if server is running
async function checkServerHealth() {
  try {
    const response = await fetch(`${BASE_URL.replace('/api', '')}/health`);
    if (response.ok) {
      console.log('✅ Server is running and healthy');
      return true;
    } else {
      console.log('❌ Server health check failed');
      return false;
    }
  } catch (error) {
    console.log(
      '❌ Cannot connect to server. Please make sure the server is running on port 3000'
    );
    console.log('   Run: npm run dev (in the backend directory)');
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Admin Authentication System Test Suite');
  console.log('==========================================\n');

  const serverHealthy = await checkServerHealth();
  if (!serverHealthy) {
    process.exit(1);
  }

  await runTests();
}

// Run the tests
main().catch(console.error);
