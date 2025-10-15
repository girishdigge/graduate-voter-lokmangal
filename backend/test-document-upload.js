#!/usr/bin/env node

/**
 * Test script for document upload functionality
 * This script demonstrates how to use the document upload API
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
  testFilePath: './test-files/sample-photo.jpg',
  useTestEndpoints: true, // Set to false to test with real authentication
};

/**
 * Create a test file if it doesn't exist
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
 * Test document upload
 */
async function testDocumentUpload() {
  try {
    console.log('🧪 Testing Document Upload API...\n');

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

    // Make upload request
    const uploadResponse = await fetch(
      `${API_BASE}/documents/${TEST_CONFIG.userId}/upload`,
      {
        method: 'POST',
        body: formData,
        headers: {
          // Note: In a real app, you'd need authentication headers
          // 'Authorization': 'Bearer your-jwt-token',
          // 'X-CSRF-Token': 'your-csrf-token',
        },
      }
    );

    const uploadResult = await uploadResponse.json();

    if (uploadResponse.ok) {
      console.log('✅ Upload successful!');
      console.log('📄 Response:', JSON.stringify(uploadResult, null, 2));

      // Test document retrieval
      await testDocumentRetrieval();
    } else {
      console.log('❌ Upload failed!');
      console.log('📄 Error:', JSON.stringify(uploadResult, null, 2));

      if (uploadResult.error?.code === 'USER_NOT_FOUND') {
        console.log(
          '\n💡 Note: You need to create a user first or use an existing user ID'
        );
      }

      if (uploadResult.error?.code === 'UNAUTHORIZED') {
        console.log(
          '\n💡 Note: Authentication is required for document uploads'
        );
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
 * Test document retrieval
 */
async function testDocumentRetrieval() {
  try {
    console.log('\n📥 Testing document retrieval...');

    const response = await fetch(
      `${API_BASE}/documents/${TEST_CONFIG.userId}/${TEST_CONFIG.documentType}`,
      {
        method: 'GET',
        headers: {
          // Note: In a real app, you'd need authentication headers
          // 'Authorization': 'Bearer your-jwt-token',
        },
      }
    );

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Retrieval successful!');
      console.log('📄 Document info:', {
        id: result.data.document.id,
        fileName: result.data.document.fileName,
        fileSize: result.data.document.fileSize,
        mimeType: result.data.document.mimeType,
        uploadedAt: result.data.document.uploadedAt,
        hasDownloadUrl: !!result.data.document.downloadUrl,
      });
    } else {
      console.log('❌ Retrieval failed!');
      console.log('📄 Error:', JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error('❌ Retrieval test failed:', error.message);
  }
}

/**
 * Test multiple document upload
 */
async function testMultipleDocumentUpload() {
  try {
    console.log('\n🧪 Testing Multiple Document Upload...');

    // Create test files
    const testFile = createTestFile();

    // Create form data for multiple files
    const formData = new FormData();
    formData.append('photo', fs.createReadStream(testFile));
    // You could add more files here:
    // formData.append('aadhar', fs.createReadStream('./test-files/sample-aadhar.pdf'));
    // formData.append('degree', fs.createReadStream('./test-files/sample-degree.pdf'));

    console.log(`📤 Uploading multiple documents...`);

    const response = await fetch(
      `${API_BASE}/documents/${TEST_CONFIG.userId}/upload-multiple`,
      {
        method: 'POST',
        body: formData,
        headers: {
          // Note: In a real app, you'd need authentication headers
        },
      }
    );

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Multiple upload successful!');
      console.log('📄 Results:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ Multiple upload failed!');
      console.log('📄 Error:', JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error('❌ Multiple upload test failed:', error.message);
  }
}

/**
 * Display API endpoints
 */
function displayEndpoints() {
  console.log('\n📋 Available Document API Endpoints:');
  console.log('');
  console.log('1. Upload single document:');
  console.log('   POST /api/documents/:userId/upload');
  console.log(
    '   Body: multipart/form-data with "document" file and "documentType"'
  );
  console.log('');
  console.log('2. Upload multiple documents:');
  console.log('   POST /api/documents/:userId/upload-multiple');
  console.log(
    '   Body: multipart/form-data with "aadhar", "degree", "photo" files'
  );
  console.log('');
  console.log('3. Get specific document:');
  console.log('   GET /api/documents/:userId/:documentType');
  console.log('');
  console.log('4. Get all user documents:');
  console.log('   GET /api/documents/:userId');
  console.log('');
  console.log('5. Replace document:');
  console.log('   PUT /api/documents/:userId/:documentType');
  console.log('   Body: multipart/form-data with "document" file');
  console.log('');
  console.log('6. Delete document:');
  console.log('   DELETE /api/documents/:userId/:documentType');
  console.log('');
  console.log('📝 Document Types: AADHAR, DEGREE_CERTIFICATE, PHOTO');
  console.log('📝 Supported formats: JPEG, PNG, PDF');
  console.log('📝 Max file size: 2MB (configurable)');
  console.log('');
}

/**
 * Main test function
 */
async function main() {
  console.log('🚀 Document Upload API Test Suite');
  console.log('==================================\n');

  displayEndpoints();

  // Run tests
  await testDocumentUpload();
  // await testMultipleDocumentUpload(); // Uncomment to test multiple uploads

  console.log('\n✨ Test completed!');
  console.log('\n💡 Next steps:');
  console.log('1. Set up your AWS S3 credentials in backend/.env');
  console.log('2. Create a user account to get a valid userId');
  console.log('3. Implement authentication in your frontend');
  console.log('4. Test with real files and different document types');
}

// Run the test
main().catch(console.error);
