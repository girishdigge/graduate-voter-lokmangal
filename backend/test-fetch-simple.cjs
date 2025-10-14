#!/usr/bin/env node

require('dotenv').config();

async function testSimpleFetch() {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  console.log('Testing simple fetch to WhatsApp API...');

  try {
    // Test 1: Simple GET request to validate token
    console.log('\n1. Testing token validation...');
    const response1 = await fetch(
      `https://graph.facebook.com/v22.0/me?access_token=${accessToken}`
    );
    console.log(`Status: ${response1.status} ${response1.statusText}`);

    if (response1.ok) {
      const data1 = await response1.json();
      console.log('✅ Token validation successful:', data1);
    } else {
      const error1 = await response1.text();
      console.log('❌ Token validation failed:', error1);
    }

    // Test 2: Phone number info
    console.log('\n2. Testing phone number info...');
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const response2 = await fetch(
      `https://graph.facebook.com/v22.0/${phoneNumberId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    console.log(`Status: ${response2.status} ${response2.statusText}`);

    if (response2.ok) {
      const data2 = await response2.json();
      console.log('✅ Phone info successful:', data2);
    } else {
      const error2 = await response2.text();
      console.log('❌ Phone info failed:', error2);
    }

    // Test 3: Message API with simple payload
    console.log('\n3. Testing message API...');
    const messagePayload = {
      messaging_product: 'whatsapp',
      to: '916281173260',
      type: 'template',
      template: {
        name: 'hello_world',
        language: {
          code: 'en_US',
        },
      },
    };

    const response3 = await fetch(
      `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messagePayload),
      }
    );

    console.log(`Status: ${response3.status} ${response3.statusText}`);

    if (response3.ok) {
      const data3 = await response3.json();
      console.log('✅ Message API successful:', data3);
    } else {
      const error3 = await response3.text();
      console.log('❌ Message API failed:', error3);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
    console.error('Error details:', error);
  }
}

testSimpleFetch();
