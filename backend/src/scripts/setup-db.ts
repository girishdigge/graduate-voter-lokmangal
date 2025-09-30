import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

// Load environment variables
config();

const prisma = new PrismaClient();

async function setupDatabase() {
  console.log('🔧 Setting up database...');

  try {
    // Test database connection
    console.log('📡 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Check if tables exist by trying to count users
    try {
      const userCount = await prisma.user.count();
      console.log(`📊 Found ${userCount} users in database`);

      const adminCount = await prisma.admin.count();
      console.log(`👥 Found ${adminCount} admins in database`);

      console.log('✅ Database tables are accessible');
    } catch (error) {
      console.log(
        '⚠️  Database tables may not exist yet. Run migrations first.'
      );
      console.log('💡 Use: npm run db:migrate');
    }

    // Test Prisma client generation
    console.log('🔍 Testing Prisma client...');
    const prismaVersion = await prisma.$queryRaw`SELECT VERSION() as version`;
    console.log('✅ Prisma client is working');
    console.log('📋 Database info:', prismaVersion);
  } catch (error) {
    console.error('❌ Database setup failed:', error);

    if (error instanceof Error) {
      if (error.message.includes('Access denied')) {
        console.log('\n💡 Database connection tips:');
        console.log('1. Make sure MySQL is running');
        console.log('2. Check your DATABASE_URL in .env file');
        console.log('3. Verify username and password are correct');
        console.log(
          '4. Ensure the database exists or user has CREATE privileges'
        );
      }
    }

    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupDatabase()
  .then(() => {
    console.log('🎉 Database setup completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  });
