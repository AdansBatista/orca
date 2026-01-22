import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env file
config({ path: resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: npx tsx scripts/add-autoclave.ts <name> <ip-address> [port]');
    console.log('');
    console.log('Example:');
    console.log('  npx tsx scripts/add-autoclave.ts "StatClave 1" 192.168.0.15 80');
    console.log('  npx tsx scripts/add-autoclave.ts "StatClave 2" 192.168.0.23');
    process.exit(1);
  }

  const name = args[0];
  const ipAddress = args[1];
  const port = args[2] ? parseInt(args[2]) : 80;

  const clinicId = process.env.CLINIC_ID;
  if (!clinicId) {
    console.error('Error: CLINIC_ID environment variable not set');
    process.exit(1);
  }

  try {
    console.log('\nCreating autoclave...');
    console.log(`  Name: ${name}`);
    console.log(`  IP: ${ipAddress}`);
    console.log(`  Port: ${port}`);
    console.log(`  Clinic: ${clinicId}`);
    console.log('');

    // First, check if we have any equipment to link to
    const equipment = await prisma.equipment.findFirst({
      where: { clinicId },
    });

    if (!equipment) {
      console.warn('⚠ No equipment found for clinic. Creating dummy equipment...');
      // Ensure an equipment type exists for sterilization
      let equipmentType = await prisma.equipmentType.findFirst({
        where: { clinicId, category: 'STERILIZATION' },
      });
      if (!equipmentType) {
        equipmentType = await prisma.equipmentType.create({
          data: {
            clinicId,
            name: 'Autoclave',
            code: 'AUTOCLAVE',
            category: 'STERILIZATION',
          },
        });
      }

      const dummyEquipment = await prisma.equipment.create({
        data: {
          clinicId,
          name: 'Autoclave Equipment',
          equipmentNumber: 'EQ-AUTO-001',
          typeId: equipmentType.id,
          category: 'STERILIZATION',
          serialNumber: 'SETUP-001',
          status: 'ACTIVE',
        },
      });

      const autoclave = await prisma.autoclaveIntegration.create({
        data: {
          name,
          ipAddress,
          port,
          status: 'NOT_CONFIGURED',
          clinic: {
            connect: { id: clinicId },
          },
          equipment: {
            connect: { id: dummyEquipment.id },
          },
        },
      });

      return autoclave;
    }

    const autoclave = await prisma.autoclaveIntegration.create({
      data: {
        name,
        ipAddress,
        port,
        status: 'NOT_CONFIGURED',
        clinic: {
          connect: { id: clinicId },
        },
        equipment: {
          connect: { id: equipment.id },
        },
      },
    });

    console.log('✓ Autoclave created successfully!');
    console.log(`  ID: ${autoclave.id}`);
    console.log('');
    console.log('Test the connection:');
    console.log(`  curl -X POST http://localhost:3001/api/autoclaves/${autoclave.id}/test`);
    console.log('');
  } catch (error) {
    console.error('✗ Failed to create autoclave:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
