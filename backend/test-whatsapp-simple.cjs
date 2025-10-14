#!/usr/bin/env node

/**
 * Simple WhatsApp API Test - Matches the reference curl command
 */

const dotenv = require('dotenv');
dotenv.config();

const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

console.log('🔍 Simple WhatsApp API Test\n');

async function testBasicAPI() {
  console.log('📋 Configuration:');
  console.log(`Phone Number ID: ${WHATSAPP_PHONE_NUMBER_ID}`);
  console.log(
    `Access Token: ${WHATSAPP_ACCESS_TOKEN ? 'Set (length: ' + WHATSAPP_ACCESS_TOKEN.length + ')' : 'Missing'}\n`
  );

  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.error('❌ Missing required configuration');
    return;
  }

  console.log('🔍 Testing message API endpoint...');

  try {
    // Test payload - using invalid phone number to avoid sending actual messages
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

    const responseText = await response.text();

    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Response: ${responseText}\n`);

    if (response.status === 400 && responseText.includes('phone')) {
      console.log(
        '✅ API endpoint is working (phone number validation error expected)'
      );
    } else if (response.ok) {
      console.log('✅ API endpoint is working');
    } else {
      console.log('❌ API endpoint failed');
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

// Test with a valid phone number if provided as argument
async function testWithValidNumber(phoneNumber) {
  console.log(`\n🔍 Testing with valid phone number: ${phoneNumber}`);

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

    const responseText = await response.text();

    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Response: ${responseText}`);

    if (response.ok) {
      console.log('✅ Message sent successfully!');
    } else {
      console.log('❌ Message sending failed');
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

// Run the test
testBasicAPI()
  .then(() => {
    const phoneNumber = process.argv[2];
    if (phoneNumber) {
      return testWithValidNumber(phoneNumber);
    } else {
      console.log('\n💡 To test with a real phone number, run:');
      console.log('   node test-whatsapp-simple.cjs +1234567890');
    }
  })
  .catch(console.error);
