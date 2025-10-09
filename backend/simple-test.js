// Simple test for admin authentication
import http from 'http';

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
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
      req.write(data);
    }

    req.end();
  });
}

async function testAdminLogin() {
  console.log('Testing admin login...');

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const loginData = JSON.stringify({
    username: 'admin',
    password: 'Admin@123',
  });

  try {
    const result = await makeRequest(options, loginData);
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));

    if (result.status === 200 && result.data.success) {
      console.log('✅ Admin login successful!');
      console.log('Token:', result.data.data.token.substring(0, 20) + '...');
      return result.data.data.token;
    } else {
      console.log('❌ Admin login failed');
      return null;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    return null;
  }
}

async function testAdminProfile(token) {
  console.log('\nTesting admin profile...');

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/profile',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  try {
    const result = await makeRequest(options);
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));

    if (result.status === 200 && result.data.success) {
      console.log('✅ Admin profile retrieved successfully!');
      return true;
    } else {
      console.log('❌ Admin profile retrieval failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Testing Admin Authentication System\n');

  // Test login
  const token = await testAdminLogin();
  if (!token) {
    console.log('Cannot proceed with other tests without valid token');
    return;
  }

  // Test profile
  await testAdminProfile(token);

  console.log('\n✅ Basic admin authentication tests completed!');
}

runTests().catch(console.error);
