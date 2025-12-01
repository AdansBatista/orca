import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { createEmploymentRecordSchema } from '@/lib/validations/staff';
import {
  filterCompensationFieldsArray,
  canViewCompensation,
} from '@/lib/auth/helpers';

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

    // Filter out compensation fields if user doesn't have permission
    const filteredRecords = filterCompensationFieldsArray(
      employmentRecords as unknown as Record<string, unknown>[],
      session
    );

    return NextResponse.json({ success: true, data: filteredRecords });
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

    // Sanitize compensation data if user doesn't have permission
    // We use result.data directly but sanitize the compensation fields
    const baseData = result.data;
    const hasCompensationPermission = canViewCompensation(session);

    // Build the sanitized data object
    const sanitizedData = {
      staffProfileId: baseData.staffProfileId,
      recordType: baseData.recordType,
      effectiveDate: baseData.effectiveDate,
      previousTitle: baseData.previousTitle,
      newTitle: baseData.newTitle,
      previousDepartment: baseData.previousDepartment,
      newDepartment: baseData.newDepartment,
      previousEmploymentType: baseData.previousEmploymentType,
      newEmploymentType: baseData.newEmploymentType,
      previousStatus: baseData.previousStatus,
      newStatus: baseData.newStatus,
      reason: baseData.reason,
      notes: baseData.notes,
      // Only include compensation fields if user has permission
      ...(hasCompensationPermission && {
        previousSalary: baseData.previousSalary,
        newSalary: baseData.newSalary,
        previousHourlyRate: baseData.previousHourlyRate,
        newHourlyRate: baseData.newHourlyRate,
      }),
    };

    // Check if user tried to submit compensation data without permission
    const hasCompensationData =
      body.previousSalary || body.newSalary || body.previousHourlyRate || body.newHourlyRate;
    if (hasCompensationData && !hasCompensationPermission) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: 'You do not have permission to submit compensation data',
          },
        },
        { status: 403 }
      );
    }

    const { ipAddress, userAgent } = getRequestMeta(req);

    // Use a transaction for TERMINATION records to handle account deactivation
    if (result.data.recordType === 'TERMINATION') {
      const [employmentRecord] = await db.$transaction(async (tx) => {
        // Create the employment record
        const record = await tx.employmentRecord.create({
          data: {
            ...sanitizedData,
            clinicId: session.user.clinicId,
            createdBy: session.user.id,
          },
        });

        // Update staff profile status to TERMINATED
        await tx.staffProfile.update({
          where: { id: staffProfileId },
          data: {
            status: 'TERMINATED',
            terminationDate: result.data.effectiveDate,
            updatedBy: session.user.id,
          },
        });

        // If staff has a linked user account, deactivate it
        if (staffProfile.userId) {
          await tx.user.update({
            where: { id: staffProfile.userId },
            data: {
              isActive: false,
              updatedAt: new Date(),
            },
          });

          // Revoke all sessions for this user
          await tx.session.deleteMany({
            where: { userId: staffProfile.userId },
          });
        }

        return [record];
      });

      // Audit log the termination
      await logAudit(session, {
        action: 'CREATE',
        entity: 'EmploymentRecord',
        entityId: employmentRecord.id,
        details: {
          staffProfileId,
          recordType: 'TERMINATION',
          effectiveDate: employmentRecord.effectiveDate,
          reason: employmentRecord.reason,
          accountDeactivated: !!staffProfile.userId,
          sessionsRevoked: !!staffProfile.userId,
        },
        ipAddress,
        userAgent,
      });

      return NextResponse.json(
        { success: true, data: employmentRecord },
        { status: 201 }
      );
    }

    // Standard flow for non-TERMINATION records
    const employmentRecord = await db.employmentRecord.create({
      data: {
        ...sanitizedData,
        clinicId: session.user.clinicId,
        createdBy: session.user.id,
      },
    });

    // Audit log
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
