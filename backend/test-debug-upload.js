#!/usr/bin/env node

/**
 * Test script to debug the upload issue
 */

import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const DEBUG_API_BASE = 'http://localhost:3001';

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
 * Test different upload configurations
 */
async function testUploads() {
  const testFile = createTestFile();

  console.log('🧪 Testing different upload configurations...\n');

  // Test 1: Single file upload
  console.log('1️⃣ Testing single file upload...');
  try {
    const formData = new FormData();
    formData.append('document', fs.createReadStream(testFile));
    formData.append('documentType', 'PHOTO');

    const response = await fetch(`${DEBUG_API_BASE}/test-single`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    console.log('✅ Single upload result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.log('❌ Single upload failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Fields upload (current backend setup)
  console.log('2️⃣ Testing fields upload...');
  try {
    const formData = new FormData();
    formData.append('document', fs.createReadStream(testFile));
    formData.append('documentType', 'PHOTO');

    const response = await fetch(`${DEBUG_API_BASE}/test-fields`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    console.log('✅ Fields upload result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.log('❌ Fields upload failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Any upload
  console.log('3️⃣ Testing any upload...');
  try {
    const formData = new FormData();
    formData.append('document', fs.createReadStream(testFile));
    formData.append('documentType', 'PHOTO');

    const response = await fetch(`${DEBUG_API_BASE}/test-any`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    console.log('✅ Any upload result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.log('❌ Any upload failed:', error.message);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🔍 Document Upload Debug Test');
  console.log('============================\n');

  console.log('Make sure the debug server is running:');
  console.log('node debug-upload.js\n');

  // Wait a bit for server to start
  await new Promise(resolve => setTimeout(resolve, 1000));

  try {
    await testUploads();
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('\n❌ Cannot connect to debug server');
      console.log('Please run: node debug-upload.js');
      console.log('Then run this test again');
    } else {
      console.error('Test error:', error);
    }
  }

  console.log('\n✨ Debug test completed!');
}

main().catch(console.error);
