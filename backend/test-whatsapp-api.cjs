#!/usr/bin/env node

/**
 * WhatsApp API Test Script
 * Tests the WhatsApp Business API configuration and connectivity
 */

const dotenv = require('dotenv');

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

// Test 3: Check Message Templates
async function testMessageTemplates() {
  console.log('\n🔍 Test 3: Checking Message Templates...');

  try {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/message_templates`,
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

// Run all tests
async function runTests() {
  const results = [];

  results.push(await testAccessToken());
  results.push(await testPhoneNumberId());
  results.push(await testMessageTemplates());

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
  }
}

// Run the tests
runTests().catch(console.error);
