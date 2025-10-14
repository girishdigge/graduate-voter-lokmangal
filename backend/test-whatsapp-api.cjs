#!/usr/bin/env node

/**
 * WhatsApp API Test Script
 * Tests the WhatsApp Business API configuration and connectivity
 */

const dotenv = require('dotenv');

// Try to use built-in fetch, fallback to node-fetch
let fetch;
try {
  fetch = globalThis.fetch;
  if (!fetch) {
    fetch = require('node-fetch');
  }
} catch (error) {
  console.error(
    '❌ Unable to load fetch. Please install node-fetch: npm install node-fetch'
  );
  process.exit(1);
}

// Load environment variables
dotenv.config();

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

console.log('🔍 WhatsApp API Configuration Test\n');

// Check environment variables
console.log('📋 Configuration Check:');
console.log(`API URL: ${WHATSAPP_API_URL ? '✅ Set' : '❌ Missing'}`);
console.log(
  `Access Token: ${WHATSAPP_ACCESS_TOKEN ? '✅ Set (length: ' + WHATSAPP_ACCESS_TOKEN.length + ')' : '❌ Missing'}`
);
console.log(
  `Phone Number ID: ${WHATSAPP_PHONE_NUMBER_ID ? '✅ Set' : '❌ Missing'}\n`
);

if (!WHATSAPP_API_URL || !WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
  console.error('❌ Missing required WhatsApp configuration');
  process.exit(1);
}

// Test 1: Verify Phone Number ID
async function testPhoneNumberId() {
  console.log('🔍 Test 1: Verifying Phone Number ID...');

  try {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Phone Number ID is valid');
      console.log(`   Display Name: ${data.display_phone_number || 'N/A'}`);
      console.log(`   Verified Name: ${data.verified_name || 'N/A'}`);
      return true;
    } else {
      const errorData = await response.text();
      console.log('❌ Phone Number ID verification failed');
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Error: ${errorData}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Phone Number ID verification error');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Test 2: Check Access Token Validity
async function testAccessToken() {
  console.log('\n🔍 Test 2: Checking Access Token...');

  try {
    const response = await fetch(
      `https://graph.facebook.com/v22.0/me?access_token=${WHATSAPP_ACCESS_TOKEN}`,
      {
        method: 'GET',
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Access Token is valid');
      console.log(`   App ID: ${data.id || 'N/A'}`);
      return true;
    } else {
      const errorData = await response.text();
      console.log('❌ Access Token validation failed');
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Error: ${errorData}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Access Token validation error');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Test 3: Check Message Templates (using WhatsApp Business Account ID)
async function testMessageTemplates() {
  console.log('\n🔍 Test 3: Checking Message Templates...');

  try {
    // First, get the WhatsApp Business Account ID from the phone number
    const phoneResponse = await fetch(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}?fields=whatsapp_business_account_id`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!phoneResponse.ok) {
      const errorData = await phoneResponse.text();
      console.log('❌ Failed to get WhatsApp Business Account ID');
      console.log(
        `   Status: ${phoneResponse.status} ${phoneResponse.statusText}`
      );
      console.log(`   Error: ${errorData}`);
      return false;
    }

    const phoneData = await phoneResponse.json();
    const wabId = phoneData.whatsapp_business_account_id;

    if (!wabId) {
      console.log('❌ WhatsApp Business Account ID not found');
      return false;
    }

    console.log(`   WhatsApp Business Account ID: ${wabId}`);

    // Now get message templates using the correct endpoint
    const response = await fetch(
      `${WHATSAPP_API_URL}/${wabId}/message_templates`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Message templates retrieved');
      console.log(`   Templates found: ${data.data?.length || 0}`);

      if (data.data && data.data.length > 0) {
        console.log('   Available templates:');
        data.data.forEach(template => {
          console.log(`   - ${template.name} (${template.status})`);
        });
      }
      return true;
    } else {
      const errorData = await response.text();
      console.log('❌ Message templates check failed');
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Error: ${errorData}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Message templates check error');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Test 4: Test sending a message (dry run - validates API structure)
async function testMessageSending() {
  console.log('\n🔍 Test 4: Testing Message API Structure...');

  try {
    // Test with an invalid phone number to check API structure without actually sending
    const testPayload = {
      messaging_product: 'whatsapp',
      to: '1234567890', // Invalid number for testing
      type: 'template',
      template: {
        name: 'hello_world',
        language: {
          code: 'en_US',
        },
      },
    };

    const response = await fetch(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
      }
    );

    const responseData = await response.text();

    if (response.status === 400) {
      // Check if it's a phone number validation error (expected)
      if (
        responseData.includes('phone number') ||
        responseData.includes('recipient')
      ) {
        console.log('✅ Message API structure is valid');
        console.log('   (Phone number validation error is expected for test)');
        return true;
      }
    }

    if (response.ok) {
      console.log('✅ Message API is working');
      console.log('   Response:', responseData);
      return true;
    } else {
      console.log('❌ Message API test failed');
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Error: ${responseData}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Message API test error');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Run all tests
async function runTests() {
  const results = [];

  results.push(await testAccessToken());
  results.push(await testPhoneNumberId());
  results.push(await testMessageTemplates());
  results.push(await testMessageSending());

  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${results.filter(r => r).length}`);
  console.log(`❌ Failed: ${results.filter(r => !r).length}`);

  if (results.every(r => r)) {
    console.log('\n🎉 All tests passed! WhatsApp API is properly configured.');
  } else {
    console.log(
      '\n⚠️  Some tests failed. Please check the configuration and errors above.'
    );
    console.log('\n🔧 Common fixes:');
    console.log('   1. Ensure your access token is valid and not expired');
    console.log('   2. Verify the phone number ID is correct');
    console.log(
      '   3. Check that your WhatsApp Business account is properly set up'
    );
    console.log(
      '   4. Ensure you have the necessary permissions for the WhatsApp Business API'
    );
    console.log('   5. Check your network connection and firewall settings');
  }
}

// Run the tests
runTests().catch(console.error);
