#!/usr/bin/env node

/**
 * WhatsApp Message Test Script
 * Tests sending a simple text message via WhatsApp Business API
 */

const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

console.log('📱 WhatsApp Message Test\n');

// Test sending a simple text message (to a test number)
async function testSimpleMessage() {
  console.log('🔍 Testing simple text message...');

  // Use a test number - this should be your own number for testing
  const testNumber = '919999999999'; // Replace with your test number

  const messagePayload = {
    messaging_product: 'whatsapp',
    to: testNumber,
    type: 'text',
    text: {
      body: 'Hello! This is a test message from your WhatsApp Business API.',
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
      console.log('✅ Message sent successfully!');
      console.log(`   Message ID: ${data.messages?.[0]?.id || 'N/A'}`);
      console.log(
        `   WhatsApp ID: ${data.messages?.[0]?.message_status || 'N/A'}`
      );
      return true;
    } else {
      const errorData = await response.text();
      console.log('❌ Message sending failed');
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Error: ${errorData}`);

      // Parse error for better understanding
      try {
        const errorJson = JSON.parse(errorData);
        if (errorJson.error) {
          console.log(`   Error Code: ${errorJson.error.code}`);
          console.log(`   Error Type: ${errorJson.error.type}`);
          console.log(`   Error Message: ${errorJson.error.message}`);
        }
      } catch (e) {
        // Error data is not JSON
      }

      return false;
    }
  } catch (error) {
    console.log('❌ Message sending error');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Test the template message format used in the application
async function testTemplateMessage() {
  console.log('\n🔍 Testing template message format...');

  const testNumber = '919999999999'; // Replace with your test number

  const messagePayload = {
    messaging_product: 'whatsapp',
    to: testNumber,
    type: 'template',
    template: {
      name: 'hello_world', // This is a default template available in WhatsApp Business
      language: {
        code: 'en_US',
      },
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
      console.log('❌ Template message sending failed');
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Error: ${errorData}`);

      // Parse error for better understanding
      try {
        const errorJson = JSON.parse(errorData);
        if (errorJson.error) {
          console.log(`   Error Code: ${errorJson.error.code}`);
          console.log(`   Error Type: ${errorJson.error.type}`);
          console.log(`   Error Message: ${errorJson.error.message}`);
        }
      } catch (e) {
        // Error data is not JSON
      }

      return false;
    }
  } catch (error) {
    console.log('❌ Template message sending error');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function runMessageTests() {
  console.log('⚠️  Note: These tests will attempt to send actual messages.');
  console.log('   Make sure to update the test number to your own number!\n');

  const results = [];

  results.push(await testSimpleMessage());
  results.push(await testTemplateMessage());

  console.log('\n📊 Message Test Results:');
  console.log(`✅ Passed: ${results.filter(r => r).length}`);
  console.log(`❌ Failed: ${results.filter(r => !r).length}`);

  if (results.some(r => r)) {
    console.log(
      '\n🎉 At least one message type works! Your WhatsApp API is functional.'
    );
  } else {
    console.log(
      '\n⚠️  All message tests failed. Check the errors above for details.'
    );
  }
}

// Run the tests
runMessageTests().catch(console.error);
