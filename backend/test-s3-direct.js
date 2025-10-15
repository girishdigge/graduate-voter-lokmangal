#!/usr/bin/env node

/**
 * Test S3 connection directly
 */

import dotenv from 'dotenv';
import {
  S3Client,
  HeadBucketCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';

// Load environment variables
dotenv.config();

console.log('🔍 Testing S3 Connection Directly...\n');

// Get AWS configuration
const AWS_REGION = process.env.AWS_REGION;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;

console.log('📋 AWS Configuration:');
console.log(`   Region: ${AWS_REGION}`);
console.log(
  `   Access Key: ${AWS_ACCESS_KEY_ID ? AWS_ACCESS_KEY_ID.substring(0, 4) + '...' : 'Not set'}`
);
console.log(`   Secret Key: ${AWS_SECRET_ACCESS_KEY ? 'Set' : 'Not set'}`);
console.log(`   Bucket: ${S3_BUCKET_NAME}`);

if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !S3_BUCKET_NAME) {
  console.log('\n❌ Missing required AWS configuration');
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

async function testS3Connection() {
  try {
    console.log('\n🔗 Testing S3 bucket access...');

    // Test bucket access
    const headCommand = new HeadBucketCommand({
      Bucket: S3_BUCKET_NAME,
    });

    await s3Client.send(headCommand);
    console.log('✅ S3 bucket access successful!');

    // Test file upload
    console.log('\n📤 Testing file upload...');

    const testContent = Buffer.from('Hello from document upload test!');
    const testKey = `test-uploads/test-${Date.now()}.txt`;

    const putCommand = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain',
      ServerSideEncryption: 'AES256',
    });

    await s3Client.send(putCommand);
    console.log('✅ File upload successful!');
    console.log(`   Uploaded to: s3://${S3_BUCKET_NAME}/${testKey}`);

    console.log('\n🎉 S3 configuration is working correctly!');
    console.log('   Your document upload should work now.');
  } catch (error) {
    console.error('\n❌ S3 test failed:', error.message);

    if (error.name === 'NoSuchBucket') {
      console.log('\n💡 The S3 bucket does not exist or is not accessible.');
      console.log('   Check:');
      console.log('   1. Bucket name is correct');
      console.log('   2. Bucket exists in the specified region');
      console.log('   3. AWS credentials have access to the bucket');
    } else if (error.name === 'AccessDenied') {
      console.log('\n💡 Access denied to S3 bucket.');
      console.log('   Check:');
      console.log('   1. AWS credentials are correct');
      console.log('   2. IAM user has S3 permissions');
      console.log('   3. Bucket policy allows access');
    } else if (error.name === 'InvalidAccessKeyId') {
      console.log('\n💡 Invalid AWS Access Key ID.');
      console.log('   Check your AWS_ACCESS_KEY_ID in .env file');
    } else if (error.name === 'SignatureDoesNotMatch') {
      console.log('\n💡 Invalid AWS Secret Access Key.');
      console.log('   Check your AWS_SECRET_ACCESS_KEY in .env file');
    }

    console.log('\n🔧 Required IAM permissions:');
    console.log('   - s3:HeadBucket');
    console.log('   - s3:PutObject');
    console.log('   - s3:GetObject');
    console.log('   - s3:DeleteObject');
  }
}

testS3Connection();
