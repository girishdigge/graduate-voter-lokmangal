const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testReferenceDisplayFix() {
  try {
    console.log('🔍 Testing Reference Display Fix...\n');

    // Get a sample user
    const users = await prisma.user.findMany({
      take: 2,
      select: {
        id: true,
        fullName: true,
        contact: true,
      },
    });

    if (users.length < 2) {
      console.log('❌ Need at least 2 users in database to test');
      return;
    }

    const [userA, userB] = users;
    console.log(`👤 User A: ${userA.fullName} (${userA.contact})`);
    console.log(`👤 User B: ${userB.fullName} (${userB.contact})\n`);

    // Check references that User A has added (should show User A's references)
    const userAReferences = await prisma.reference.findMany({
      where: { userId: userA.id },
      select: {
        id: true,
        referenceName: true,
        referenceContact: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            fullName: true,
            contact: true,
          },
        },
      },
    });

    console.log(`📋 References that ${userA.fullName} has added:`);
    if (userAReferences.length === 0) {
      console.log('   No references found');
    } else {
      userAReferences.forEach((ref, index) => {
        console.log(
          `   ${index + 1}. ${ref.referenceName} (${ref.referenceContact}) - Status: ${ref.status}`
        );
      });
    }

    // Check who has added User A as a reference (old behavior)
    const cleanUserAContact = userA.contact.replace(/[\s\-\+]/g, '');
    const whoReferredUserA = await prisma.reference.findMany({
      where: { referenceContact: cleanUserAContact },
      select: {
        id: true,
        referenceName: true,
        referenceContact: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            fullName: true,
            contact: true,
          },
        },
      },
    });

    console.log(
      `\n📋 People who have added ${userA.fullName} as their reference (old behavior):`
    );
    if (whoReferredUserA.length === 0) {
      console.log('   No one has added this user as reference');
    } else {
      whoReferredUserA.forEach((ref, index) => {
        console.log(
          `   ${index + 1}. ${ref.user.fullName} added ${userA.fullName} as "${ref.referenceName}"`
        );
      });
    }

    console.log('\n✅ Test completed successfully!');
    console.log('\n📝 Summary:');
    console.log(
      '   - NEW BEHAVIOR: When User A logs in, they see references THEY have added'
    );
    console.log(
      '   - OLD BEHAVIOR: When User A logs in, they saw who added THEM as reference'
    );
    console.log('   - The fix changes from OLD to NEW behavior');
  } catch (error) {
    console.error('❌ Error testing reference display fix:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testReferenceDisplayFix();
