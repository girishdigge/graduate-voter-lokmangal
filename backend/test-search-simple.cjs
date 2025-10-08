const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testSearch() {
  try {
    console.log('Testing Database-based Search functionality...\n');

    // Test admin login
    console.log('1. Admin Login...');
    const loginResponse = await axios.post(`${BASE_URL}/admin/login`, {
      username: 'admin',
      password: 'admin123',
    });

    if (loginResponse.data.success) {
      console.log('✅ Admin login successful');
      const token = loginResponse.data.data.token;
      const headers = { Authorization: `Bearer ${token}` };

      // Test reference search endpoint
      console.log('\n2. Testing reference search endpoint...');
      try {
        const searchResponse = await axios.get(
          `${BASE_URL}/admin/search/references?q=test&page=1&limit=5`,
          { headers }
        );

        console.log('✅ Database-based reference search working');
        console.log(
          `Search results: ${searchResponse.data.data.total} references found`
        );
        console.log('Response structure:', Object.keys(searchResponse.data));
      } catch (searchError) {
        console.log(
          '❌ Reference search failed:',
          searchError.response?.data || searchError.message
        );
      }

      // Test user search endpoint
      console.log('\n3. Testing user search endpoint...');
      try {
        const userSearchResponse = await axios.get(
          `${BASE_URL}/admin/search/users?q=test&page=1&limit=5`,
          { headers }
        );

        console.log('✅ Database-based user search working');
        console.log(
          `User search results: ${userSearchResponse.data.data.total} users found`
        );
      } catch (userSearchError) {
        console.log(
          '❌ User search failed:',
          userSearchError.response?.data || userSearchError.message
        );
      }
    } else {
      console.log('❌ Admin login failed:', loginResponse.data.message);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testSearch();
