require('dotenv').config();

// Mock the logger and database for testing
const mockLogger = {
  info: console.log,
  warn: console.warn,
  error: console.error,
};

// Import the function we want to test
async function testReferenceNotification() {
  // We'll simulate the function logic here since we can't easily import from TypeScript
  const whatsappApiUrl = process.env.WHATSAPP_API_URL;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!whatsappApiUrl || !accessToken || !phoneNumberId) {
    console.log('❌ WhatsApp configuration missing');
    return false;
  }

  // Format contact (add +91 prefix if not present)
  function formatContactForWhatsApp(contact) {
    if (contact.startsWith('+')) return contact;
    if (contact.startsWith('91')) return '+' + contact;
    return '+91' + contact;
  }

  const referenceContact = '916281173260';
  const referenceName = 'Test Reference';
  const voterName = 'Test Voter';
  const voterContact = '919876543210';

  const formattedContact = formatContactForWhatsApp(referenceContact);

  // Create WhatsApp message payload - using hello_world template
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

  try {
    console.log('Sending reference notification...');
    console.log('To:', formattedContact);
    console.log('Reference:', referenceName);
    console.log('Voter:', voterName);

    const response = await fetch(
      `${whatsappApiUrl}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messagePayload),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ WhatsApp API error:', errorData);
      return false;
    }

    const responseData = await response.json();
    console.log('✅ Reference notification sent successfully!');
    console.log('Message ID:', responseData.messages?.[0]?.id);
    return true;
  } catch (error) {
    console.error('❌ Error sending reference notification:', error.message);
    return false;
  }
}

testReferenceNotification();
