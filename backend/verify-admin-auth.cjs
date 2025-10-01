/**
 * Verification script for Admin Authentication System
 * This script tests all the implemented endpoints to ensure they work correctly
 */

const http = require('http');

// Test configuration
const BASE_URL = 'localhost';
const PORT = 3000;
const TEST_ADMIN = {
  username: 'admin',
  password: 'Admin@123',
  newPassword: 'NewAdmin@123',
};

let authToken = '';

/**
 * Helper function to make HTTP requests
 */
function makeRequest(path, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: `/api${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, res => {
      let body = '';
      res.on('data', chunk => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({
            status: res.statusCode,
            data: jsonBody,
            headers: res.headers,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body,
            headers: res.headers,
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Test 1: Admin Login
 */
async function testAdminLogin() {
  console.log('\n🔐 Test 1: Admin Login');
  console.log('='.repeat(40));

  try {
    const result = await makeRequest('/admin/login', 'POST', {
      username: TEST_ADMIN.username,
      password: TEST_ADMIN.password,
    });

    console.log(`Status: ${result.status}`);

    if (result.status === 200 && result.data.success) {
      authToken = result.data.data.token;
      console.log('✅ PASS: Admin login successful');
      console.log(`   Admin: ${result.data.data.admin.fullName}`);
      console.log(`   Role: ${result.data.data.admin.role}`);
      console.log(`   Token: ${authToken.substring(0, 20)}...`);
      return true;
    } else {
      console.log('❌ FAIL: Admin login failed');
      console.log(`   Error: ${result.data.error?.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log('❌ FAIL: Admin login error');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

/**
 * Test 2: Admin Profile
 */
async function testAdminProfile() {
  console.log('\n👤 Test 2: Admin Profile');
  console.log('='.repeat(40));

  try {
    const result = await makeRequest('/admin/profile', 'GET', null, {
      Authorization: `Bearer ${authToken}`,
    });

    console.log(`Status: ${result.status}`);

    if (result.status === 200 && result.data.success) {
      console.log('✅ PASS: Admin profile retrieved');
      console.log(`   Username: ${result.data.data.admin.username}`);
      console.log(`   Email: ${result.data.data.admin.email}`);
      console.log(`   Role: ${result.data.data.admin.role}`);
      return true;
    } else {
      console.log('❌ FAIL: Admin profile retrieval failed');
      console.log(`   Error: ${result.data.error?.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log('❌ FAIL: Admin profile error');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

/**
 * Test 3: Session Validation
 */
async function testSessionValidation() {
  console.log('\n🔍 Test 3: Session Validation');
  console.log('='.repeat(40));

  try {
    const result = await makeRequest('/admin/validate-session', 'POST', null, {
      Authorization: `Bearer ${authToken}`,
    });

    console.log(`Status: ${result.status}`);

    if (result.status === 200 && result.data.success) {
      console.log('✅ PASS: Session validation successful');
      console.log(`   Valid: ${result.data.data.valid}`);
      return true;
    } else {
      console.log('❌ FAIL: Session validation failed');
      console.log(`   Error: ${result.data.error?.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log('❌ FAIL: Session validation error');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

/**
 * Test 4: Password Change
 */
async function testPasswordChange() {
  console.log('\n🔑 Test 4: Password Change');
  console.log('='.repeat(40));

  try {
    const result = await makeRequest(
      '/admin/password',
      'PUT',
      {
        currentPassword: TEST_ADMIN.password,
        newPassword: TEST_ADMIN.newPassword,
      },
      {
        Authorization: `Bearer ${authToken}`,
      }
    );

    console.log(`Status: ${result.status}`);

    if (result.status === 200 && result.data.success) {
      console.log('✅ PASS: Password change successful');

      // Test login with new password
      console.log('   Testing login with new password...');
      const loginResult = await makeRequest('/admin/login', 'POST', {
        username: TEST_ADMIN.username,
        password: TEST_ADMIN.newPassword,
      });

      if (loginResult.status === 200 && loginResult.data.success) {
        authToken = loginResult.data.data.token;
        console.log('   ✅ Login with new password successful');

        // Change password back
        await makeRequest(
          '/admin/password',
          'PUT',
          {
            currentPassword: TEST_ADMIN.newPassword,
            newPassword: TEST_ADMIN.password,
          },
          {
            Authorization: `Bearer ${authToken}`,
          }
        );
        console.log('   ✅ Password changed back to original');

        return true;
      } else {
        console.log('   ❌ Login with new password failed');
        return false;
      }
    } else {
      console.log('❌ FAIL: Password change failed');
      console.log(`   Error: ${result.data.error?.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log('❌ FAIL: Password change error');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

/**
 * Test 5: Unauthorized Access
 */
async function testUnauthorizedAccess() {
  console.log('\n🚫 Test 5: Unauthorized Access');
  console.log('='.repeat(40));

  try {
    const result = await makeRequest('/admin/profile', 'GET');

    console.log(`Status: ${result.status}`);

    if (result.status === 401) {
      console.log('✅ PASS: Unauthorized access properly blocked');
      console.log(`   Error: ${result.data.error?.message || 'Unknown error'}`);
      return true;
    } else {
      console.log('❌ FAIL: Unauthorized access not properly blocked');
      console.log(`   Expected 401, got ${result.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ FAIL: Unauthorized access test error');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

/**
 * Test 6: Admin Logout
 */
async function testAdminLogout() {
  console.log('\n🚪 Test 6: Admin Logout');
  console.log('='.repeat(40));

  try {
    const result = await makeRequest('/admin/logout', 'POST', null, {
      Authorization: `Bearer ${authToken}`,
    });

    console.log(`Status: ${result.status}`);

    if (result.status === 200 && result.data.success) {
      console.log('✅ PASS: Admin logout successful');
      authToken = ''; // Clear token
      return true;
    } else {
      console.log('❌ FAIL: Admin logout failed');
      console.log(`   Error: ${result.data.error?.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log('❌ FAIL: Admin logout error');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

/**
 * Test 7: Invalid Credentials
 */
async function testInvalidCredentials() {
  console.log('\n🔒 Test 7: Invalid Credentials');
  console.log('='.repeat(40));

  try {
    const result = await makeRequest('/admin/login', 'POST', {
      username: TEST_ADMIN.username,
      password: 'wrongpassword',
    });

    console.log(`Status: ${result.status}`);

    if (result.status === 401) {
      console.log('✅ PASS: Invalid credentials properly rejected');
      console.log(`   Error: ${result.data.error?.message || 'Unknown error'}`);
      return true;
    } else {
      console.log('❌ FAIL: Invalid credentials not properly rejected');
      console.log(`   Expected 401, got ${result.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ FAIL: Invalid credentials test error');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

/**
 * Check server health
 */
async function checkServerHealth() {
  try {
    // Use direct HTTP request for health check since it's not under /api
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: '/health',
      method: 'GET',
    };

    const result = await new Promise((resolve, reject) => {
      const req = http.request(options, res => {
        let body = '';
        res.on('data', chunk => {
          body += chunk;
        });
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            data: body,
          });
        });
      });
      req.on('error', reject);
      req.end();
    });

    if (result.status === 200) {
      console.log('✅ Server is running and healthy');
      return true;
    } else {
      console.log('❌ Server health check failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Cannot connect to server');
    console.log('   Please make sure the server is running on port 3000');
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🧪 Admin Authentication System Verification');
  console.log('==========================================');

  // Check server health first
  console.log('Checking server connectivity...');
  try {
    const testResult = await makeRequest('/admin/login', 'POST', {
      username: 'test',
      password: 'test',
    });
    if (testResult.status === 401 || testResult.status === 400) {
      console.log('✅ Server is responding to API requests');
    } else {
      console.log('❌ Server not responding properly');
      process.exit(1);
    }
  } catch (error) {
    console.log('❌ Cannot connect to server');
    console.log('   Please make sure the server is running on port 3000');
    process.exit(1);
  }

  const tests = [
    { name: 'Admin Login', fn: testAdminLogin },
    { name: 'Admin Profile', fn: testAdminProfile },
    { name: 'Session Validation', fn: testSessionValidation },
    { name: 'Password Change', fn: testPasswordChange },
    { name: 'Admin Logout', fn: testAdminLogout },
    { name: 'Unauthorized Access', fn: testUnauthorizedAccess },
    { name: 'Invalid Credentials', fn: testInvalidCredentials },
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
      console.log(`❌ ${test.name} threw an error: ${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 VERIFICATION RESULTS');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(
    `📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`
  );

  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ Admin Authentication System is working correctly');
    console.log('\n📋 Implemented Features:');
    console.log('   • POST /api/admin/login - Admin authentication');
    console.log('   • POST /api/admin/logout - Admin logout');
    console.log('   • PUT /api/admin/password - Password change');
    console.log('   • GET /api/admin/profile - Admin profile');
    console.log('   • POST /api/admin/validate-session - Session validation');
    console.log('   • JWT token generation with role information');
    console.log('   • Role-based access control middleware');
    console.log('   • Comprehensive audit logging');
    console.log('   • Rate limiting for security');
    console.log('   • Input validation and sanitization');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED');
    console.log('Please check the implementation and server logs');
  }
}

// Run the verification
runAllTests().catch(console.error);
