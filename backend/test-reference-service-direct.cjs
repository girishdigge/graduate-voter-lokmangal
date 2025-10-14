#!/usr/bin/env node

require('dotenv').config();

/**
 * Test the reference service WhatsApp function directly
 */

async function testReferenceServiceDirect() {
  console.log('🔍 Testing Reference Service WhatsApp Function Directly\n');

  // Import the function (we'll simulate it since we can't easily import TypeScript)
  const whatsappApiUrl = process.env.WHATSAPP_API_URL;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!whatsappApiUrl || !accessToken || !phoneNumberId) {
    console.log('❌ WhatsApp configuration missing');
    return false;
  }

  // Replicate the exact reference service logic
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

  async function sendWhatsAppNotification(
    referenceContact,
    referenceName,
    voterName,
    voterContact
  ) {
    try {
      const formattedContact = formatContactForWhatsApp(referenceContact);

      console.log('📋 WhatsApp Notification Details:');
      console.log(`Reference Contact: ${referenceContact}`);
      console.log(`Formatted Contact: ${formattedContact}`);
      console.log(`Reference Name: ${referenceName}`);
      console.log(`Voter Name: ${voterName}`);
      console.log(`Voter Contact: ${voterContact}`);

      // Create WhatsApp message payload - using hello_world template for testing
      const messagePayload = {
        messaging_product: 'whatsapp',
        to: formattedContact,
        type: 'template',
        template: {
          name: 'hello_world', // Using standard template that works
          language: {
            code: 'en_US',
          },
        },
      };

      console.log('\n📤 Message Payload:');
      console.log(JSON.stringify(messagePayload, null, 2));

      const url = `${whatsappApiUrl}/${phoneNumberId}/messages`;
      console.log(`\n🌐 Request URL: ${url}`);

      // Send WhatsApp message
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messagePayload),
      });

      console.log(
        `\n📊 Response Status: ${response.status} ${response.statusText}`
      );

      if (!response.ok) {
        const errorData = await response.text();
        let errorDetails;

        try {
          errorDetails = JSON.parse(errorData);
        } catch (e) {
          errorDetails = { error: { message: errorData } };
        }

        console.log('❌ WhatsApp API Error:');
        console.log(JSON.stringify(errorDetails, null, 2));

        // Log specific error types for better debugging
        if (errorDetails.error?.code === 190) {
          console.log(
            '\n🔍 Error Analysis: WhatsApp access token expired or invalid'
          );
        } else if (errorDetails.error?.code === 2500) {
          console.log(
            '\n🔍 Error Analysis: WhatsApp API URL or phone number ID issue'
          );
        } else if (errorDetails.error?.code === 132) {
          console.log('\n🔍 Error Analysis: Template message issue');
        }

        return false;
      }

      const responseData = await response.json();
      console.log('\n✅ WhatsApp notification sent successfully!');
      console.log('Response:', JSON.stringify(responseData, null, 2));

      return true;
    } catch (error) {
      console.error('\n❌ Error sending WhatsApp notification:', error.message);
      return false;
    }
  }

  // Test with the same data that would be used in the reference service
  const result = await sendWhatsAppNotification(
    '916281173260',
    'Test Reference',
    'Test Voter',
    '919876543210'
  );

  if (result) {
    console.log(
      '\n🎉 Reference service WhatsApp function is working correctly!'
    );
  } else {
    console.log('\n❌ Reference service WhatsApp function failed');
  }

  return result;
}

testReferenceServiceDirect();
