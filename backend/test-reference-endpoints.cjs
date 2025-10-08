const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Test reference management endpoints
async function testReferenceEndpoints() {
  try {
    console.log('Testing Reference Management endpoints...\n');

    // First, login as admin to get token
    console.log('1. Admin Login...');
    const loginResponse = await axios.post(`${BASE_URL}/admin/login`, {
      username: 'admin',
      password: 'admin123',
    });

    if (loginResponse.data.success) {
      console.log('✅ Admin login successful');
      const token = loginResponse.data.data.token;
      const headers = { Authorization: `Bearer ${token}` };

      // Test references list endpoint
      console.log('\n2. Testing GET /api/admin/references...');
      const referencesResponse = await axios.get(
        `${BASE_URL}/admin/references?page=1&limit=5`,
        { headers }
      );
      if (referencesResponse.data.success) {
        console.log('✅ References list endpoint working');
        console.log(`Found ${referencesResponse.data.total} total references`);
        console.log(
          `Showing ${referencesResponse.data.data.length} references on page 1`
        );

        // Test reference status update if we have references
        if (referencesResponse.data.data.length > 0) {
          const firstReference = referencesResponse.data.data[0];
          const referenceId = firstReference.id;
          const currentStatus = firstReference.status;

          console.log('\n3. Testing PUT /api/admin/references/:referenceId...');

          // Determine new status to test with
          let newStatus;
          if (currentStatus === 'PENDING') {
            newStatus = 'CONTACTED';
          } else if (currentStatus === 'CONTACTED') {
            newStatus = 'APPLIED';
          } else {
            newStatus = 'PENDING';
          }

          const updateResponse = await axios.put(
            `${BASE_URL}/admin/references/${referenceId}`,
            { status: newStatus },
            { headers }
          );

          if (updateResponse.data.success) {
            console.log('✅ Reference status update endpoint working');
            console.log(
              `Changed reference status from ${currentStatus} to ${newStatus}`
            );
            console.log(
              `Reference: ${updateResponse.data.data.reference.referenceName}`
            );

            // Revert the change
            await axios.put(
              `${BASE_URL}/admin/references/${referenceId}`,
              { status: currentStatus },
              { headers }
            );
            console.log('✅ Reverted reference status');
          }
        } else {
          console.log('⚠️  No references found to test status update');
        }
      }

      // Test references with filtering
      console.log('\n4. Testing GET /api/admin/references with filters...');
      const filteredResponse = await axios.get(
        `${BASE_URL}/admin/references?status=PENDING&sort_by=created_at&sort_order=desc`,
        { headers }
      );
      if (filteredResponse.data.success) {
        console.log('✅ References filtering endpoint working');
        console.log(
          `Filtered results: ${filteredResponse.data.total} PENDING references found`
        );
      }

      // Test references search
      console.log('\n5. Testing GET /api/admin/references with search...');
      const searchResponse = await axios.get(
        `${BASE_URL}/admin/references?q=test`,
        { headers }
      );
      if (searchResponse.data.success) {
        console.log('✅ References search endpoint working');
        console.log(
          `Search results: ${searchResponse.data.total} references found`
        );
      }

      // Test existing search/references endpoint for comparison
      console.log('\n6. Testing GET /api/admin/search/references...');
      const searchResponse = await axios.get(
        `${BASE_URL}/admin/search/references?q=test&page=1&limit=5`,
        { headers }
      );
      if (searchResponse.data.success) {
        console.log('✅ Database-based references search endpoint working');
        console.log(
          `Search results: ${searchResponse.data.data.total} references found`
        );
      }

      console.log(
        '\n🎉 All reference management endpoints tested successfully!'
      );
    } else {
      console.log('❌ Admin login failed');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error(`Status: ${error.response.status}`);
    }
  }
}

// Run the test
testReferenceEndpoints();
