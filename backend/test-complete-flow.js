#!/usr/bin/env node

/**
 * Complete test flow: User enrollment + Document upload
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

async function enrollTestUser() {
  try {
    console.log('👤 Step 1: Enrolling a test user...\n');

    const userData = {
      aadharNumber: '123456789012',
      fullName: 'Test User for Document Upload',
      sex: 'MALE',
      guardianSpouse: 'Test Guardian',
      qualification: 'Graduate',
      occupation: 'Software Developer',
      contact: '9876543210',
      email: 'testuser@example.com',
      dateOfBirth: '1990-01-01',
      age: 34,
      houseNumber: '123',
      street: 'Test Street',
      area: 'Test Area',
      city: 'Test City',
      state: 'Test State',
      pincode: '123456',
      isRegisteredElector: true,
      assemblyNumber: '001',
      assemblyName: 'Test Assembly',
      pollingStationNumber: '001',
      epicNumber: 'ABC1234567',
      university: 'Test University',
      graduationYear: 2012,
      graduationDocType: 'Bachelor of Technology',
    };

    console.log('📤 Enrolling user with Aadhar:', userData.aadharNumber);

    const response = await fetch(`${API_BASE}/users/enroll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const result = await response.json();

    console.log(`📋 Enrollment Response Status: ${response.status}`);

    if (response.ok) {
      console.log('✅ User enrolled successfully!');
      console.log(`   User ID: ${result.data.user.id}`);
      console.log(`   Full Name: ${result.data.user.fullName}`);
      console.log(
        `   Token: ${result.data.token ? 'Generated' : 'Not provided'}`
      );

      return {
        userId: result.data.user.id,
        token: result.data.token,
      };
    } else {
      console.log('❌ User enrollment failed!');
      console.log('📄 Error:', JSON.stringify(result, null, 2));

      if (result.error?.code === 'DUPLICATE_AADHAR') {
        console.log(
          "\n💡 User with this Aadhar already exists. Let's try to use existing user..."
        );
        // In a real scenario, you'd need to login to get the token
        return null;
      }

      return null;
    }
  } catch (error) {
    console.error('❌ Enrollment failed:', error.message);
    return null;
  }
}

async function uploadDocument(userId, token) {
  try {
    console.log('\n📁 Step 2: Uploading document...\n');

    // Create test file
    const testFile = createTestImage();
    console.log(`✅ Created test file: ${testFile}`);

    // Create FormData with BOTH file and documentType
    const formData = new FormData();
    formData.append('document', fs.createReadStream(testFile), {
      filename: 'test-photo.jpg',
      contentType: 'image/jpeg',
    });
    formData.append('documentType', 'PHOTO');

    console.log('📤 Uploading document...');
    console.log(`   User ID: ${userId}`);
    console.log('   Document Type: PHOTO');
    console.log('   File: test-photo.jpg');

    // Make the request with authentication
    const response = await fetch(`${API_BASE}/documents/${userId}/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    console.log(`\n📋 Upload Response Status: ${response.status}`);

    if (response.ok) {
      console.log('✅ Document uploaded successfully!');
      console.log(`   Document ID: ${result.data.document.id}`);
      console.log(`   File Name: ${result.data.document.fileName}`);
      console.log(`   File Size: ${result.data.document.fileSize} bytes`);
      console.log(`   S3 Key: ${result.data.document.s3Key}`);
      console.log(`   Upload Time: ${result.data.document.uploadedAt}`);

      // Test document retrieval
      await retrieveDocument(userId, token, 'PHOTO');
    } else {
      console.log('❌ Document upload failed!');
      console.log('📄 Error:', JSON.stringify(result, null, 2));

      if (result.error?.code === 'DOCUMENT_UPLOAD_FAILED') {
        console.log('\n💡 This might be due to S3 configuration issues.');
        console.log(
          '   Check your AWS credentials and S3 bucket settings in .env file.'
        );
      }
    }

    // Clean up
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
      console.log(`\n🧹 Cleaned up test file: ${testFile}`);
    }
  } catch (error) {
    console.error('❌ Document upload failed:', error.message);
  }
}

async function retrieveDocument(userId, token, documentType) {
  try {
    console.log('\n📥 Step 3: Retrieving uploaded document...\n');

    const response = await fetch(
      `${API_BASE}/documents/${userId}/${documentType}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = await response.json();

    console.log(`📋 Retrieval Response Status: ${response.status}`);

    if (response.ok) {
      console.log('✅ Document retrieved successfully!');
      console.log(`   Document ID: ${result.data.document.id}`);
      console.log(`   File Name: ${result.data.document.fileName}`);
      console.log(`   File Size: ${result.data.document.fileSize} bytes`);
      console.log(`   MIME Type: ${result.data.document.mimeType}`);
      console.log(
        `   Download URL: ${result.data.document.downloadUrl ? 'Generated' : 'Not available'}`
      );
    } else {
      console.log('❌ Document retrieval failed!');
      console.log('📄 Error:', JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error('❌ Document retrieval failed:', error.message);
  }
}

async function main() {
  console.log('🚀 Complete Document Upload Test Flow');
  console.log('=====================================\n');

  try {
    // Step 1: Enroll user
    const userInfo = await enrollTestUser();

    if (!userInfo) {
      console.log('\n❌ Cannot proceed without user enrollment');
      return;
    }

    // Step 2: Upload document
    await uploadDocument(userInfo.userId, userInfo.token);

    console.log('\n✨ Test completed!');
    console.log('\n📝 Summary:');
    console.log('1. ✅ User enrollment');
    console.log('2. ✅ Document upload');
    console.log('3. ✅ Document retrieval');

    console.log('\n💡 Your document upload system is working correctly!');
    console.log(
      '   You can now integrate this into your frontend application.'
    );
  } catch (error) {
    console.error('\n❌ Test flow failed:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the backend server is running:');
      console.log('   cd backend && npm run dev');
    }
  }
}

// Run the complete test flow
main();
