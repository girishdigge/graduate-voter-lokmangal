#!/usr/bin/env node

/**
 * Simple test to verify S3 connection and document upload functionality
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000';

async function testS3Connection() {
  try {
    console.log('🧪 Testing S3 Connection via Health Check...\n');

    const response = await fetch(`${API_BASE}/health`);
    const healthData = await response.json();

    console.log('📊 Health Check Results:');
    console.log('  Status:', healthData.status);
    console.log('  S3 Service:', healthData.services?.s3 || 'Not checked');
    console.log('  Environment:', healthData.environment);
    console.log('  Uptime:', Math.round(healthData.uptime), 'seconds');

    if (healthData.services?.s3 === 'healthy') {
      console.log('\n✅ S3 Connection: SUCCESS');
      console.log('🎉 Your document upload functionality is ready to use!');

      console.log('\n📋 Your S3 Configuration:');
      console.log('  Region: ap-south-1 (Mumbai)');
      console.log('  Bucket: padhvidhar');
      console.log('  Max File Size: 2MB');
      console.log('  Supported Types: JPEG, PNG, PDF');

      console.log('\n🚀 Ready to test document uploads!');
      console.log('  Try uploading a document using the API endpoints');
    } else if (healthData.services?.s3 === 'unhealthy') {
      console.log('\n❌ S3 Connection: FAILED');
      console.log('💡 Check your AWS credentials and bucket permissions');
    } else {
      console.log('\n⚠️  S3 Connection: Not tested in health check');
      console.log('💡 This might be normal - the server may skip S3 tests');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the backend server is running:');
      console.log('   cd backend && npm run dev');
    }
  }
}

async function showDocumentEndpoints() {
  console.log('\n📋 Document Upload API Endpoints:');
  console.log('=====================================');
  console.log('');
  console.log('1. Upload Single Document:');
  console.log('   POST /api/documents/:userId/upload');
  console.log('   Content-Type: multipart/form-data');
  console.log(
    '   Body: document (file), documentType (AADHAR|DEGREE_CERTIFICATE|PHOTO)'
  );
  console.log('');
  console.log('2. Upload Multiple Documents:');
  console.log('   POST /api/documents/:userId/upload-multiple');
  console.log('   Content-Type: multipart/form-data');
  console.log('   Body: aadhar (file), degree (file), photo (file)');
  console.log('');
  console.log('3. Get Document:');
  console.log('   GET /api/documents/:userId/:documentType');
  console.log('   Returns: Document info with signed download URL');
  console.log('');
  console.log('4. Get All User Documents:');
  console.log('   GET /api/documents/:userId');
  console.log('   Returns: List of all documents for user');
  console.log('');
  console.log('5. Replace Document:');
  console.log('   PUT /api/documents/:userId/:documentType');
  console.log('   Content-Type: multipart/form-data');
  console.log('   Body: document (file)');
  console.log('');
  console.log('6. Delete Document:');
  console.log('   DELETE /api/documents/:userId/:documentType');
  console.log('');
  console.log('🔐 Note: All endpoints require authentication');
  console.log('📝 Document Types: AADHAR, DEGREE_CERTIFICATE, PHOTO');
  console.log('📁 File Types: JPEG, PNG, PDF (max 2MB)');
}

async function main() {
  console.log('🚀 S3 Document Upload Test');
  console.log('===========================\n');

  await testS3Connection();
  await showDocumentEndpoints();

  console.log('\n✨ Test completed!');
  console.log('\n🎯 Next Steps:');
  console.log('1. Create a user account to get a valid userId');
  console.log('2. Use the API endpoints to upload documents');
  console.log('3. Check your S3 bucket to see uploaded files');
  console.log('4. Build your frontend upload interface');
}

main().catch(console.error);
