import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

config();

const prisma = new PrismaClient();

async function fixAdminPassword() {
  try {
    console.log('🔧 Fixing admin password...');

    const password = 'Admin@123';
    const hashedPassword = await bcrypt.hash(password, 12);

    console.log('Generated new password hash');

    const updatedAdmin = await prisma.admin.update({
      where: { username: 'admin' },
      data: { passwordHash: hashedPassword },
      select: {
        id: true,
        username: true,
        email: true,
        isActive: true,
      },
    });

    console.log('✅ Admin password updated:', updatedAdmin);

    // Verify the new password works
    const admin = await prisma.admin.findUnique({
      where: { username: 'admin' },
      select: { passwordHash: true },
    });

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    console.log('✅ Password verification:', isValid ? 'SUCCESS' : 'FAILED');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminPassword();
