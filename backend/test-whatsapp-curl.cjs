#!/usr/bin/env node

/**
 * WhatsApp API Test using curl commands
 * This bypasses Node.js fetch issues by using system curl
 */

const dotenv = require('dotenv');
const { execSync } = require('child_process');

dotenv.config();

const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

console.log('🔍 WhatsApp API Test using curl\n');

console.log('📋 Configuration:');
console.log(`Phone Number ID: ${WHATSAPP_PHONE_NUMBER_ID}`);
console.log(
  `Access Token: ${WHATSAPP_ACCESS_TOKEN ? 'Set (length: ' + WHATSAPP_ACCESS_TOKEN.length + ')' : 'Missing'}\n`
);

if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
  console.error('❌ Missing required configuration');
  process.exit(1);
}

function runCurlTest(name, command) {
  console.log(`🔍 ${name}...`);
  try {
    const result = execSync(command, { encoding: 'utf8', timeout: 10000 });
    console.log('✅ Success');
    console.log('Response:', result);
    return true;
  } catch (error) {
    console.log('❌ Failed');
    console.log('Error:', error.message);
    if (error.stdout) console.log('Stdout:', error.stdout);
    if (error.stderr) console.log('Stderr:', error.stderr);
    return false;
  }
}

// Test 1: Check access token
const test1 = runCurlTest(
  'Test 1: Access Token Validation',
  `curl -s "https://graph.facebook.com/v22.0/me?access_token=${WHATSAPP_ACCESS_TOKEN}"`
);

console.log('\n' + '='.repeat(50) + '\n');

// Test 2: Check phone number info
const test2 = runCurlTest(
  'Test 2: Phone Number Info',
  `curl -s -H "Authorization: Bearer ${WHATSAPP_ACCESS_TOKEN}" "https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_NUMBER_ID}"`
);

console.log('\n' + '='.repeat(50) + '\n');

// Test 3: Test message API with invalid number (to avoid sending real messages)
const test3 = runCurlTest(
  'Test 3: Message API Test',
  `curl -s -X POST "https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_NUMBER_ID}/messages" ` +
    `-H "Authorization: Bearer ${WHATSAPP_ACCESS_TOKEN}" ` +
    `-H "Content-Type: application/json" ` +
    `-d '{"messaging_product":"whatsapp","to":"1234567890","type":"template","template":{"name":"hello_world","language":{"code":"en_US"}}}'`
);

console.log('\n' + '='.repeat(50) + '\n');

const passed = [test1, test2, test3].filter(Boolean).length;
const total = 3;

console.log('📊 Test Results Summary:');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${total - passed}`);

if (passed === total) {
  console.log('\n🎉 All tests passed! WhatsApp API is working correctly.');
} else {
  console.log(
    '\n⚠️  Some tests failed. Check the responses above for details.'
  );
}

// If user provides a phone number as argument, test sending a real message
const phoneNumber = process.argv[2];
if (phoneNumber) {
  console.log('\n' + '='.repeat(50));
  console.log(`\n🚀 Sending test message to ${phoneNumber}...`);

  const realTest = runCurlTest(
    'Real Message Test',
    `curl -s -X POST "https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_NUMBER_ID}/messages" ` +
      `-H "Authorization: Bearer ${WHATSAPP_ACCESS_TOKEN}" ` +
      `-H "Content-Type: application/json" ` +
      `-d '{"messaging_product":"whatsapp","to":"${phoneNumber}","type":"template","template":{"name":"hello_world","language":{"code":"en_US"}}}'`
  );

  if (realTest) {
    console.log('\n✅ Message sent successfully!');
  }
} else {
  console.log('\n💡 To send a test message to a real number, run:');
  console.log(`   node test-whatsapp-curl.cjs +1234567890`);
}
