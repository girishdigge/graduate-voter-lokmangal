#!/usr/bin/env node

require('dotenv').config();
const { execSync } = require('child_process');

/**
 * Debug WhatsApp Reference Service Issue using curl
 */

const whatsappApiUrl = process.env.WHATSAPP_API_URL;
const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

console.log('🔍 Debugging WhatsApp Reference Service Issue with curl\n');

// Replicate the reference service logic exactly
function cleanContactNumber(contact) {
  let cleanContact = contact.replace(/[\s\-\+]/g, '');

  // If it starts with 91 (India country code), remove it
  if (cleanContact.startsWith('91') && cleanContact.length === 12) {
    cleanContact = cleanContact.substring(2);
  }

  return cleanContact;
}

function formatContactForWhatsApp(contact) {
  const cleanContact = cleanContactNumber(contact);
  return `91${cleanContact}`;
}

function testReferenceServiceWithCurl() {
  const referenceContact = '916281173260';

  console.log('🧪 Testing Reference Service Logic:');
  console.log(`Original contact: ${referenceContact}`);

  const cleanedContact = cleanContactNumber(referenceContact);
  console.log(`Cleaned contact: ${cleanedContact}`);

  const formattedContact = formatContactForWhatsApp(referenceContact);
  console.log(`Formatted contact: ${formattedContact}`);

  // Create the exact message payload from reference service
  const messagePayload = {
    messaging_product: 'whatsapp',
    to: formattedContact,
    type: 'template',
    template: {
      name: 'hello_world',
      language: {
        code: 'en_US',
      },
    },
  };

  console.log('\n📤 Message Payload:');
  console.log(JSON.stringify(messagePayload, null, 2));

  const url = `${whatsappApiUrl}/${phoneNumberId}/messages`;
  console.log(`\n🌐 Request URL: ${url}`);

  // Use curl to test
  const curlCommand =
    `curl -s -X POST "${url}" ` +
    `-H "Authorization: Bearer ${accessToken}" ` +
    `-H "Content-Type: application/json" ` +
    `-d '${JSON.stringify(messagePayload)}'`;

  console.log('\n🚀 Testing with curl...');

  try {
    const result = execSync(curlCommand, { encoding: 'utf8', timeout: 10000 });
    console.log('✅ Success Response:');
    console.log(result);
    return true;
  } catch (error) {
    console.log('❌ Failed');
    console.log('Error:', error.message);
    if (error.stdout) console.log('Stdout:', error.stdout);
    if (error.stderr) console.log('Stderr:', error.stderr);
    return false;
  }
}

testReferenceServiceWithCurl();
