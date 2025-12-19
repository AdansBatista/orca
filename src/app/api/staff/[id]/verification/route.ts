import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { canViewCompensation } from '@/lib/auth/helpers';
import { withSoftDelete } from '@/lib/db/soft-delete';

/**
 * GET /api/staff/[id]/verification
 * Generate employment verification data for a staff member
 *
 * This endpoint returns structured data that can be used to generate
 * employment verification letters. The data includes:
 * - Basic employee information
 * - Employment dates and status
 * - Job title and department
 * - Clinic information (for letterhead)
 *
 * Query params:
 * - includeSalary: 'true' to include salary info (requires staff:compensation permission)
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id: staffProfileId } = await context.params;
    const { searchParams } = new URL(req.url);
    const includeSalary = searchParams.get('includeSalary') === 'true';

    // Verify staff profile exists and belongs to clinic
    const staffProfile = await db.staffProfile.findFirst({
      where: withSoftDelete({
        id: staffProfileId,
        ...getClinicFilter(session),
      }),
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

    // Get clinic info for letterhead
    const clinic = await db.clinic.findUnique({
      where: { id: session.user.clinicId },
      select: {
        name: true,
        address: true,
        phone: true,
        email: true,
      },
    });

    // Check salary permission if requested
    const hasCompensationPermission = canViewCompensation(session);
    if (includeSalary && !hasCompensationPermission) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: 'You do not have permission to view compensation data',
          },
        },
        { status: 403 }
      );
    }

    // Get the most recent salary from employment records if requested
    let currentSalary: number | null = null;
    let currentHourlyRate: number | null = null;

    if (includeSalary && hasCompensationPermission) {
      const latestSalaryRecord = await db.employmentRecord.findFirst({
        where: {
          staffProfileId,
          ...getClinicFilter(session),
          OR: [
            { newSalary: { not: null } },
            { newHourlyRate: { not: null } },
          ],
        },
        orderBy: { effectiveDate: 'desc' },
        select: {
          newSalary: true,
          newHourlyRate: true,
        },
      });

      if (latestSalaryRecord) {
        currentSalary = latestSalaryRecord.newSalary;
        currentHourlyRate = latestSalaryRecord.newHourlyRate;
      }
    }

    // Build verification data
    const verificationData = {
      generatedAt: new Date().toISOString(),
      verificationId: `EV-${Date.now()}-${staffProfileId.slice(-6)}`,

      employee: {
        firstName: staffProfile.firstName,
        lastName: staffProfile.lastName,
        employeeNumber: staffProfile.employeeNumber,
        title: staffProfile.title,
        department: staffProfile.department,
      },

      employment: {
        status: staffProfile.status,
        employmentType: staffProfile.employmentType,
        hireDate: staffProfile.hireDate,
        terminationDate: staffProfile.terminationDate,
        isCurrentlyEmployed: staffProfile.status === 'ACTIVE' || staffProfile.status === 'ON_LEAVE',
      },

      employer: {
        name: clinic?.name,
        address: clinic?.address,
        phone: clinic?.phone,
        email: clinic?.email,
      },

      // Only include salary data if requested and permitted
      ...(includeSalary && hasCompensationPermission && {
        compensation: {
          annualSalary: currentSalary,
          hourlyRate: currentHourlyRate,
        },
      }),
    };

    // Audit log the verification request
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'READ',
      entity: 'EmploymentVerification',
      entityId: staffProfileId,
      details: {
        staffProfileId,
        includedSalary: includeSalary && hasCompensationPermission,
        verificationId: verificationData.verificationId,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: verificationData,
    });
  },
  { permissions: ['staff:view', 'staff:edit', 'staff:full'] }
);
