import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

config();

const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    console.log('🔍 Checking admin user in database...');

    const admin = await prisma.admin.findUnique({
      where: { username: 'admin' },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        passwordHash: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!admin) {
      console.log('❌ Admin user not found!');
      return;
    }

    console.log('✅ Admin user found:', {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role,
      isActive: admin.isActive,
      createdAt: admin.createdAt,
      lastLoginAt: admin.lastLoginAt,
      passwordHashLength: admin.passwordHash.length,
      passwordHashPrefix: admin.passwordHash.substring(0, 10) + '...',
    });

    // Test password verification
    const testPassword = 'Admin@123';
    console.log('\n🔐 Testing password verification...');
    console.log('Test password:', testPassword);

    const isValid = await bcrypt.compare(testPassword, admin.passwordHash);
    console.log('Password valid:', isValid);

    if (!isValid) {
      console.log('\n🔧 Testing password hash generation...');
      const newHash = await bcrypt.hash(testPassword, 12);
      console.log('New hash:', newHash.substring(0, 20) + '...');

      const newHashValid = await bcrypt.compare(testPassword, newHash);
      console.log('New hash valid:', newHashValid);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();
