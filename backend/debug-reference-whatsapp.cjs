#!/usr/bin/env node

require('dotenv').config();

/**
 * Debug WhatsApp Reference Service Issue
 */

const whatsappApiUrl = process.env.WHATSAPP_API_URL;
const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

console.log('🔍 Debugging WhatsApp Reference Service Issue\n');

console.log('📋 Configuration:');
console.log(`API URL: ${whatsappApiUrl}`);
console.log(`Phone Number ID: ${phoneNumberId}`);
console.log(
  `Access Token: ${accessToken ? 'Set (length: ' + accessToken.length + ')' : 'Missing'}\n`
);

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

async function testReferenceServiceLogic() {
  const referenceContact = '916281173260';
  const referenceName = 'Test Reference';
  const voterName = 'Test Voter';
  const voterContact = '919876543210';

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

  try {
    console.log('\n🚀 Sending WhatsApp message...');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messagePayload),
    });

    console.log(
      `📊 Response Status: ${response.status} ${response.statusText}`
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.log('❌ Error Response:');
      console.log(errorData);

      try {
        const errorJson = JSON.parse(errorData);
        console.log('\n🔍 Parsed Error:');
        console.log(JSON.stringify(errorJson, null, 2));
      } catch (e) {
        console.log('Could not parse error as JSON');
      }

      return false;
    }

    const responseData = await response.json();
    console.log('✅ Success Response:');
    console.log(JSON.stringify(responseData, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Network Error:', error.message);
    return false;
  }
}

testReferenceServiceLogic();
