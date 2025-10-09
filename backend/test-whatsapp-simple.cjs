require('dotenv').config();

async function testWhatsApp() {
  const whatsappApiUrl = process.env.WHATSAPP_API_URL;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  console.log('Testing WhatsApp API...');
  console.log('API URL:', whatsappApiUrl);
  console.log('Phone Number ID:', phoneNumberId);
  console.log('Token (first 20 chars):', accessToken?.substring(0, 20) + '...');

  const messagePayload = {
    messaging_product: 'whatsapp',
    to: '916281173260', // Same number from your working curl
    type: 'template',
    template: {
      name: 'hello_world',
      language: {
        code: 'en_US',
      },
    },
  };

  try {
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

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));

    const responseData = await response.text();
    console.log('Response body:', responseData);

    if (response.ok) {
      console.log('✅ WhatsApp message sent successfully!');
    } else {
      console.log('❌ WhatsApp API error');
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testWhatsApp();
