const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function check() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  console.log('=== OPS DATA CHECK ===\n');

  // Today's appointments
  const todayAppts = await db.appointment.findMany({
    where: {
      startTime: { gte: today, lt: tomorrow },
    },
    select: { id: true, status: true, startTime: true },
  });
  console.log("Today's appointments:", todayAppts.length);
  const byStatus = {};
  todayAppts.forEach((a) => {
    byStatus[a.status] = (byStatus[a.status] || 0) + 1;
  });
  console.log('By status:', JSON.stringify(byStatus));

  // Flow states
  const flows = await db.patientFlowState.findMany({
    include: { patient: { select: { firstName: true, lastName: true } } },
  });
  console.log('\nFlow states:', flows.length);
  const byStage = {};
  flows.forEach((f) => {
    byStage[f.stage] = (byStage[f.stage] || 0) + 1;
  });
  console.log('By stage:', JSON.stringify(byStage));

  // Tasks
  const tasks = await db.operationsTask.findMany({
    select: { title: true, status: true, priority: true },
  });
  console.log('\nTasks:', tasks.length);
  tasks.forEach((t) => console.log('  -', t.status, t.priority, '-', t.title));

  // Occupancy
  const occupancy = await db.resourceOccupancy.findMany({
    include: { chair: { select: { name: true } } },
  });
  console.log('\nChair occupancy:', occupancy.length);
  occupancy.forEach((o) =>
    console.log('  -', o.chair ? o.chair.name : 'no chair', '-', o.status)
  );

  // Daily metrics
  const metrics = await db.dailyMetrics.count();
  console.log('\nDaily metrics records:', metrics);

  await db.$disconnect();
}

check().catch(console.error);
