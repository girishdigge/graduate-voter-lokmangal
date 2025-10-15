#!/usr/bin/env node

/**
 * Test environment variable loading
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔍 Environment Variables Test');
console.log('==============================\n');

console.log('📋 AWS Configuration:');
console.log(`  AWS_REGION: ${process.env.AWS_REGION || 'NOT SET'}`);
console.log(
  `  AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? process.env.AWS_ACCESS_KEY_ID.substring(0, 8) + '...' : 'NOT SET'}`
);
console.log(
  `  AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? 'SET (hidden)' : 'NOT SET'}`
);
console.log(`  S3_BUCKET_NAME: ${process.env.S3_BUCKET_NAME || 'NOT SET'}`);
console.log(`  S3_BUCKET_REGION: ${process.env.S3_BUCKET_REGION || 'NOT SET'}`);

console.log('\n📋 Other Configuration:');
console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'NOT SET'}`);
console.log(`  PORT: ${process.env.PORT || 'NOT SET'}`);
console.log(
  `  DATABASE_URL: ${process.env.DATABASE_URL ? 'SET (hidden)' : 'NOT SET'}`
);
console.log(
  `  JWT_SECRET: ${process.env.JWT_SECRET ? 'SET (hidden)' : 'NOT SET'}`
);

console.log('\n🧪 Testing AWS SDK Configuration...');

try {
  // Test AWS SDK configuration
  const { S3Client } = await import('@aws-sdk/client-s3');

  const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials:
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined,
  });

  console.log('✅ AWS SDK client created successfully');
  console.log(`   Region: ${process.env.AWS_REGION}`);
  console.log(
    `   Has Credentials: ${!!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)}`
  );
} catch (error) {
  console.log('❌ AWS SDK configuration failed:', error.message);
}

console.log('\n✨ Environment test completed!');
