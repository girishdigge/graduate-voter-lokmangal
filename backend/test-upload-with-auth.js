#!/usr/bin/env node

/**
 * Test document upload with proper authentication
 */

import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import jwt from 'jsonwebtoken';

const API_BASE = 'http://localhost:3000/api';
const JWT_SECRET =
  process.env.JWT_SECRET || 'dev-jwt-secret-key-not-for-production';

// Create a test JWT token for a user
function createTestUserToken(userId) {
  const payload = {
    userId: userId,
    type: 'user',
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '24h',
    issuer: 'voter-management-system',
    audience: 'voter-portal',
  });
}

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

async function testUploadWithAuth() {
  try {
    console.log('🧪 Testing Document Upload with Authentication...\n');

    // Create test file
    const testFile = createTestImage();
    console.log(`✅ Created test file: ${testFile}`);

    // Create a test user token
    const userId = 'test-user-123';
    const token = createTestUserToken(userId);
    console.log(`✅ Created JWT token for user: ${userId}`);

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
    console.log('   - Authentication: JWT Token');

    // Make the request with authentication
    const response = await fetch(`${API_BASE}/documents/${userId}/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
        // Note: CSRF token would also be needed in production
      },
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
        console.log("   Let's try to create a user...");
        await createTestUser(userId, token);
      }

      if (result.error?.code === 'DOCUMENT_UPLOAD_FAILED') {
        console.log(
          '\n💡 Document upload failed - this might be due to S3 configuration.'
        );
        console.log('   Check your AWS credentials and S3 bucket settings.');
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

async function createTestUser(userId, token) {
  try {
    console.log('\n👤 Attempting to create test user...');

    const userData = {
      aadharNumber: '123456789012',
      fullName: 'Test User',
      sex: 'MALE',
      contact: '9876543210',
      dateOfBirth: '1990-01-01',
      age: 34,
      houseNumber: '123',
      street: 'Test Street',
      area: 'Test Area',
      city: 'Test City',
      state: 'Test State',
      pincode: '123456',
    };

    const response = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Test user created successfully!');
      console.log('   Now you can try the document upload again.');
    } else {
      console.log('❌ Failed to create test user:');
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
  }
}

// Run the test
testUploadWithAuth();
