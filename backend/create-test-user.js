#!/usr/bin/env node

/**
 * Script to create a test user for document upload testing
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🔧 Creating test user for document upload testing...\n');

    const testUser = {
      id: 'test-user-123',
      aadharNumber: '123456789012',
      fullName: 'Test User',
      sex: 'MALE',
      contact: '9876543210',
      dateOfBirth: new Date('1990-01-01'),
      age: 34,
      houseNumber: '123',
      street: 'Test Street',
      area: 'Test Area',
      city: 'Test City',
      state: 'Test State',
      pincode: '123456',
    };

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { id: testUser.id },
    });

    if (existingUser) {
      console.log('✅ Test user already exists:');
      console.log(`   ID: ${existingUser.id}`);
      console.log(`   Name: ${existingUser.fullName}`);
      console.log(`   Aadhar: ${existingUser.aadharNumber}`);
      return existingUser;
    }

    // Create new test user
    const user = await prisma.user.create({
      data: testUser,
    });

    console.log('✅ Test user created successfully:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.fullName}`);
    console.log(`   Aadhar: ${user.aadharNumber}`);
    console.log(`   Contact: ${user.contact}`);

    return user;
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);

    if (error.code === 'P2002') {
      console.log('\n💡 User with this Aadhar number already exists');
      console.log(
        '   Try using a different Aadhar number or delete the existing user'
      );
    }

    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createTestUser()
  .then(() => {
    console.log('\n🎉 Test user setup completed!');
    console.log('\n📝 You can now test document upload with:');
    console.log('   User ID: test-user-123');
    console.log('   Command: node debug-upload.js');
  })
  .catch(error => {
    console.error('\n💥 Failed to create test user');
    process.exit(1);
  });
