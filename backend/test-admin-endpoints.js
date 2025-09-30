const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Test admin endpoints
async function testAdminEndpoints() {
  try {
    console.log(
      'Testing Admin Dashboard Statistics and Voter Management endpoints...\n'
    );

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

      // Test stats endpoint
      console.log('\n2. Testing GET /api/admin/stats...');
      const statsResponse = await axios.get(`${BASE_URL}/admin/stats`, {
        headers,
      });
      if (statsResponse.data.success) {
        console.log('✅ Stats endpoint working');
        console.log(
          'Stats data:',
          JSON.stringify(statsResponse.data.data, null, 2)
        );
      }

      // Test voters list endpoint
      console.log('\n3. Testing GET /api/admin/voters...');
      const votersResponse = await axios.get(
        `${BASE_URL}/admin/voters?page=1&limit=5`,
        { headers }
      );
      if (votersResponse.data.success) {
        console.log('✅ Voters list endpoint working');
        console.log(
          `Found ${votersResponse.data.data.pagination.total} total voters`
        );
        console.log(
          `Showing ${votersResponse.data.data.data.length} voters on page 1`
        );

        // Test voter details if we have users
        if (votersResponse.data.data.data.length > 0) {
          const firstUserId = votersResponse.data.data.data[0].id;

          console.log('\n4. Testing GET /api/admin/voters/:userId...');
          const voterDetailsResponse = await axios.get(
            `${BASE_URL}/admin/voters/${firstUserId}`,
            { headers }
          );
          if (voterDetailsResponse.data.success) {
            console.log('✅ Voter details endpoint working');
            console.log(
              `Retrieved details for: ${voterDetailsResponse.data.data.user.fullName}`
            );
          }

          // Test voter verification
          console.log('\n5. Testing PUT /api/admin/voters/:userId/verify...');
          const currentVerificationStatus =
            voterDetailsResponse.data.data.user.isVerified;
          const newVerificationStatus = !currentVerificationStatus;

          const verifyResponse = await axios.put(
            `${BASE_URL}/admin/voters/${firstUserId}/verify`,
            { isVerified: newVerificationStatus },
            { headers }
          );

          if (verifyResponse.data.success) {
            console.log('✅ Voter verification endpoint working');
            console.log(
              `Changed verification status from ${currentVerificationStatus} to ${newVerificationStatus}`
            );

            // Revert the change
            await axios.put(
              `${BASE_URL}/admin/voters/${firstUserId}/verify`,
              { isVerified: currentVerificationStatus },
              { headers }
            );
            console.log('✅ Reverted verification status');
          }

          // Test voter update
          console.log('\n6. Testing PUT /api/admin/voters/:userId...');
          const updateResponse = await axios.put(
            `${BASE_URL}/admin/voters/${firstUserId}`,
            {
              qualification: 'Updated by admin test',
            },
            { headers }
          );

          if (updateResponse.data.success) {
            console.log('✅ Voter update endpoint working');
            console.log('Updated voter qualification field');
          }
        } else {
          console.log('⚠️  No voters found to test individual voter endpoints');
        }
      }

      // Test voters with search
      console.log('\n7. Testing GET /api/admin/voters with search...');
      const searchResponse = await axios.get(
        `${BASE_URL}/admin/voters?q=test&verification_status=verified`,
        { headers }
      );
      if (searchResponse.data.success) {
        console.log('✅ Voters search endpoint working');
        console.log(
          `Search results: ${searchResponse.data.data.pagination.total} voters found`
        );
      }

      console.log('\n🎉 All admin endpoints tested successfully!');
    } else {
      console.log('❌ Admin login failed');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testAdminEndpoints();
