#!/usr/bin/env node

require('dotenv').config();

/**
 * Test the duplicate reference handling fix
 */

async function testDuplicateReferenceHandling() {
  console.log('🔍 Testing Duplicate Reference Handling Fix\n');

  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
  const apiUrl = `${baseUrl}/api`;

  // Test data
  const testUserId = 'test-user-id-123';
  const testReferences = [
    {
      referenceName: 'John Doe',
      referenceContact: '9876543210',
    },
    {
      referenceName: 'Jane Smith',
      referenceContact: '9876543211',
    },
  ];

  try {
    console.log('📋 Test Scenario: Adding references for the first time');

    // First attempt - should succeed and add both references
    const firstResponse = await fetch(`${apiUrl}/references/${testUserId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        references: testReferences,
      }),
    });

    console.log(
      `\n📊 First Request Status: ${firstResponse.status} ${firstResponse.statusText}`
    );

    if (firstResponse.ok) {
      const firstData = await firstResponse.json();
      console.log('✅ First request successful:');
      console.log(
        `   - New references added: ${firstData.data.newReferencesAdded || firstData.data.references.length}`
      );
      console.log(
        `   - Duplicates skipped: ${firstData.data.duplicatesSkipped || 0}`
      );
      console.log(`   - Message: ${firstData.data.message}`);
      console.log(
        `   - WhatsApp sent: ${firstData.data.whatsappResults.filter(r => r.sent).length}`
      );
    } else {
      const errorData = await firstResponse.text();
      console.log('❌ First request failed:', errorData);
    }

    console.log(
      '\n📋 Test Scenario: Adding same references again (should handle duplicates gracefully)'
    );

    // Second attempt - should handle duplicates gracefully
    const secondResponse = await fetch(`${apiUrl}/references/${testUserId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        references: testReferences,
      }),
    });

    console.log(
      `\n📊 Second Request Status: ${secondResponse.status} ${secondResponse.statusText}`
    );

    if (secondResponse.ok) {
      const secondData = await secondResponse.json();
      console.log(
        '✅ Second request successful (duplicates handled gracefully):'
      );
      console.log(
        `   - New references added: ${secondData.data.newReferencesAdded || 0}`
      );
      console.log(
        `   - Duplicates skipped: ${secondData.data.duplicatesSkipped || 0}`
      );
      console.log(`   - Message: ${secondData.data.message}`);
      console.log(
        `   - WhatsApp sent: ${secondData.data.whatsappResults.filter(r => r.sent).length}`
      );
    } else {
      const errorData = await secondResponse.text();
      console.log('❌ Second request failed:', errorData);

      // This should NOT happen with the fix
      if (secondResponse.status === 409) {
        console.log(
          '🚨 ISSUE: Still getting 409 conflict error - fix may not be working'
        );
      }
    }

    console.log(
      '\n📋 Test Scenario: Adding mix of new and duplicate references'
    );

    const mixedReferences = [
      ...testReferences, // These are duplicates
      {
        referenceName: 'Bob Wilson',
        referenceContact: '9876543212', // This is new
      },
    ];

    const thirdResponse = await fetch(`${apiUrl}/references/${testUserId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        references: mixedReferences,
      }),
    });

    console.log(
      `\n📊 Third Request Status: ${thirdResponse.status} ${thirdResponse.statusText}`
    );

    if (thirdResponse.ok) {
      const thirdData = await thirdResponse.json();
      console.log(
        '✅ Third request successful (mixed references handled correctly):'
      );
      console.log(
        `   - New references added: ${thirdData.data.newReferencesAdded || 0}`
      );
      console.log(
        `   - Duplicates skipped: ${thirdData.data.duplicatesSkipped || 0}`
      );
      console.log(`   - Message: ${thirdData.data.message}`);
      console.log(
        `   - WhatsApp sent: ${thirdData.data.whatsappResults.filter(r => r.sent).length}`
      );
    } else {
      const errorData = await thirdResponse.text();
      console.log('❌ Third request failed:', errorData);
    }

    console.log('\n🎯 Test Summary:');
    console.log(
      '- First request should add all references and send WhatsApp messages'
    );
    console.log(
      '- Second request should skip all duplicates gracefully (no error)'
    );
    console.log(
      '- Third request should add only new references and skip duplicates'
    );
    console.log('- No 409 conflict errors should occur');
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
  }
}

testDuplicateReferenceHandling();
