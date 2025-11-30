import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { createEmploymentRecordSchema } from '@/lib/validations/staff';

/**
 * GET /api/staff/[id]/employment-records
 * List all employment records for a staff member
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id: staffProfileId } = await context.params;

    // Verify staff profile exists and belongs to clinic
    const staffProfile = await db.staffProfile.findFirst({
      where: {
        id: staffProfileId,
        ...getClinicFilter(session),
        deletedAt: null,
      },
    });

    if (!staffProfile) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Staff profile not found',
          },
        },
        { status: 404 }
      );
    }

    const employmentRecords = await db.employmentRecord.findMany({
      where: {
        staffProfileId,
        ...getClinicFilter(session),
      },
      orderBy: [
        { effectiveDate: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ success: true, data: employmentRecords });
  },
  { permissions: ['staff:view', 'staff:edit', 'staff:full'] }
);

/**
 * POST /api/staff/[id]/employment-records
 * Add a new employment record to a staff member
 */
export const POST = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id: staffProfileId } = await context.params;
    const body = await req.json();

    // Verify staff profile exists and belongs to clinic
    const staffProfile = await db.staffProfile.findFirst({
      where: {
        id: staffProfileId,
        ...getClinicFilter(session),
        deletedAt: null,
      },
    });

    if (!staffProfile) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Staff profile not found',
          },
        },
        { status: 404 }
      );
    }

    // Validate input
    const result = createEmploymentRecordSchema.safeParse({
      ...body,
      staffProfileId,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid employment record data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Create the employment record
    const employmentRecord = await db.employmentRecord.create({
      data: {
        ...result.data,
        clinicId: session.user.clinicId,
        createdBy: session.user.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'EmploymentRecord',
      entityId: employmentRecord.id,
      details: {
        staffProfileId,
        recordType: employmentRecord.recordType,
        effectiveDate: employmentRecord.effectiveDate,
        reason: employmentRecord.reason,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { success: true, data: employmentRecord },
      { status: 201 }
    );
  },
  { permissions: ['staff:edit', 'staff:full'] }
);
