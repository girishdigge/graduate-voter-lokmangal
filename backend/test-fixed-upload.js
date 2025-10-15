#!/usr/bin/env node

/**
 * Test script to verify the multer fix for documentType
 */

import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:3000/api';

// Test configuration
const TEST_CONFIG = {
  userId: 'test-user-123',
  documentType: 'PHOTO',
};

/**
 * Create a test file
 */
function createTestFile() {
  const testDir = './test-files';
  const testFile = path.join(testDir, 'sample-photo.jpg');

  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  if (!fs.existsSync(testFile)) {
    // Create a simple test file (1x1 pixel JPEG)
    const jpegHeader = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
      0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
      0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
      0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
      0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32,
      0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
      0xff, 0xc4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xff, 0xc4,
      0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xda, 0x00, 0x0c,
      0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3f, 0x00, 0x8a, 0x00,
      0xff, 0xd9,
    ]);

    fs.writeFileSync(testFile, jpegHeader);
    console.log(`✅ Created test file: ${testFile}`);
  }

  return testFile;
}

/**
 * Test document upload with the fixed multer configuration
 */
async function testDocumentUpload() {
  try {
    console.log('🧪 Testing Document Upload API (After Multer Fix)...\n');

    // Create test file
    const testFile = createTestFile();

    // Create form data
    const formData = new FormData();
    formData.append('document', fs.createReadStream(testFile));
    formData.append('documentType', TEST_CONFIG.documentType);

    console.log(`📤 Uploading document...`);
    console.log(`   User ID: ${TEST_CONFIG.userId}`);
    console.log(`   Document Type: ${TEST_CONFIG.documentType}`);
    console.log(`   File: ${testFile}`);
    console.log(`   Multer config: Using fields() instead of single()`);

    // Make upload request
    const uploadResponse = await fetch(
      `${API_BASE}/documents/${TEST_CONFIG.userId}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const uploadResult = await uploadResponse.json();

    console.log(`\n📊 Response Status: ${uploadResponse.status}`);
    console.log('📄 Response Body:', JSON.stringify(uploadResult, null, 2));

    if (uploadResponse.ok) {
      console.log('\n✅ Upload successful! The multer fix worked!');
    } else {
      console.log('\n📋 Response Analysis:');

      if (uploadResult.error?.code === 'MISSING_DOCUMENT_TYPE') {
        console.log('❌ Still getting MISSING_DOCUMENT_TYPE error');
        console.log("   This means the multer fix didn't work as expected");
      } else if (uploadResult.error?.code === 'USER_NOT_FOUND') {
        console.log('✅ documentType is now being received correctly!');
        console.log("❌ But user doesn't exist in database");
        console.log('💡 Solution: Create a user first or use existing user ID');
      } else if (uploadResult.error?.code === 'UNAUTHORIZED') {
        console.log('✅ documentType is now being received correctly!');
        console.log('❌ But authentication is required');
        console.log('💡 Solution: Add JWT token to Authorization header');
      } else {
        console.log(`❓ Unexpected error: ${uploadResult.error?.code}`);
        console.log(`   Message: ${uploadResult.error?.message}`);
      }
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the backend server is running on port 3000');
      console.log('   Run: npm run dev');
    }
  }
}

/**
 * Test with a real curl command
 */
function showTestCurlCommand() {
  const testFile = './test-files/sample-photo.jpg';

  console.log('\n📋 Test with curl:');
  console.log('```bash');
  console.log(
    `curl -X POST "${API_BASE}/documents/${TEST_CONFIG.userId}/upload" \\`
  );
  console.log(`  -F "document=@${testFile}" \\`);
  console.log(`  -F "documentType=${TEST_CONFIG.documentType}"`);
  console.log('```');
  console.log('');
  console.log('Expected results:');
  console.log("- If you get MISSING_DOCUMENT_TYPE: The fix didn't work");
  console.log(
    '- If you get USER_NOT_FOUND: The fix worked! (just need to create user)'
  );
  console.log(
    '- If you get UNAUTHORIZED: The fix worked! (just need authentication)'
  );
}

/**
 * Main test function
 */
async function main() {
  console.log('🔧 Multer Fix Verification Test');
  console.log('===============================\n');

  console.log('🔍 What was changed:');
  console.log(
    '1. Changed uploadSingleFile from multer.single() to multer.fields()'
  );
  console.log('2. Updated controller to handle req.files instead of req.file');
  console.log('3. Updated validation middleware to handle new structure');
  console.log('');

  showTestCurlCommand();

  // Run test
  await testDocumentUpload();

  console.log('\n✨ Test completed!');
  console.log('\n🔧 If the fix worked:');
  console.log('1. You should no longer see MISSING_DOCUMENT_TYPE error');
  console.log('2. You might see USER_NOT_FOUND or UNAUTHORIZED instead');
  console.log('3. This means documentType is now being received correctly');
}

// Run the test
main().catch(console.error);
