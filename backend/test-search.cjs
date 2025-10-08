const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testSearch() {
  try {
    console.log('Testing Database-based Search functionality...\n');

    // Test health endpoint first
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/../health`);
    console.log('✅ Health check:', healthResponse.data.status);

    // Test admin login
    console.log('\n2. Admin Login...');
    const loginResponse = await axios.post(`${BASE_URL}/admin/login`, {
      username: 'admin',
      password: 'admin123',
    });

    if (loginResponse.data.success) {
      console.log('✅ Admin login successful');
      const token = loginResponse.data.data.token;
      const headers = { Authorization: `Bearer ${token}` };

      // Test reference search endpoint
      console.log('\n3. Testing reference search endpoint...');
      const searchResponse = await axios.get(
        `${BASE_URL}/admin/search/references?q=test&page=1&limit=5`,
        { headers }
      );

      if (searchResponse.data.success) {
        console.log('✅ Database-based reference search working');
        console.log(
          `Search results: ${searchResponse.data.data.total} references found`
        );
        console.log(
          'Sample data:',
          JSON.stringify(searchResponse.data.data.data.slice(0, 2), null, 2)
        );
      } else {
        console.log('❌ Reference search failed:', searchResponse.data.message);
      }

      // Test user search endpoint
      console.log('\n4. Testing user search endpoint...');
      const userSearchResponse = await axios.get(
        `${BASE_URL}/admin/search/users?q=test&page=1&limit=5`,
        { headers }
      );

      if (userSearchResponse.data.success) {
        console.log('✅ Database-based user search working');
        console.log(
          `User search results: ${userSearchResponse.data.data.total} users found`
        );
      } else {
        console.log('❌ User search failed:', userSearchResponse.data.message);
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
