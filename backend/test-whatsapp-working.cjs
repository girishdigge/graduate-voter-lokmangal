#!/usr/bin/env node

/**
 * Working WhatsApp API Test
 * Based on successful curl test results
 */

const dotenv = require('dotenv');
dotenv.config();

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

const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

console.log('🔍 WhatsApp API Working Test\n');

console.log('📋 Configuration:');
console.log(`Phone Number ID: ${WHATSAPP_PHONE_NUMBER_ID}`);
console.log(
  `Access Token: ${WHATSAPP_ACCESS_TOKEN ? 'Set (length: ' + WHATSAPP_ACCESS_TOKEN.length + ')' : 'Missing'}\n`
);

if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
  console.error('❌ Missing required configuration');
  process.exit(1);
}

// Test 1: Check Phone Number Info
async function testPhoneNumber() {
  console.log('🔍 Test 1: Phone Number Verification...');

  try {
    const response = await fetch(
      `https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_NUMBER_ID}`,
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
      console.log('✅ Phone Number is valid');
      console.log(`   Display Name: ${data.display_phone_number}`);
      console.log(`   Verified Name: ${data.verified_name}`);
      console.log(`   Quality Rating: ${data.quality_rating}`);
      return true;
    } else {
      const errorData = await response.text();
      console.log('❌ Phone Number verification failed');
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Error: ${errorData}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Phone Number verification error');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Test 2: Test Message API
async function testMessageAPI() {
  console.log('\n🔍 Test 2: Message API Test...');

  try {
    const payload = {
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
      `https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const responseData = await response.text();

    if (responseData.includes('Recipient phone number not in allowed list')) {
      console.log('✅ Message API is working correctly');
      console.log(
        '   (Phone number restriction is expected in development mode)'
      );
      return true;
    } else if (responseData.includes('phone number')) {
      console.log('✅ Message API is working');
      console.log('   (Phone number validation error is expected)');
      return true;
    } else if (response.ok) {
      console.log('✅ Message API is working');
      console.log(`   Response: ${responseData}`);
      return true;
    } else {
      console.log('❌ Message API test failed');
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Response: ${responseData}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Message API test error');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Test 3: Access Token Validation (using app info)
async function testAccessToken() {
  console.log('\n🔍 Test 3: Access Token Validation...');

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
      console.log(`   App Name: ${data.name}`);
      console.log(`   App ID: ${data.id}`);
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

// Run all tests
async function runTests() {
  const results = [];

  results.push(await testPhoneNumber());
  results.push(await testMessageAPI());
  results.push(await testAccessToken());

  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${results.filter(r => r).length}`);
  console.log(`❌ Failed: ${results.filter(r => !r).length}`);

  if (results.every(r => r)) {
    console.log('\n🎉 All tests passed! WhatsApp API is properly configured.');
    console.log('\n📝 Next Steps:');
    console.log(
      '   1. Add phone numbers to your allowed list in Facebook Developer Console'
    );
    console.log('   2. Test sending messages to allowed numbers');
    console.log('   3. Apply for production access when ready');
  } else {
    console.log(
      '\n⚠️  Some tests failed. Check the responses above for details.'
    );
  }

  // If user provides a phone number as argument, test sending a real message
  const phoneNumber = process.argv[2];
  if (phoneNumber) {
    console.log('\n' + '='.repeat(50));
    await testRealMessage(phoneNumber);
  } else {
    console.log('\n💡 To test sending a message to a real number, run:');
    console.log('   node test-whatsapp-working.cjs +1234567890');
  }
}

// Test sending to a real phone number
async function testRealMessage(phoneNumber) {
  console.log(`\n🚀 Testing message to ${phoneNumber}...`);

  try {
    const payload = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'template',
      template: {
        name: 'hello_world',
        language: {
          code: 'en_US',
        },
      },
    };

    const response = await fetch(
      `https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const responseData = await response.text();

    if (response.ok) {
      console.log('✅ Message sent successfully!');
      console.log(`   Response: ${responseData}`);
    } else {
      console.log('❌ Message sending failed');
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Response: ${responseData}`);
    }
  } catch (error) {
    console.log('❌ Message sending error');
    console.log(`   Error: ${error.message}`);
  }
}

// Run the tests
runTests().catch(console.error);
