import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

/**
 * DEBUG: Check equipment data
 * Remove this file in production!
 */
export async function GET() {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' });
  }

  const clinicId = session.user.clinicId;

  // Count all equipment
  const totalEquipment = await db.equipment.count();

  // Count equipment for this clinic
  const clinicEquipment = await db.equipment.count({
    where: { clinicId },
  });

  // Count with deletedAt filter
  const activeEquipment = await db.equipment.count({
    where: { clinicId, deletedAt: null },
  });

  // Get sample equipment
  const sampleEquipment = await db.equipment.findMany({
    where: { clinicId, deletedAt: null },
    take: 3,
    select: { id: true, name: true, clinicId: true, deletedAt: true },
  });

  // Get all equipment IDs for comparison
  const allEquipmentClinicIds = await db.equipment.findMany({
    select: { clinicId: true },
    distinct: ['clinicId'],
  });

  return NextResponse.json({
    sessionClinicId: clinicId,
    totalEquipment,
    clinicEquipment,
    activeEquipment,
    sampleEquipment,
    allEquipmentClinicIds: allEquipmentClinicIds.map(e => e.clinicId),
    match: allEquipmentClinicIds.some(e => e.clinicId === clinicId),
  });
}
