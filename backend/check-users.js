#!/usr/bin/env node

/**
 * Check existing users in the database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Checking existing users in database...\n');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        aadharNumber: true,
        fullName: true,
        contact: true,
        email: true,
        createdAt: true,
      },
      take: 10, // Limit to first 10 users
    });

    if (users.length === 0) {
      console.log('❌ No users found in database');
      console.log('💡 You need to enroll a user first using /api/users/enroll');
      return null;
    }

    console.log(`✅ Found ${users.length} users:`);
    console.log('');

    users.forEach((user, index) => {
      console.log(`${index + 1}. User ID: ${user.id}`);
      console.log(`   Name: ${user.fullName}`);
      console.log(`   Aadhar: ${user.aadharNumber}`);
      console.log(`   Contact: ${user.contact}`);
      console.log(`   Email: ${user.email || 'Not provided'}`);
      console.log(`   Created: ${user.createdAt.toISOString()}`);
      console.log('');
    });

    return users[0]; // Return first user for testing
  } catch (error) {
    console.error('❌ Error checking users:', error.message);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkUsers().then(user => {
  if (user) {
    console.log(
      `💡 You can use User ID "${user.id}" for testing document upload`
    );
    console.log(`   Run: node test-with-existing-user.js ${user.id}`);
  }
});
