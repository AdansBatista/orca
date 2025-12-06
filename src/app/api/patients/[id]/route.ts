import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth } from '@/lib/auth/with-auth';

/**
 * GET /api/patients/[id]
 * Get a single patient by ID
 *
 * Used by PatientDetailSheet and other components that need patient details
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;

    // For super_admin without clinicId, get patients from first clinic
    let clinicId: string | null | undefined = session.user.clinicId;
    if (!clinicId && session.user.role === 'super_admin') {
      const firstClinic = await db.clinic.findFirst({ select: { id: true } });
      clinicId = firstClinic?.id;
    }

    if (!clinicId) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_CLINIC', message: 'No clinic context' } },
        { status: 400 }
      );
    }

    const patient = await db.patient.findFirst({
      where: withSoftDelete({ id, clinicId }),
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Patient not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: patient,
    });
  },
  { permissions: ['patients:read'] }
);
