#!/usr/bin/env node

/**
 * WhatsApp Templates Check Script
 * Checks available message templates for the WhatsApp Business Account
 */

const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

console.log('📋 WhatsApp Templates Check\n');

// Get WhatsApp Business Account ID from the access token
async function getBusinessAccountId() {
  console.log('🔍 Getting WhatsApp Business Account ID...');

  try {
    const response = await fetch(
      `https://graph.facebook.com/v22.0/me?fields=whatsapp_business_accounts&access_token=${WHATSAPP_ACCESS_TOKEN}`,
      {
        method: 'GET',
      }
    );

    if (response.ok) {
      const data = await response.json();
      const accountId = data.whatsapp_business_accounts?.data?.[0]?.id;

      if (accountId) {
        console.log('✅ WhatsApp Business Account ID found:', accountId);
        return accountId;
      } else {
        console.log('❌ No WhatsApp Business Account found');
        return null;
      }
    } else {
      const errorData = await response.text();
      console.log('❌ Failed to get Business Account ID');
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Error: ${errorData}`);
      return null;
    }
  } catch (error) {
    console.log('❌ Error getting Business Account ID');
    console.log(`   Error: ${error.message}`);
    return null;
  }
}

// Check available message templates
async function checkMessageTemplates(businessAccountId) {
  console.log('\n🔍 Checking available message templates...');

  try {
    const response = await fetch(
      `https://graph.facebook.com/v22.0/${businessAccountId}/message_templates?access_token=${WHATSAPP_ACCESS_TOKEN}`,
      {
        method: 'GET',
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Message templates retrieved');
      console.log(`   Templates found: ${data.data?.length || 0}`);

      if (data.data && data.data.length > 0) {
        console.log('\n📋 Available templates:');
        data.data.forEach((template, index) => {
          console.log(`   ${index + 1}. ${template.name}`);
          console.log(`      Status: ${template.status}`);
          console.log(`      Category: ${template.category}`);
          console.log(`      Language: ${template.language}`);
          if (template.components) {
            console.log(`      Components: ${template.components.length}`);
          }
          console.log('');
        });

        // Check if our required template exists
        const requiredTemplate = data.data.find(
          t => t.name === 'voter_reference_notification'
        );
        if (requiredTemplate) {
          console.log(
            '✅ Required template "voter_reference_notification" found!'
          );
          console.log(`   Status: ${requiredTemplate.status}`);
        } else {
          console.log(
            '❌ Required template "voter_reference_notification" not found'
          );
          console.log(
            '   You need to create this template in your WhatsApp Business Manager'
          );
        }
      } else {
        console.log(
          '\n⚠️  No templates found. You need to create message templates in WhatsApp Business Manager.'
        );
      }

      return true;
    } else {
      const errorData = await response.text();
      console.log('❌ Message templates check failed');
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Error: ${errorData}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Message templates check error');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function runTemplateCheck() {
  const businessAccountId = await getBusinessAccountId();

  if (businessAccountId) {
    await checkMessageTemplates(businessAccountId);
  } else {
    console.log('\n❌ Cannot check templates without Business Account ID');
  }

  console.log('\n💡 Next Steps:');
  console.log(
    '   1. If no templates exist, create them in WhatsApp Business Manager'
  );
  console.log('   2. Create a template named "voter_reference_notification"');
  console.log(
    '   3. The template should include parameters for reference name, voter name, and contact'
  );
  console.log('   4. Wait for template approval before using it');
}

// Run the check
runTemplateCheck().catch(console.error);
