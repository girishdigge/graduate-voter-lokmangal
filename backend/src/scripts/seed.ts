import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

// Load environment variables
config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Create default admin user
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123';
    const hashedPassword = await bcrypt.hash(
      adminPassword,
      parseInt(process.env.BCRYPT_ROUNDS || '12')
    );

    const defaultAdmin = await prisma.admin.upsert({
      where: { username: process.env.DEFAULT_ADMIN_USERNAME || 'admin' },
      update: {},
      create: {
        username: process.env.DEFAULT_ADMIN_USERNAME || 'admin',
        email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@votersystem.com',
        passwordHash: hashedPassword,
        fullName: 'System Administrator',
        role: 'ADMIN',
        isActive: true,
      },
    });

    console.log('✅ Created default admin user:', {
      id: defaultAdmin.id,
      username: defaultAdmin.username,
      email: defaultAdmin.email,
      role: defaultAdmin.role,
    });

    // Create a test manager user
    const managerPassword = 'Manager@123';
    const hashedManagerPassword = await bcrypt.hash(
      managerPassword,
      parseInt(process.env.BCRYPT_ROUNDS || '12')
    );

    const testManager = await prisma.admin.upsert({
      where: { username: 'manager' },
      update: {},
      create: {
        username: 'manager',
        email: 'manager@votersystem.com',
        passwordHash: hashedManagerPassword,
        fullName: 'Test Manager',
        role: 'MANAGER',
        isActive: true,
      },
    });

    console.log('✅ Created test manager user:', {
      id: testManager.id,
      username: testManager.username,
      email: testManager.email,
      role: testManager.role,
    });

    // Create sample test users for development
    const testUsers = [
      {
        aadharNumber: '123456789012',
        fullName: 'Rajesh Kumar Sharma',
        sex: 'MALE' as const,
        guardianSpouse: 'Ramesh Kumar Sharma',
        qualification: 'Graduate',
        occupation: 'Software Engineer',
        contact: '9876543210',
        email: 'rajesh.sharma@example.com',
        dateOfBirth: new Date('1990-05-15'),
        age: 34,
        houseNumber: '123',
        street: 'MG Road',
        area: 'Koregaon Park',
        city: 'PUNE',
        state: 'Maharashtra',
        pincode: '411001',
        isRegisteredElector: true,
        assemblyNumber: '145',
        assemblyName: 'Pune Cantonment',
        pollingStationNumber: '45',
        epicNumber: 'ABC1234567',
        disabilities: JSON.stringify(['VISUAL_IMPAIRMENT']),
        university: 'Pune University',
        graduationYear: 2012,
        graduationDocType: 'BE Computer Science',
      },
      {
        aadharNumber: '234567890123',
        fullName: 'Priya Patel',
        sex: 'FEMALE' as const,
        guardianSpouse: 'Amit Patel',
        qualification: 'Post Graduate',
        occupation: 'Teacher',
        contact: '9876543211',
        email: 'priya.patel@example.com',
        dateOfBirth: new Date('1988-08-22'),
        age: 36,
        houseNumber: '456',
        street: 'FC Road',
        area: 'Shivajinagar',
        city: 'PUNE',
        state: 'Maharashtra',
        pincode: '411005',
        isRegisteredElector: true,
        assemblyNumber: '146',
        assemblyName: 'Shivajinagar',
        pollingStationNumber: '78',
        epicNumber: 'DEF2345678',
        disabilities: null,
        university: 'Mumbai University',
        graduationYear: 2010,
        graduationDocType: 'MA English',
      },
      {
        aadharNumber: '345678901234',
        fullName: 'Arjun Singh',
        sex: 'MALE' as const,
        guardianSpouse: 'Vikram Singh',
        qualification: 'Graduate',
        occupation: 'Business Owner',
        contact: '9876543212',
        email: 'arjun.singh@example.com',
        dateOfBirth: new Date('1985-12-10'),
        age: 39,
        houseNumber: '789',
        street: 'JM Road',
        area: 'Deccan',
        city: 'PUNE',
        state: 'Maharashtra',
        pincode: '411004',
        isRegisteredElector: false,
        university: 'Pune University',
        graduationYear: 2007,
        graduationDocType: 'BCom',
      },
    ];

    for (const userData of testUsers) {
      const user = await prisma.user.upsert({
        where: { aadharNumber: userData.aadharNumber },
        update: {},
        create: userData,
      });

      console.log('✅ Created test user:', {
        id: user.id,
        name: user.fullName,
        aadhar: user.aadharNumber,
        contact: user.contact,
      });

      // Add sample references for each user
      const references = [
        {
          userId: user.id,
          referenceName: `Reference 1 for ${user.fullName.split(' ')[0]}`,
          referenceContact: `98765432${Math.floor(Math.random() * 100)
            .toString()
            .padStart(2, '0')}`,
          status: 'PENDING' as const,
        },
        {
          userId: user.id,
          referenceName: `Reference 2 for ${user.fullName.split(' ')[0]}`,
          referenceContact: `98765432${Math.floor(Math.random() * 100)
            .toString()
            .padStart(2, '0')}`,
          status: 'CONTACTED' as const,
        },
      ];

      for (const refData of references) {
        const reference = await prisma.reference.create({
          data: refData,
        });

        console.log('✅ Created reference:', {
          id: reference.id,
          name: reference.referenceName,
          contact: reference.referenceContact,
          status: reference.status,
        });
      }
    }

    // Create sample audit logs
    const sampleAuditLog = await prisma.auditLog.create({
      data: {
        entityType: 'User',
        entityId: 'system',
        action: 'SEED_DATABASE',
        newValues: {
          message: 'Database seeded with initial data',
          timestamp: new Date().toISOString(),
        },
        adminId: defaultAdmin.id,
        ipAddress: '127.0.0.1',
        userAgent: 'Database Seeder Script',
      },
    });

    console.log('✅ Created audit log entry:', {
      id: sampleAuditLog.id,
      action: sampleAuditLog.action,
    });

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`- Created 1 admin user (username: ${defaultAdmin.username})`);
    console.log(`- Created 1 manager user (username: ${testManager.username})`);
    console.log(`- Created ${testUsers.length} test users`);
    console.log(`- Created ${testUsers.length * 2} test references`);
    console.log('- Created audit log entries');
    console.log('\n🔐 Default Credentials:');
    console.log(`Admin: ${defaultAdmin.username} / ${adminPassword}`);
    console.log(`Manager: ${testManager.username} / ${managerPassword}`);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch(e => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
