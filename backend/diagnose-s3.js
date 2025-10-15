#!/usr/bin/env node

/**
 * Detailed S3 diagnosis script
 */

import {
  S3Client,
  HeadBucketCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'padhvidhar';

async function diagnoseS3() {
  console.log('🔍 S3 Diagnosis Report');
  console.log('======================\n');

  console.log('📋 Configuration:');
  console.log(`  Region: ${process.env.AWS_REGION}`);
  console.log(`  Bucket: ${BUCKET_NAME}`);
  console.log(
    `  Access Key: ${process.env.AWS_ACCESS_KEY_ID ? process.env.AWS_ACCESS_KEY_ID.substring(0, 8) + '...' : 'NOT SET'}`
  );
  console.log(
    `  Secret Key: ${process.env.AWS_SECRET_ACCESS_KEY ? 'SET (hidden)' : 'NOT SET'}`
  );
  console.log('');

  // Test 1: Check if credentials are set
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.log('❌ Test 1: AWS credentials are missing');
    console.log(
      '💡 Make sure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set in .env'
    );
    return;
  }
  console.log('✅ Test 1: AWS credentials are configured');

  // Test 2: Check bucket access
  try {
    console.log('\n🧪 Test 2: Checking bucket access...');
    const headCommand = new HeadBucketCommand({ Bucket: BUCKET_NAME });
    await s3Client.send(headCommand);
    console.log('✅ Test 2: Bucket exists and is accessible');
  } catch (error) {
    console.log('❌ Test 2: Bucket access failed');
    console.log(`   Error: ${error.message}`);

    if (error.name === 'NoSuchBucket') {
      console.log('💡 The bucket does not exist. Please:');
      console.log('   1. Create the bucket in AWS S3 console');
      console.log("   2. Make sure it's in the correct region (ap-south-1)");
    } else if (error.name === 'Forbidden') {
      console.log('💡 Access denied. Please check:');
      console.log('   1. AWS credentials are correct');
      console.log('   2. IAM user has S3 permissions');
      console.log('   3. Bucket policy allows access');
    } else if (error.name === 'UnknownEndpoint') {
      console.log('💡 Invalid region. Please check:');
      console.log('   1. AWS_REGION is correct');
      console.log('   2. Bucket exists in the specified region');
    }
    return;
  }

  // Test 3: List objects (optional)
  try {
    console.log('\n🧪 Test 3: Listing bucket contents...');
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      MaxKeys: 5,
    });
    const response = await s3Client.send(listCommand);
    console.log('✅ Test 3: Successfully listed bucket contents');
    console.log(`   Objects found: ${response.KeyCount || 0}`);

    if (response.Contents && response.Contents.length > 0) {
      console.log('   Recent files:');
      response.Contents.slice(0, 3).forEach(obj => {
        console.log(`     - ${obj.Key} (${obj.Size} bytes)`);
      });
    }
  } catch (error) {
    console.log('⚠️  Test 3: Could not list bucket contents');
    console.log(`   Error: ${error.message}`);
    console.log(
      '   This might be due to limited permissions, but uploads may still work'
    );
  }

  console.log('\n🎉 S3 Diagnosis Complete!');

  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    console.log('\n📝 Required S3 Permissions for your IAM user:');
    console.log('```json');
    console.log('{');
    console.log('  "Version": "2012-10-17",');
    console.log('  "Statement": [');
    console.log('    {');
    console.log('      "Effect": "Allow",');
    console.log('      "Action": [');
    console.log('        "s3:PutObject",');
    console.log('        "s3:GetObject",');
    console.log('        "s3:DeleteObject",');
    console.log('        "s3:HeadBucket",');
    console.log('        "s3:ListBucket"');
    console.log('      ],');
    console.log(`      "Resource": [`);
    console.log(`        "arn:aws:s3:::${BUCKET_NAME}",`);
    console.log(`        "arn:aws:s3:::${BUCKET_NAME}/*"`);
    console.log('      ]');
    console.log('    }');
    console.log('  ]');
    console.log('}');
    console.log('```');
  }
}

diagnoseS3().catch(console.error);
