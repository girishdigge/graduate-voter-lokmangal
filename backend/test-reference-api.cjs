#!/usr/bin/env node

const axios = require('axios');

/**
 * Test the reference API endpoint to see if WhatsApp is working
 */

const BASE_URL = 'http://localhost:3000/api';

async function testReferenceAPI() {
  try {
    console.log('🔍 Testing Reference API with WhatsApp integration\n');

    // First, login as a user to get token
    console.log('1. Logging in as user...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      contact: '6281173260',
      password: 'Test@123',
    });

    if (loginResponse.data.success) {
      console.log('✅ User login successful');
      const token = loginResponse.data.data.token;
      const userId = loginResponse.data.data.user.id;
      const headers = { Authorization: `Bearer ${token}` };

      // Test adding a reference
      console.log('\n2. Adding a reference...');
      const referenceData = {
        references: [
          {
            referenceName: 'Test Reference WhatsApp',
            referenceContact: '9876543210',
          },
        ],
      };

      const addResponse = await axios.post(
        `${BASE_URL}/references/${userId}`,
        referenceData,
        { headers }
      );

      if (addResponse.data.success) {
        console.log('✅ Reference added successfully');
        console.log('WhatsApp Results:', addResponse.data.data.whatsappResults);

        // Check if WhatsApp was sent
        const whatsappSent = addResponse.data.data.whatsappResults.some(
          r => r.sent
        );
        if (whatsappSent) {
          console.log('✅ WhatsApp notification sent successfully!');
        } else {
          console.log('❌ WhatsApp notification failed');
        }
      } else {
        console.log('❌ Failed to add reference:', addResponse.data.error);
      }
    } else {
      console.log('❌ User login failed:', loginResponse.data.error);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testReferenceAPI();
