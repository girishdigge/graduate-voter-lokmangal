#!/usr/bin/env node

/**
 * Simple test for document upload
 */

import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

const API_BASE = 'http://localhost:3000/api';

// Create a simple test image file
function createTestImage() {
  const testFile = './test-image.jpg';

  // Simple 1x1 pixel JPEG
  const jpegData = Buffer.from([
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

  fs.writeFileSync(testFile, jpegData);
  return testFile;
}

async function testUpload() {
  try {
    console.log('🧪 Testing Document Upload...\n');

    // Create test file
    const testFile = createTestImage();
    console.log(`✅ Created test file: ${testFile}`);

    // Create FormData with BOTH file and documentType
    const formData = new FormData();
    formData.append('document', fs.createReadStream(testFile), {
      filename: 'test-photo.jpg',
      contentType: 'image/jpeg',
    });
    formData.append('documentType', 'PHOTO'); // This is crucial!

    console.log('\n📤 Uploading with:');
    console.log('   - File: test-photo.jpg');
    console.log('   - Document Type: PHOTO');
    console.log('   - User ID: test-user-123');

    // Make the request
    const response = await fetch(`${API_BASE}/documents/test-user-123/upload`, {
      method: 'POST',
      body: formData,
      // Note: In production, you'd need authentication headers:
      // headers: {
      //   'Authorization': 'Bearer your-jwt-token',
      //   'X-CSRF-Token': 'your-csrf-token'
      // }
    });

    const result = await response.json();

    console.log('\n📋 Response:');
    console.log(`Status: ${response.status}`);
    console.log(`Body:`, JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('\n✅ Upload successful!');
    } else {
      console.log('\n❌ Upload failed!');

      // Common error explanations
      if (result.error?.code === 'USER_NOT_FOUND') {
        console.log(
          '\n💡 The user "test-user-123" doesn\'t exist in the database.'
        );
        console.log(
          '   You need to create a user first or use an existing user ID.'
        );
      }

      if (result.error?.code === 'UNAUTHORIZED') {
        console.log('\n💡 Authentication is required for document uploads.');
        console.log(
          '   You need to include JWT token in the Authorization header.'
        );
      }

      if (result.error?.code === 'MISSING_DOCUMENT_TYPE') {
        console.log(
          '\n💡 The documentType field is missing from the form data.'
        );
        console.log('   Make sure to include documentType as a form field.');
      }
    }

    // Clean up
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
      console.log(`\n🧹 Cleaned up test file: ${testFile}`);
    }
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the backend server is running:');
      console.log('   cd backend && npm run dev');
    }
  }
}

// Run the test
testUpload();
