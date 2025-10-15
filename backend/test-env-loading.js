#!/usr/bin/env node

/**
 * Test environment variable loading
 */

import dotenv from 'dotenv';

console.log('🔍 Testing Environment Variable Loading...\n');

// Load environment variables
console.log('📁 Loading .env file...');
const result = dotenv.config();

if (result.error) {
  console.error('❌ Error loading .env file:', result.error);
} else {
  console.log('✅ .env file loaded successfully');
  console.log(`   Loaded ${Object.keys(result.parsed || {}).length} variables`);
}

console.log('\n📋 Checking AWS-related environment variables:');
console.log('─'.repeat(50));

const awsVars = [
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'S3_BUCKET_NAME',
  'S3_BUCKET_REGION',
];

awsVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Mask sensitive values
    const displayValue =
      varName.includes('SECRET') || varName.includes('KEY')
        ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
        : value;
    console.log(`✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`❌ ${varName}: Not set`);
  }
});

console.log('\n📋 Other important variables:');
console.log('─'.repeat(50));

const otherVars = ['DATABASE_URL', 'JWT_SECRET', 'PORT', 'NODE_ENV'];

otherVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    const displayValue =
      varName.includes('SECRET') || varName.includes('URL')
        ? `${value.substring(0, 10)}...`
        : value;
    console.log(`✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`❌ ${varName}: Not set`);
  }
});

console.log('\n💡 If AWS variables are not set, check:');
console.log('1. .env file exists in backend directory');
console.log('2. .env file has correct format (no spaces around =)');
console.log('3. .env file is not corrupted');
console.log('4. Working directory is correct when running the server');
