import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateStaffProfileSchema } from '@/lib/validations/staff';

/**
 * GET /api/staff/[id]
 * Get a single staff profile with all related data
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    const staffProfile = await db.staffProfile.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
        deletedAt: null,
      },
      include: {
        credentials: {
          orderBy: { expirationDate: 'asc' },
        },
        certifications: {
          orderBy: { expirationDate: 'asc' },
        },
        emergencyContacts: {
          orderBy: { isPrimary: 'desc' },
        },
        employmentRecords: {
          orderBy: { effectiveDate: 'desc' },
          take: 10,
        },
        supervisor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
        defaultScheduleTemplate: {
          select: {
            id: true,
            name: true,
          },
        },
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

    return NextResponse.json({ success: true, data: staffProfile });
  },
  { permissions: ['staff:view', 'staff:edit', 'staff:full'] }
);

/**
 * PATCH /api/staff/[id]
 * Update a staff profile
 */
export const PATCH = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Find existing staff profile
    const existing = await db.staffProfile.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
        deletedAt: null,
      },
    });

    if (!existing) {
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
    const result = updateStaffProfileSchema.safeParse({ ...body, id });
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid staff profile data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { id: _, ...updateData } = result.data;

    // Check for duplicate employee number if changing
    if (updateData.employeeNumber && updateData.employeeNumber !== existing.employeeNumber) {
      const duplicate = await db.staffProfile.findFirst({
        where: {
          clinicId: session.user.clinicId,
          employeeNumber: updateData.employeeNumber,
          deletedAt: null,
          id: { not: id },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DUPLICATE_EMPLOYEE_NUMBER',
              message: 'An employee with this employee number already exists',
            },
          },
          { status: 409 }
        );
      }
    }

    // Check for duplicate email if changing
    if (updateData.email && updateData.email !== existing.email) {
      const duplicate = await db.staffProfile.findFirst({
        where: {
          clinicId: session.user.clinicId,
          email: updateData.email,
          deletedAt: null,
          id: { not: id },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DUPLICATE_EMAIL',
              message: 'A staff member with this email already exists',
            },
          },
          { status: 409 }
        );
      }
    }

    // Track status changes for employment records
    const statusChanged = updateData.status && updateData.status !== existing.status;
    const titleChanged = updateData.title && updateData.title !== existing.title;
    const departmentChanged = updateData.department && updateData.department !== existing.department;
    const employmentTypeChanged = updateData.employmentType && updateData.employmentType !== existing.employmentType;

    // Update the staff profile
    const staffProfile = await db.staffProfile.update({
      where: { id },
      data: {
        ...updateData,
        updatedBy: session.user.id,
      },
    });

    // Create employment record if significant changes
    if (statusChanged || titleChanged || departmentChanged || employmentTypeChanged) {
      let recordType = 'STATUS_CHANGE';
      if (titleChanged && !statusChanged) recordType = 'PROMOTION';
      if (departmentChanged && !statusChanged && !titleChanged) recordType = 'TRANSFER';
      if (updateData.status === 'TERMINATED') recordType = 'TERMINATION';

      await db.employmentRecord.create({
        data: {
          staffProfileId: id,
          clinicId: session.user.clinicId,
          recordType,
          effectiveDate: new Date(),
          previousTitle: titleChanged ? existing.title : undefined,
          newTitle: titleChanged ? updateData.title : undefined,
          previousDepartment: departmentChanged ? existing.department : undefined,
          newDepartment: departmentChanged ? updateData.department : undefined,
          previousEmploymentType: employmentTypeChanged ? existing.employmentType : undefined,
          newEmploymentType: employmentTypeChanged ? updateData.employmentType : undefined,
          previousStatus: statusChanged ? existing.status : undefined,
          newStatus: statusChanged ? updateData.status : undefined,
          createdBy: session.user.id,
        },
      });
    }

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'StaffProfile',
      entityId: id,
      details: {
        changes: Object.keys(updateData),
        statusChanged,
        titleChanged,
        departmentChanged,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: staffProfile });
  },
  { permissions: ['staff:edit', 'staff:full'] }
);

/**
 * DELETE /api/staff/[id]
 * Soft delete a staff profile
 */
export const DELETE = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    // Find existing staff profile
    const existing = await db.staffProfile.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
        deletedAt: null,
      },
    });

    if (!existing) {
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

    // Soft delete
    await db.staffProfile.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'TERMINATED',
        terminationDate: new Date(),
        updatedBy: session.user.id,
      },
    });

    // Create termination employment record
    await db.employmentRecord.create({
      data: {
        staffProfileId: id,
        clinicId: session.user.clinicId,
        recordType: 'TERMINATION',
        effectiveDate: new Date(),
        previousStatus: existing.status,
        newStatus: 'TERMINATED',
        createdBy: session.user.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'StaffProfile',
      entityId: id,
      details: {
        employeeNumber: existing.employeeNumber,
        name: `${existing.firstName} ${existing.lastName}`,
        softDelete: true,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { id } });
  },
  { permissions: ['staff:full'] }
);
