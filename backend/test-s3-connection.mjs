#!/usr/bin/env node

/**
 * Test S3 connection using the AWS SDK directly
 * This bypasses the TypeScript compilation issue
 */

import {
  S3Client,
  HeadBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// AWS Configuration
const AWS_REGION = process.env.AWS_REGION || 'ap-south-1';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;

console.log('🔧 AWS S3 Configuration Test');
console.log('============================\n');

console.log('Configuration:');
console.log(`  Region: ${AWS_REGION}`);
console.log(`  Bucket: ${S3_BUCKET_NAME}`);
console.log(
  `  Access Key: ${AWS_ACCESS_KEY_ID ? AWS_ACCESS_KEY_ID.substring(0, 8) + '...' : 'NOT SET'}`
);
console.log(
  `  Secret Key: ${AWS_SECRET_ACCESS_KEY ? '***SET***' : 'NOT SET'}\n`
);

// Validate configuration
if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
  console.error('❌ AWS credentials not found in environment variables');
  process.exit(1);
}

if (!S3_BUCKET_NAME) {
  console.error('❌ S3_BUCKET_NAME not found in environment variables');
  process.exit(1);
}

// Create S3 client
const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Test S3 bucket access
 */
async function testBucketAccess() {
  try {
    console.log('🧪 Testing bucket access...');

    const command = new HeadBucketCommand({
      Bucket: S3_BUCKET_NAME,
    });

    await s3Client.send(command);
    console.log('✅ Bucket access successful!');
    return true;
  } catch (error) {
    console.error('❌ Bucket access failed:', error.message);

    if (error.name === 'NotFound') {
      console.log(
        "💡 The bucket does not exist or you don't have access to it"
      );
    } else if (error.name === 'Forbidden') {
      console.log(
        '💡 Access denied. Check your AWS credentials and bucket permissions'
      );
    } else if (error.name === 'InvalidAccessKeyId') {
      console.log('💡 Invalid AWS Access Key ID');
    } else if (error.name === 'SignatureDoesNotMatch') {
      console.log('💡 Invalid AWS Secret Access Key');
    }

    return false;
  }
}

/**
 * Test file upload
 */
async function testFileUpload() {
  try {
    console.log('\n🧪 Testing file upload...');

    const testContent = 'This is a test file for S3 upload functionality';
    const testKey = `test-uploads/test-${Date.now()}.txt`;

    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain',
      ServerSideEncryption: 'AES256',
      Metadata: {
        testFile: 'true',
        uploadedAt: new Date().toISOString(),
      },
    });

    await s3Client.send(command);
    console.log('✅ File upload successful!');
    console.log(`   Key: ${testKey}`);

    return testKey;
  } catch (error) {
    console.error('❌ File upload failed:', error.message);
    return null;
  }
}

/**
 * Test signed URL generation
 */
async function testSignedUrl(key) {
  try {
    console.log('\n🧪 Testing signed URL generation...');

    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 hour
    });

    console.log('✅ Signed URL generation successful!');
    console.log(`   URL: ${signedUrl.substring(0, 100)}...`);

    return signedUrl;
  } catch (error) {
    console.error('❌ Signed URL generation failed:', error.message);
    return null;
  }
}

/**
 * Test file download using signed URL
 */
async function testFileDownload(signedUrl) {
  try {
    console.log('\n🧪 Testing file download via signed URL...');

    const response = await fetch(signedUrl);

    if (response.ok) {
      const content = await response.text();
      console.log('✅ File download successful!');
      console.log(`   Content: ${content.substring(0, 50)}...`);
      return true;
    } else {
      console.error(
        '❌ File download failed:',
        response.status,
        response.statusText
      );
      return false;
    }
  } catch (error) {
    console.error('❌ File download failed:', error.message);
    return false;
  }
}

/**
 * Clean up test file
 */
async function cleanupTestFile(key) {
  try {
    console.log('\n🧹 Cleaning up test file...');

    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    console.log('✅ Test file cleaned up successfully!');
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    console.log('💡 You may need to manually delete the test file from S3');
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🚀 Starting S3 functionality tests...\n');

  let allTestsPassed = true;
  let testFileKey = null;

  // Test 1: Bucket access
  const bucketAccessOk = await testBucketAccess();
  if (!bucketAccessOk) {
    allTestsPassed = false;
    console.log(
      '\n❌ Cannot proceed with further tests due to bucket access failure'
    );
    return;
  }

  // Test 2: File upload
  testFileKey = await testFileUpload();
  if (!testFileKey) {
    allTestsPassed = false;
  }

  // Test 3: Signed URL generation
  let signedUrl = null;
  if (testFileKey) {
    signedUrl = await testSignedUrl(testFileKey);
    if (!signedUrl) {
      allTestsPassed = false;
    }
  }

  // Test 4: File download
  if (signedUrl) {
    const downloadOk = await testFileDownload(signedUrl);
    if (!downloadOk) {
      allTestsPassed = false;
    }
  }

  // Cleanup
  if (testFileKey) {
    await cleanupTestFile(testFileKey);
  }

  // Summary
  console.log('\n📊 Test Summary');
  console.log('================');
  if (allTestsPassed) {
    console.log(
      '✅ All tests passed! Your S3 integration is working correctly.'
    );
    console.log('\n🎉 Your document upload functionality is ready to use!');
    console.log('\n📋 Next steps:');
    console.log('1. Your backend server is already running on port 3000');
    console.log('2. You can now test document uploads via the API');
    console.log(
      '3. Use the endpoints documented in DOCUMENT_UPLOAD_IMPLEMENTATION_SUMMARY.md'
    );
  } else {
    console.log('❌ Some tests failed. Please check the errors above.');
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Verify your AWS credentials are correct');
    console.log('2. Check that the S3 bucket exists and you have permissions');
    console.log('3. Ensure the bucket is in the correct region');
  }
}

// Run the tests
runTests().catch(console.error);
