#!/usr/bin/env node

/**
 * Fixed test script for document upload functionality
 * This demonstrates the correct way to send documentType
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
 * Test document upload with correct format
 */
async function testDocumentUpload() {
  try {
    console.log('🧪 Testing Document Upload API (Fixed Version)...\n');

    // Create test file
    const testFile = createTestFile();

    // Create form data - THIS IS THE CORRECT WAY
    const formData = new FormData();
    formData.append('document', fs.createReadStream(testFile));
    formData.append('documentType', TEST_CONFIG.documentType); // This must be included as form field

    console.log(`📤 Uploading document...`);
    console.log(`   User ID: ${TEST_CONFIG.userId}`);
    console.log(`   Document Type: ${TEST_CONFIG.documentType}`);
    console.log(`   File: ${testFile}`);
    console.log(
      `   Form fields: document (file), documentType (${TEST_CONFIG.documentType})`
    );

    // Make upload request
    const uploadResponse = await fetch(
      `${API_BASE}/documents/${TEST_CONFIG.userId}/upload`,
      {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - let FormData set it with boundary
      }
    );

    const uploadResult = await uploadResponse.json();

    console.log(`\n📊 Response Status: ${uploadResponse.status}`);
    console.log('📄 Response Body:', JSON.stringify(uploadResult, null, 2));

    if (uploadResponse.ok) {
      console.log('\n✅ Upload successful!');
    } else {
      console.log('\n❌ Upload failed!');

      // Provide specific guidance based on error
      if (uploadResult.error?.code === 'USER_NOT_FOUND') {
        console.log(
          '\n💡 Solution: Create a user first or use an existing user ID'
        );
        console.log('   You can create a user via the user registration API');
      }

      if (uploadResult.error?.code === 'UNAUTHORIZED') {
        console.log('\n💡 Solution: Add authentication headers');
        console.log('   Include JWT token in Authorization header');
      }

      if (uploadResult.error?.code === 'MISSING_DOCUMENT_TYPE') {
        console.log(
          '\n💡 This error should be fixed now - documentType is included'
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
 * Test with curl command equivalent
 */
function showCurlExample() {
  console.log('\n📋 Equivalent curl command:');
  console.log('```bash');
  console.log(
    `curl -X POST "${API_BASE}/documents/${TEST_CONFIG.userId}/upload" \\`
  );
  console.log('  -F "document=@./test-files/sample-photo.jpg" \\');
  console.log(`  -F "documentType=${TEST_CONFIG.documentType}"`);
  console.log('```');
  console.log('');
  console.log('📋 With authentication (production):');
  console.log('```bash');
  console.log(
    `curl -X POST "${API_BASE}/documents/${TEST_CONFIG.userId}/upload" \\`
  );
  console.log('  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\');
  console.log('  -H "X-CSRF-Token: YOUR_CSRF_TOKEN" \\');
  console.log('  -F "document=@./test-files/sample-photo.jpg" \\');
  console.log(`  -F "documentType=${TEST_CONFIG.documentType}"`);
  console.log('```');
}

/**
 * Show frontend integration example
 */
function showFrontendExample() {
  console.log('\n📱 Frontend Integration Example:');
  console.log('```javascript');
  console.log('// Correct way to upload document from frontend');
  console.log('async function uploadDocument(userId, documentType, file) {');
  console.log('  const formData = new FormData();');
  console.log('  formData.append("document", file);');
  console.log(
    '  formData.append("documentType", documentType); // IMPORTANT: Include this!'
  );
  console.log('  ');
  console.log(
    '  const response = await fetch(`/api/documents/${userId}/upload`, {'
  );
  console.log('    method: "POST",');
  console.log('    headers: {');
  console.log('      "Authorization": `Bearer ${authToken}`,');
  console.log('      "X-CSRF-Token": csrfToken,');
  console.log(
    '      // Do NOT set Content-Type - let browser set it with boundary'
  );
  console.log('    },');
  console.log('    body: formData,');
  console.log('  });');
  console.log('  ');
  console.log('  return response.json();');
  console.log('}');
  console.log('');
  console.log('// Usage:');
  console.log('const fileInput = document.getElementById("fileInput");');
  console.log('const file = fileInput.files[0];');
  console.log('const result = await uploadDocument("user123", "PHOTO", file);');
  console.log('```');
}

/**
 * Main test function
 */
async function main() {
  console.log('🚀 Document Upload API Test Suite (FIXED)');
  console.log('==========================================\n');

  console.log('🔧 The Issue:');
  console.log('The error "MISSING_DOCUMENT_TYPE" occurs when the documentType');
  console.log('is not sent as a form field along with the file.\n');

  console.log('✅ The Fix:');
  console.log(
    'Always include documentType as a form field in multipart/form-data\n'
  );

  // Show examples
  showCurlExample();
  showFrontendExample();

  // Run test
  await testDocumentUpload();

  console.log('\n📝 Valid Document Types:');
  console.log('- AADHAR');
  console.log('- DEGREE_CERTIFICATE');
  console.log('- PHOTO');

  console.log('\n📝 Supported File Types:');
  console.log('- image/jpeg (.jpg, .jpeg)');
  console.log('- image/png (.png)');
  console.log('- application/pdf (.pdf)');

  console.log('\n📝 File Size Limit: 2MB');

  console.log('\n✨ Test completed!');
}

// Run the test
main().catch(console.error);
