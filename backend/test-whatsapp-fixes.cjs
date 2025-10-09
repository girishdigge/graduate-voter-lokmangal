#!/usr/bin/env node

/**
 * WhatsApp Fixes Test Script
 * Tests the improved WhatsApp implementation with fallback mechanisms
 */

const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

console.log('🔧 WhatsApp Fixes Test\n');

// Test the improved error handling
async function testImprovedErrorHandling() {
  console.log('🔍 Testing improved error handling...');

  // Test with an invalid template to trigger fallback
  const testNumber = '919999999999'; // Replace with your test number

  const messagePayload = {
    messaging_product: 'whatsapp',
    to: testNumber,
    type: 'template',
    template: {
      name: 'voter_reference_notification', // This template likely doesn't exist
      language: {
        code: 'en_US',
      },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: 'John Doe' },
            { type: 'text', text: 'Jane Smith' },
            { type: 'text', text: '9876543210' },
          ],
        },
      ],
    },
  };

  try {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messagePayload),
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Template message sent successfully!');
      console.log(`   Message ID: ${data.messages?.[0]?.id || 'N/A'}`);
      return true;
    } else {
      const errorData = await response.text();
      console.log('❌ Template message failed (expected)');
      console.log(`   Status: ${response.status} ${response.statusText}`);

      // Parse and analyze the error
      try {
        const errorJson = JSON.parse(errorData);
        if (errorJson.error) {
          console.log(`   Error Code: ${errorJson.error.code}`);
          console.log(`   Error Type: ${errorJson.error.type}`);
          console.log(`   Error Message: ${errorJson.error.message}`);

          // Check if this would trigger our fallback
          if (
            errorJson.error.code === 132 ||
            errorJson.error.message.includes('template')
          ) {
            console.log('✅ This error would trigger fallback to text message');
            return await testFallbackTextMessage(testNumber);
          }
        }
      } catch (e) {
        console.log('   Could not parse error JSON');
      }

      return false;
    }
  } catch (error) {
    console.log('❌ Template message test error');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Test fallback text message
async function testFallbackTextMessage(testNumber) {
  console.log('\n🔄 Testing fallback text message...');

  const messagePayload = {
    messaging_product: 'whatsapp',
    to: testNumber,
    type: 'text',
    text: {
      body: 'Hello John Doe, You have been added as a reference by Jane Smith (Contact: 9876543210) for voter registration. Please verify this information and respond if you have any concerns. Thank you.',
    },
  };

  try {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messagePayload),
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Fallback text message sent successfully!');
      console.log(`   Message ID: ${data.messages?.[0]?.id || 'N/A'}`);
      return true;
    } else {
      const errorData = await response.text();
      console.log('❌ Fallback text message failed');
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Error: ${errorData}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Fallback text message error');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function runFixesTest() {
  console.log('⚠️  Note: This test will attempt to send actual messages.');
  console.log('   Make sure to update the test number to your own number!\n');

  const result = await testImprovedErrorHandling();

  console.log('\n📊 Fixes Test Results:');
  if (result) {
    console.log(
      '✅ WhatsApp messaging is working (either template or fallback)'
    );
  } else {
    console.log('❌ WhatsApp messaging failed completely');
    console.log('\n🔧 Troubleshooting steps:');
    console.log(
      '   1. Check if access token is valid and has proper permissions'
    );
    console.log('   2. Verify phone number ID is correct');
    console.log('   3. Ensure the test number is in the correct format');
    console.log('   4. Check WhatsApp Business API quotas and limits');
  }
}

// Run the test
runFixesTest().catch(console.error);
