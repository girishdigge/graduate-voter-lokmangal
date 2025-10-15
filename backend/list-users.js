#!/usr/bin/env node

/**
 * Script to list existing users for testing
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
  try {
    console.log('👥 Listing existing users...\n');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        aadharNumber: true,
        contact: true,
        email: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10, // Show first 10 users
    });

    if (users.length === 0) {
      console.log('❌ No users found in the database');
      console.log(
        '\n💡 You need to create a user first through the registration API'
      );
      return;
    }

    console.log(`✅ Found ${users.length} users:\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. User ID: ${user.id}`);
      console.log(`   Name: ${user.fullName}`);
      console.log(`   Aadhar: ${user.aadharNumber}`);
      console.log(`   Contact: ${user.contact}`);
      console.log(`   Email: ${user.email || 'Not provided'}`);
      console.log(`   Created: ${user.createdAt.toISOString()}`);
      console.log('');
    });

    console.log(
      '📝 You can use any of these User IDs for testing document upload'
    );

    return users;
  } catch (error) {
    console.error('❌ Error listing users:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
listUsers().catch(console.error);
