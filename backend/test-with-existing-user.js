#!/usr/bin/env node

/**
 * Test document upload with existing user
 */

import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import jwt from 'jsonwebtoken';

const API_BASE = 'http://localhost:3000/api';
const JWT_SECRET =
  process.env.JWT_SECRET || 'dev-jwt-secret-key-not-for-production';

// Get user ID from command line argument
const userId = process.argv[2] || '00c77875-5b7a-4941-a55c-6c4c2cc9d6f3';

// Create a test JWT token for the user
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

async function testDocumentUpload() {
  try {
    console.log('🧪 Testing Document Upload with Existing User');
    console.log('==============================================\n');

    console.log(`👤 Using User ID: ${userId}`);

    // Create JWT token for the user
    const token = createTestUserToken(userId);
    console.log('✅ Generated JWT token for user');

    // Create test file
    const testFile = createTestImage();
    console.log(`✅ Created test file: ${testFile}`);

    // Test different document types
    const documentTypes = ['PHOTO', 'AADHAR', 'DEGREE_CERTIFICATE'];

    for (const docType of documentTypes) {
      console.log(`\n📁 Testing upload for document type: ${docType}`);
      console.log('─'.repeat(50));

      // Create FormData
      const formData = new FormData();
      formData.append('document', fs.createReadStream(testFile), {
        filename: `test-${docType.toLowerCase()}.jpg`,
        contentType: 'image/jpeg',
      });
      formData.append('documentType', docType);

      console.log(`📤 Uploading ${docType}...`);

      // Make the upload request
      const response = await fetch(`${API_BASE}/documents/${userId}/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      console.log(`📋 Response Status: ${response.status}`);

      if (response.ok) {
        console.log(`✅ ${docType} uploaded successfully!`);
        console.log(`   Document ID: ${result.data.document.id}`);
        console.log(`   File Name: ${result.data.document.fileName}`);
        console.log(`   File Size: ${result.data.document.fileSize} bytes`);
        console.log(`   S3 Key: ${result.data.document.s3Key}`);

        // Test retrieval
        await testDocumentRetrieval(userId, token, docType);
      } else {
        console.log(`❌ ${docType} upload failed!`);
        console.log('📄 Error:', JSON.stringify(result, null, 2));

        if (result.error?.code === 'DOCUMENT_UPLOAD_FAILED') {
          console.log('\n💡 This might be due to S3 configuration issues.');
          console.log(
            '   Your AWS credentials and S3 bucket are configured, but there might be permission issues.'
          );
        }
      }
    }

    // Test getting all user documents
    await testGetAllDocuments(userId, token);

    // Clean up
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
      console.log(`\n🧹 Cleaned up test file: ${testFile}`);
    }

    console.log('\n✨ Document upload testing completed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the backend server is running:');
      console.log('   cd backend && npm run dev');
    }
  }
}

async function testDocumentRetrieval(userId, token, documentType) {
  try {
    console.log(`📥 Retrieving ${documentType}...`);

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

    if (response.ok) {
      console.log(`✅ ${documentType} retrieved successfully!`);
      console.log(
        `   Download URL: ${result.data.document.downloadUrl ? 'Generated' : 'Not available'}`
      );
    } else {
      console.log(`❌ ${documentType} retrieval failed!`);
      console.log('📄 Error:', JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error(`❌ ${documentType} retrieval failed:`, error.message);
  }
}

async function testGetAllDocuments(userId, token) {
  try {
    console.log('\n📋 Getting all user documents...');
    console.log('─'.repeat(50));

    const response = await fetch(`${API_BASE}/documents/${userId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (response.ok) {
      console.log(`✅ Retrieved all documents successfully!`);
      console.log(`   Total documents: ${result.data.count}`);

      if (result.data.documents && result.data.documents.length > 0) {
        result.data.documents.forEach((doc, index) => {
          console.log(
            `   ${index + 1}. ${doc.documentType}: ${doc.fileName} (${doc.fileSize} bytes)`
          );
        });
      }
    } else {
      console.log('❌ Failed to get all documents!');
      console.log('📄 Error:', JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error('❌ Get all documents failed:', error.message);
  }
}

// Run the test
console.log('🚀 Starting Document Upload Test...\n');
testDocumentUpload();
