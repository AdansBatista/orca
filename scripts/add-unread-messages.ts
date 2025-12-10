import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function addUnreadMessages() {
  // Find Emma's patient record
  const emma = await db.patient.findFirst({
    where: { email: { contains: 'emma' } }
  });

  if (!emma) {
    console.log('Emma not found');
    return;
  }

  console.log('Found Emma:', emma.id, emma.email);

  // Find an admin user for createdBy
  const adminUser = await db.user.findFirst({
    where: { clinicId: emma.clinicId, role: { in: ['clinic_admin', 'super_admin'] } }
  });

  if (!adminUser) {
    console.log('No admin user found');
    return;
  }

  console.log('Found admin:', adminUser.id);

  // Delete any existing unread messages for Emma (for fresh test)
  const deleted = await db.message.deleteMany({
    where: {
      patientId: emma.id,
      direction: 'INBOUND',
      readAt: null
    }
  });
  console.log('Deleted existing unread:', deleted.count);

  // Add 3 unread messages
  const now = new Date();
  const messages = [
    {
      subject: 'Appointment Reminder',
      body: 'Reminder: Your appointment is scheduled for Monday at 10:00 AM.',
      channel: 'EMAIL',
      hoursAgo: 2,
    },
    {
      subject: 'Treatment Update',
      body: 'Your treatment plan has been updated. Please review.',
      channel: 'IN_APP',
      hoursAgo: 5,
    },
    {
      subject: null,
      body: 'How are you feeling after your last adjustment?',
      channel: 'SMS',
      hoursAgo: 24,
    },
  ];

  for (const msg of messages) {
    const sentAt = new Date(now.getTime() - msg.hoursAgo * 60 * 60 * 1000);
    await db.message.create({
      data: {
        clinicId: emma.clinicId,
        patientId: emma.id,
        channel: msg.channel as 'SMS' | 'EMAIL' | 'IN_APP' | 'PUSH',
        direction: 'INBOUND',
        status: 'DELIVERED',
        subject: msg.subject,
        body: msg.body,
        sentAt,
        readAt: null,
        createdBy: adminUser.id,
      }
    });
  }

  console.log('Created 3 unread messages for Emma');

  // Verify
  const count = await db.message.count({
    where: { patientId: emma.id, direction: 'INBOUND', readAt: null }
  });
  console.log('Unread count:', count);

  await db.$disconnect();
}

addUnreadMessages().catch(console.error);
