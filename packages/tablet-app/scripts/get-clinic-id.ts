import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const clinics = await prisma.clinic.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (clinics.length === 0) {
      console.log('No clinics found in database.');
      console.log('You may need to run the main Orca app seeding first.');
    } else {
      console.log('\nFound clinics:');
      console.log('─'.repeat(60));
      clinics.forEach((clinic, index) => {
        console.log(`${index + 1}. ${clinic.name}`);
        console.log(`   ID: ${clinic.id}`);
        console.log(`   Created: ${clinic.createdAt.toISOString()}`);
        console.log('');
      });

      if (clinics.length === 1) {
        console.log('✓ Using the only clinic found.');
        console.log(`\nAdd this to your .env file:`);
        console.log(`CLINIC_ID="${clinics[0].id}"`);
      } else {
        console.log(`\nMultiple clinics found. Choose one and add to .env:`);
        console.log(`CLINIC_ID="<clinic-id-from-above>"`);
      }
    }
  } catch (error) {
    console.error('Error querying database:', error);
    console.error('\nMake sure MongoDB is running and DATABASE_URL is correct.');
  } finally {
    await prisma.$disconnect();
  }
}

main();
