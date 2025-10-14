#!/usr/bin/env node

/**
 * Quick WhatsApp Token Test
 * Use this to test a new access token before updating .env
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function testNewToken() {
  console.log('🔧 WhatsApp Token Tester\n');

  rl.question('Enter your new WhatsApp access token: ', async newToken => {
    rl.question('Enter your phone number ID: ', async phoneNumberId => {
      console.log('\n🔍 Testing new token...');

      try {
        // Test access token validity
        const tokenResponse = await fetch(
          `https://graph.facebook.com/v22.0/me?access_token=${newToken}`
        );

        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
          console.log('✅ Access token is valid');
          console.log(`   App ID: ${tokenData.id}`);

          // Test phone number ID
          const phoneResponse = await fetch(
            `https://graph.facebook.com/v22.0/${phoneNumberId}`,
            {
              headers: {
                Authorization: `Bearer ${newToken}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (phoneResponse.ok) {
            const phoneData = await phoneResponse.json();
            console.log('✅ Phone number ID is valid');
            console.log(
              `   Display Name: ${phoneData.display_phone_number || 'N/A'}`
            );
            console.log(
              `   Verified Name: ${phoneData.verified_name || 'N/A'}`
            );

            console.log('\n🎉 Configuration looks good!');
            console.log('\nUpdate your .env file with:');
            console.log(`WHATSAPP_ACCESS_TOKEN="${newToken}"`);
            console.log(`WHATSAPP_PHONE_NUMBER_ID="${phoneNumberId}"`);
          } else {
            const phoneError = await phoneResponse.text();
            console.log('❌ Phone number ID is invalid');
            console.log(`   Error: ${phoneError}`);
          }
        } else {
          const tokenError = await tokenResponse.text();
          console.log('❌ Access token is invalid');
          console.log(`   Error: ${tokenError}`);
        }
      } catch (error) {
        console.log('❌ Test failed');
        console.log(`   Error: ${error.message}`);
      }

      rl.close();
    });
  });
}

testNewToken();
