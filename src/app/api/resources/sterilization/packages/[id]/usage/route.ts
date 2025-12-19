import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { recordPackageUsageSchema, packageUsageQuerySchema } from '@/lib/validations/sterilization';

/**
 * GET /api/resources/sterilization/packages/:id/usage
 * List usage history for a package
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const { searchParams } = new URL(req.url);

    // Verify package exists
    const pkg = await db.instrumentPackage.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!pkg) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PACKAGE_NOT_FOUND',
            message: 'Instrument package not found',
          },
        },
        { status: 404 }
      );
    }

    // Parse query parameters
    const rawParams = {
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = packageUsageQuerySchema.safeParse(rawParams);

    if (!queryResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: queryResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { page, pageSize, sortBy, sortOrder } = queryResult.data;

    const where = {
      packageId: id,
      ...getClinicFilter(session),
    };

    const total = await db.packageUsage.count({ where });

    const usages = await db.packageUsage.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      success: true,
      data: {
        items: usages,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
  { permissions: ['sterilization:read'] }
);

/**
 * POST /api/resources/sterilization/packages/:id/usage
 * Record usage of a package with a patient
 */
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Add packageId to body for validation
    const validationBody = { ...body, packageId: id };

    // Validate input
    const result = recordPackageUsageSchema.safeParse(validationBody);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid usage data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify package exists and can be used
    const pkg = await db.instrumentPackage.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
      include: {
        cycle: {
          select: {
            cycleNumber: true,
            status: true,
            biologicalPass: true,
          },
        },
      },
    });

    if (!pkg) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PACKAGE_NOT_FOUND',
            message: 'Instrument package not found',
          },
        },
        { status: 404 }
      );
    }

    // Validate package can be used
    const now = new Date();
    if (pkg.status === 'USED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PACKAGE_ALREADY_USED',
            message: 'This package has already been used',
          },
        },
        { status: 400 }
      );
    }

    if (pkg.status === 'EXPIRED' || pkg.expirationDate < now) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PACKAGE_EXPIRED',
            message: 'This package has expired and cannot be used',
          },
        },
        { status: 400 }
      );
    }

    if (pkg.status === 'COMPROMISED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PACKAGE_COMPROMISED',
            message: 'This package has been marked as compromised',
          },
        },
        { status: 400 }
      );
    }

    if (pkg.status === 'RECALLED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PACKAGE_RECALLED',
            message: 'This package has been recalled',
          },
        },
        { status: 400 }
      );
    }

    // Warning if sterilization cycle had issues (but still allow)
    if (pkg.cycle.biologicalPass === false) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CYCLE_FAILED',
            message: 'Cannot use package from a failed sterilization cycle',
          },
        },
        { status: 400 }
      );
    }

    // Verify patient exists
    const patient = await db.patient.findFirst({
      where: withSoftDelete({
        id: data.patientId,
        clinicId: session.user.clinicId,
      }),
    });

    if (!patient) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PATIENT_NOT_FOUND',
            message: 'Patient not found',
          },
        },
        { status: 404 }
      );
    }

    // Note: Appointment verification skipped - model may not exist yet
    // When Appointment model is added, uncomment this:
    // if (data.appointmentId) {
    //   const appointment = await db.appointment.findFirst({...});
    // }

    // Create usage record and update package status in transaction
    const [usage] = await db.$transaction([
      db.packageUsage.create({
        data: {
          clinicId: session.user.clinicId,
          packageId: id,
          patientId: data.patientId,
          appointmentId: data.appointmentId,
          usedById: session.user.id,
          procedureType: data.procedureType,
          procedureNotes: data.procedureNotes,
          verifiedPackage: data.verifiedPackage,
          verificationNotes: data.verificationNotes,
          notes: data.notes,
        },
      }),
      db.instrumentPackage.update({
        where: { id },
        data: {
          status: 'USED',
          updatedBy: session.user.id,
        },
      }),
      // Update instrument set if linked
      ...(pkg.instrumentSetId
        ? [
            db.instrumentSet.update({
              where: { id: pkg.instrumentSetId },
              data: {
                status: 'DIRTY',
                lastUsedAt: new Date(),
                useCount: { increment: 1 },
                updatedBy: session.user.id,
              },
            }),
          ]
        : []),
    ]);

    // Audit log - PHI access
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'PackageUsage',
      entityId: usage.id,
      details: {
        packageId: id,
        packageNumber: pkg.packageNumber,
        patientId: data.patientId,
        appointmentId: data.appointmentId,
        procedureType: data.procedureType,
        cycleNumber: pkg.cycle.cycleNumber,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: usage }, { status: 201 });
  },
  { permissions: ['sterilization:create', 'patients:read'] }
);
